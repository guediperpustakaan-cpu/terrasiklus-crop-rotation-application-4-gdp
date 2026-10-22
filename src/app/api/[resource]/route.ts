import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { farms, plots, plantings, soilTests, profiles } from "@/db/schema";
import { getWorkspace } from "@/db/workspace";
import { WORKSPACE_OWNER_ID } from "@/db/seed";
import { addDays, today, rotationRecommendations } from "@/lib/garden";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ resource: string }> };
class InputError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function text(value: unknown, label: string, max = 120, min = 1) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new InputError(`${label} harus berisi ${min}–${max} karakter.`);
  return value.trim();
}
function number(value: unknown, label: string, min = 0, max = 1_000_000) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw new InputError(
      `${label} harus berupa angka antara ${min} dan ${max}.`,
    );
  return value;
}
function date(value: unknown, label: string) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw new InputError(`${label} tidak valid.`);
  return value;
}
function uuid(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new InputError("ID data tidak valid.");
  return value;
}
function fail(error: unknown) {
  if (error instanceof InputError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Format permintaan tidak valid." },
      { status: 400 },
    );
  console.error("TerraSiklus API:", error);
  return NextResponse.json(
    { error: "Data belum dapat disimpan. Silakan coba kembali." },
    { status: 500 },
  );
}
async function body(request: NextRequest): Promise<Record<string, unknown>> {
  const value = await request.json();
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new InputError("Data permintaan tidak valid.");
  return value;
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { resource } = await context.params;
    const data = await getWorkspace();
    if (resource === "workspace") return NextResponse.json(data);
    if (resource === "rotation") {
      const plotId = uuid(request.nextUrl.searchParams.get("plotId"));
      if (!data.plots.some((p) => p.id === plotId))
        throw new InputError("Petak tidak ditemukan.", 404);
      const before = request.nextUrl.searchParams.get("date");
      return NextResponse.json(
        rotationRecommendations(
          data,
          plotId,
          before ? date(before, "Tanggal rencana") : undefined,
        ),
      );
    }
    const resources: Record<string, unknown> = {
      farms: data.farms,
      plots: data.plots,
      crops: data.crops,
      "plant-families": data.families,
      plantings: data.plantings,
      "soil-tests": data.soilTests,
      profiles: data.profile,
    };
    if (!(resource in resources))
      throw new InputError("Halaman API tidak ditemukan.", 404);
    return NextResponse.json(resources[resource]);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { resource } = await context.params;
    const input = await body(request);
    const data = await getWorkspace();
    if (resource === "farms") {
      const [item] = await db
        .insert(farms)
        .values({
          ownerId: WORKSPACE_OWNER_ID,
          name: text(input.name, "Nama kebun"),
          location: text(input.location, "Lokasi", 200),
        })
        .returning();
      return NextResponse.json(item, { status: 201 });
    }
    if (resource === "plots") {
      const farmId = uuid(input.farmId);
      if (!data.farms.some((f) => f.id === farmId))
        throw new InputError("Kebun tidak ditemukan.", 404);
      const [item] = await db
        .insert(plots)
        .values({
          farmId,
          name: text(input.name, "Nama petak", 80),
          area: number(input.area, "Luas petak", 0.1),
          soilType: text(input.soilType, "Jenis tanah", 80),
        })
        .returning();
      return NextResponse.json(item, { status: 201 });
    }
    if (resource === "plantings" || resource === "soil-tests") {
      const plotId = uuid(input.plotId);
      if (!data.plots.some((p) => p.id === plotId))
        throw new InputError("Petak tidak ditemukan.", 404);
      if (resource === "soil-tests") {
        const testedOn = date(input.testedOn, "Tanggal uji");
        if (testedOn > today())
          throw new InputError("Tanggal uji tidak boleh di masa depan.");
        const [item] = await db
          .insert(soilTests)
          .values({
            plotId,
            testedOn,
            ph: number(input.ph, "pH", 0, 14),
            n: number(input.n, "Nitrogen", 0, 100000),
            p: number(input.p, "Fosfor", 0, 100000),
            k: number(input.k, "Kalium", 0, 100000),
            organicMatter: number(input.organicMatter, "Bahan organik", 0, 100),
          })
          .returning();
        return NextResponse.json(item, { status: 201 });
      }
      const cropId = uuid(input.cropId);
      const crop = data.crops.find((c) => c.id === cropId);
      if (!crop) throw new InputError("Tanaman tidak ditemukan.", 404);
      const plantedOn = date(input.plantedOn, "Tanggal tanam");
      const expectedHarvestOn = input.expectedHarvestOn
        ? date(input.expectedHarvestOn, "Perkiraan panen")
        : addDays(plantedOn, crop.daysToHarvest);
      const harvestedOn = input.harvestedOn
        ? date(input.harvestedOn, "Tanggal panen")
        : null;
      if (
        expectedHarvestOn < plantedOn ||
        (harvestedOn && harvestedOn < plantedOn)
      )
        throw new InputError(
          "Tanggal panen tidak boleh sebelum tanggal tanam.",
        );
      if (harvestedOn && harvestedOn > today())
        throw new InputError("Panen aktual tidak boleh dicatat di masa depan.");
      const item = await db.transaction(async (tx) => {
        // Lock the plot so simultaneous requests cannot create overlapping seasons.
        const locked = await tx
          .select({ id: plots.id })
          .from(plots)
          .where(eq(plots.id, plotId))
          .for("update");
        if (!locked.length) throw new InputError("Petak tidak ditemukan.", 404);
        const currentPlantings = await tx
          .select()
          .from(plantings)
          .where(eq(plantings.plotId, plotId));
        const currentData = { ...data, plantings: currentPlantings };
        if (
          !harvestedOn &&
          plantedOn <= today() &&
          currentPlantings.some((p) => !p.harvestedOn && p.plantedOn <= today())
        ) {
          throw new InputError(
            "Masih ada tanaman aktif di petak ini. Catat panennya terlebih dahulu, atau jadwalkan musim baru setelah perkiraan panen.",
            409,
          );
        }
        const end = harvestedOn || expectedHarvestOn;
        const overlapping = currentPlantings.some(
          (p) =>
            plantedOn <=
              (p.harvestedOn || p.expectedHarvestOn || "9999-12-31") &&
            end >= p.plantedOn,
        );
        if (overlapping)
          throw new InputError(
            "Petak ini sudah memiliki penanaman pada periode tersebut. Pilih tanggal setelah panen atau petak lain.",
            409,
          );
        const recommendation = rotationRecommendations(
          currentData,
          plotId,
          plantedOn,
        ).find((r) => r.crop.id === cropId);
        if (
          recommendation &&
          !recommendation.recommended &&
          input.allowRepeat !== true
        )
          throw new InputError(
            "Keluarga tanaman sama dengan musim sebelumnya. Pilih tanaman lain atau konfirmasikan peringatan rotasi.",
            409,
          );
        const [created] = await tx
          .insert(plantings)
          .values({
            plotId,
            cropId,
            plantedOn,
            expectedHarvestOn,
            harvestedOn,
            notes: input.notes ? text(input.notes, "Catatan", 2000, 0) : "",
          })
          .returning();
        return created;
      });
      return NextResponse.json(item, { status: 201 });
    }
    throw new InputError("Jenis data tidak ditemukan.", 404);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { resource } = await context.params;
    const input = await body(request);
    const data = await getWorkspace();
    if (resource === "profiles") {
      const [item] = await db
        .update(profiles)
        .set({ username: text(input.username, "Nama", 80, 2) })
        .where(eq(profiles.id, WORKSPACE_OWNER_ID))
        .returning();
      return NextResponse.json(item);
    }
    const id = uuid(input.id);
    if (resource === "plantings") {
      const existing = data.plantings.find((p) => p.id === id);
      if (!existing) throw new InputError("Penanaman tidak ditemukan.", 404);
      const harvestedOn = input.harvestedOn
        ? date(input.harvestedOn, "Tanggal panen")
        : existing.harvestedOn;
      if (
        harvestedOn &&
        (harvestedOn < existing.plantedOn || harvestedOn > today())
      )
        throw new InputError(
          "Tanggal panen harus antara tanggal tanam dan hari ini.",
        );
      const [item] = await db
        .update(plantings)
        .set({
          harvestedOn,
          notes:
            input.notes !== undefined
              ? text(input.notes, "Catatan", 2000, 0)
              : existing.notes,
        })
        .where(eq(plantings.id, id))
        .returning();
      return NextResponse.json(item);
    }
    if (resource === "plots") {
      if (!data.plots.some((p) => p.id === id))
        throw new InputError("Petak tidak ditemukan.", 404);
      const [item] = await db
        .update(plots)
        .set({
          name: text(input.name, "Nama petak", 80),
          area: number(input.area, "Luas petak", 0.1),
          soilType: text(input.soilType, "Jenis tanah", 80),
        })
        .where(eq(plots.id, id))
        .returning();
      return NextResponse.json(item);
    }
    if (resource === "farms") {
      if (!data.farms.some((f) => f.id === id))
        throw new InputError("Kebun tidak ditemukan.", 404);
      const [item] = await db
        .update(farms)
        .set({
          name: text(input.name, "Nama kebun"),
          location: text(input.location, "Lokasi", 200),
        })
        .where(eq(farms.id, id))
        .returning();
      return NextResponse.json(item);
    }
    throw new InputError("Jenis data tidak ditemukan.", 404);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { resource } = await context.params;
    const input = await body(request);
    const id = uuid(input.id);
    const data = await getWorkspace();
    if (resource === "farms" && data.farms.some((f) => f.id === id))
      await db.delete(farms).where(eq(farms.id, id));
    else if (resource === "plots" && data.plots.some((p) => p.id === id))
      await db.delete(plots).where(eq(plots.id, id));
    else if (
      resource === "plantings" &&
      data.plantings.some((p) => p.id === id)
    )
      await db.delete(plantings).where(eq(plantings.id, id));
    else if (
      resource === "soil-tests" &&
      data.soilTests.some((s) => s.id === id)
    )
      await db.delete(soilTests).where(eq(soilTests.id, id));
    else throw new InputError("Data tidak ditemukan.", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(error);
  }
}
