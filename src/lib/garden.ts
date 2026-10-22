import type { Workspace, Plot, Planting, Recommendation } from "./types";

export const DAY = 86_400_000;
export const today = () => new Date().toISOString().slice(0, 10);
export function addDays(value: string, count: number) {
  return new Date(new Date(value + "T12:00:00Z").getTime() + count * DAY)
    .toISOString()
    .slice(0, 10);
}
export function formatDate(value: string, full = false) {
  return new Date(value + "T12:00:00Z").toLocaleDateString("id-ID", {
    day: "numeric",
    month: full ? "long" : "short",
    ...(full ? { year: "numeric" as const } : {}),
  });
}
export function daysBetween(start: string, end = today()) {
  return Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / DAY,
  );
}
export function activePlanting(data: Workspace, plotId: string) {
  return data.plantings
    .filter(
      (p) => p.plotId === plotId && !p.harvestedOn && p.plantedOn <= today(),
    )
    .sort((a, b) => b.plantedOn.localeCompare(a.plantedOn))[0];
}
export function latestSoil(data: Workspace, plotId: string) {
  return data.soilTests
    .filter((s) => s.plotId === plotId)
    .sort(
      (a, b) =>
        b.testedOn.localeCompare(a.testedOn) ||
        b.createdAt.localeCompare(a.createdAt),
    )[0];
}
export function plantingProgress(data: Workspace, planting: Planting) {
  const crop = data.crops.find((c) => c.id === planting.cropId);
  const end =
    planting.expectedHarvestOn ||
    addDays(planting.plantedOn, crop?.daysToHarvest || 60);
  const elapsed = Math.max(0, daysBetween(planting.plantedOn));
  return {
    elapsed,
    end,
    daysLeft: daysBetween(today(), end),
    percent: Math.min(
      100,
      Math.round(
        (elapsed / Math.max(1, daysBetween(planting.plantedOn, end))) * 100,
      ),
    ),
  };
}
export function plotStatus(data: Workspace, plot: Plot) {
  const planting = activePlanting(data, plot.id);
  if (planting)
    return plantingProgress(data, planting).daysLeft <= 0
      ? "Siap panen"
      : "Dalam pertumbuhan";
  return data.plantings.some(
    (p) => p.plotId === plot.id && !p.harvestedOn && p.plantedOn > today(),
  )
    ? "Terjadwal"
    : "Siap ditanam";
}
export function rotationRecommendations(
  data: Workspace,
  plotId: string,
  before?: string,
): Recommendation[] {
  const previous = data.plantings
    .filter((p) => p.plotId === plotId && (!before || p.plantedOn < before))
    .sort((a, b) => b.plantedOn.localeCompare(a.plantedOn))[0];
  const previousCrop = data.crops.find((c) => c.id === previous?.cropId);
  const soil = latestSoil(data, plotId);
  return data.crops
    .map((crop) => {
      const family =
        data.families.find((f) => f.id === crop.familyId)?.name || "";
      const sameFamily = previousCrop?.familyId === crop.familyId;
      const restorative =
        family === "Fabaceae" && previousCrop?.nutrientDemand === "Tinggi";
      let reason = !previousCrop
        ? "Belum ada riwayat tanam. Tanaman ini dapat menjadi awal musim pertamamu."
        : sameFamily
          ? `Masih satu keluarga dengan ${previousCrop.commonName} (${family}). Rotasi ke keluarga lain membantu mengurangi risiko hama dan penyakit.`
          : restorative
            ? `Keluarga berbeda dari ${previousCrop.commonName}. Legum membantu mengikat nitrogen setelah tanaman dengan kebutuhan hara tinggi.`
            : `Keluarga tanaman berbeda dari ${previousCrop.commonName}, membantu memutus siklus hama dan menyeimbangkan kebutuhan hara.`;
      if (soil && soil.ph < 5.5)
        reason += " Perbaiki keasaman tanah sebelum menanam.";
      return {
        crop,
        family,
        recommended: !sameFamily,
        reason,
        score: sameFamily
          ? 0
          : restorative
            ? 100
            : crop.nutrientDemand === "Rendah"
              ? 90
              : crop.nutrientDemand === "Sedang"
                ? 80
                : 70,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.crop.commonName.localeCompare(b.crop.commonName),
    );
}
export function soilCondition(ph: number) {
  return ph >= 6 && ph <= 7
    ? "Optimal"
    : ph >= 5.5 && ph <= 7.5
      ? "Perlu perhatian"
      : "Perlu perbaikan";
}
export function numberID(value: number) {
  return value.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}
