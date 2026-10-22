import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import {
  profiles,
  farms,
  plots,
  plantFamilies,
  crops,
  plantings,
  soilTests,
} from "./schema";
import { addDays, today } from "@/lib/garden";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const WORKSPACE_OWNER_ID = id(1);
let seedPromise: Promise<void> | undefined;

export function ensureSeed() {
  if (!seedPromise)
    seedPromise = seed().catch((error) => {
      seedPromise = undefined;
      throw error;
    });
  return seedPromise;
}

async function seed() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(72816403)`);
    const [existing] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.id, WORKSPACE_OWNER_ID));
    if (existing) return;
    await tx
      .insert(profiles)
      .values({ id: WORKSPACE_OWNER_ID, username: "Andi Pratama" });
    await tx
      .insert(plantFamilies)
      .values([
        { id: id(100), name: "Solanaceae" },
        { id: id(101), name: "Brassicaceae" },
        { id: id(102), name: "Apiaceae" },
        { id: id(103), name: "Fabaceae" },
        { id: id(104), name: "Cucurbitaceae" },
        { id: id(105), name: "Amaranthaceae" },
        { id: id(106), name: "Amaryllidaceae" },
        { id: id(107), name: "Asteraceae" },
      ])
      .onConflictDoNothing();
    await tx
      .insert(crops)
      .values([
        {
          id: id(200),
          commonName: "Tomat ceri",
          familyId: id(100),
          nutrientDemand: "Tinggi",
          daysToHarvest: 75,
          image: "/images/tomato.jpg",
        },
        {
          id: id(201),
          commonName: "Pakcoy",
          familyId: id(101),
          nutrientDemand: "Sedang",
          daysToHarvest: 35,
          image: "/images/pakcoy.jpg",
        },
        {
          id: id(202),
          commonName: "Wortel",
          familyId: id(102),
          nutrientDemand: "Sedang",
          daysToHarvest: 80,
          image: "/images/carrot.jpg",
        },
        {
          id: id(203),
          commonName: "Kacang panjang",
          familyId: id(103),
          nutrientDemand: "Rendah",
          daysToHarvest: 55,
          image: "/images/garden.jpg",
        },
        {
          id: id(204),
          commonName: "Buncis",
          familyId: id(103),
          nutrientDemand: "Rendah",
          daysToHarvest: 50,
          image: "/images/garden.jpg",
        },
        {
          id: id(205),
          commonName: "Cabai merah",
          familyId: id(100),
          nutrientDemand: "Tinggi",
          daysToHarvest: 90,
          image: "/images/tomato.jpg",
        },
        {
          id: id(206),
          commonName: "Terong",
          familyId: id(100),
          nutrientDemand: "Tinggi",
          daysToHarvest: 85,
          image: "/images/garden.jpg",
        },
        {
          id: id(207),
          commonName: "Mentimun",
          familyId: id(104),
          nutrientDemand: "Tinggi",
          daysToHarvest: 45,
          image: "/images/garden.jpg",
        },
        {
          id: id(208),
          commonName: "Bayam",
          familyId: id(105),
          nutrientDemand: "Sedang",
          daysToHarvest: 30,
          image: "/images/pakcoy.jpg",
        },
        {
          id: id(209),
          commonName: "Bawang merah",
          familyId: id(106),
          nutrientDemand: "Sedang",
          daysToHarvest: 70,
          image: "/images/garden.jpg",
        },
        {
          id: id(210),
          commonName: "Selada",
          familyId: id(107),
          nutrientDemand: "Rendah",
          daysToHarvest: 40,
          image: "/images/pakcoy.jpg",
        },
        {
          id: id(211),
          commonName: "Brokoli",
          familyId: id(101),
          nutrientDemand: "Tinggi",
          daysToHarvest: 80,
          image: "/images/pakcoy.jpg",
        },
      ])
      .onConflictDoNothing();
    await tx
      .insert(farms)
      .values({
        id: id(10),
        ownerId: WORKSPACE_OWNER_ID,
        name: "Kebun Belakang Rumah",
        location: "Bandung, Jawa Barat",
      });
    await tx.insert(plots).values([
      {
        id: id(20),
        farmId: id(10),
        name: "Petak A",
        area: 12,
        soilType: "Lempung",
      },
      {
        id: id(21),
        farmId: id(10),
        name: "Petak B",
        area: 8,
        soilType: "Lempung berpasir",
      },
      {
        id: id(22),
        farmId: id(10),
        name: "Petak C",
        area: 10,
        soilType: "Lempung",
      },
      {
        id: id(23),
        farmId: id(10),
        name: "Petak D",
        area: 6,
        soilType: "Liat",
      },
    ]);
    const date = today();
    await tx.insert(plantings).values([
      {
        id: id(300),
        plotId: id(20),
        cropId: id(200),
        plantedOn: addDays(date, -35),
        expectedHarvestOn: addDays(date, 40),
        notes: "Pertumbuhan baik. Tambahkan ajir untuk menopang batang.",
      },
      {
        id: id(301),
        plotId: id(21),
        cropId: id(201),
        plantedOn: addDays(date, -36),
        expectedHarvestOn: addDays(date, -1),
        notes: "Daun segar dan sehat, sudah siap dipanen.",
      },
      {
        id: id(302),
        plotId: id(22),
        cropId: id(202),
        plantedOn: addDays(date, -48),
        expectedHarvestOn: addDays(date, 32),
        notes: "Jaga kelembapan tanah dan bersihkan gulma secara berkala.",
      },
      {
        id: id(303),
        plotId: id(20),
        cropId: id(204),
        plantedOn: addDays(date, -130),
        harvestedOn: addDays(date, -80),
        expectedHarvestOn: addDays(date, -80),
        notes: "Panen baik, tidak ada serangan hama.",
      },
      {
        id: id(304),
        plotId: id(21),
        cropId: id(202),
        plantedOn: addDays(date, -150),
        harvestedOn: addDays(date, -70),
        expectedHarvestOn: addDays(date, -70),
        notes:
          "Sebagian kecil daun terkena kutu daun; ditangani secara manual.",
      },
      {
        id: id(305),
        plotId: id(22),
        cropId: id(208),
        plantedOn: addDays(date, -100),
        harvestedOn: addDays(date, -70),
        expectedHarvestOn: addDays(date, -70),
        notes: "Kompos diberikan sebelum tanam.",
      },
      {
        id: id(306),
        plotId: id(23),
        cropId: id(205),
        plantedOn: addDays(date, -120),
        harvestedOn: addDays(date, -30),
        expectedHarvestOn: addDays(date, -30),
        notes:
          "Ada gejala layu di akhir musim. Hindari Solanaceae pada musim berikutnya.",
      },
    ]);
    const readings = [6.5, 6.8, 6.7, 5.8];
    await tx.insert(soilTests).values(
      readings.flatMap((ph, i) => [
        {
          id: id(400 + i),
          plotId: id(20 + i),
          testedOn: addDays(date, i === 3 ? -95 : -7),
          ph,
          n: 35 + i * 3,
          p: 24 + i * 2,
          k: 180 + i * 15,
          organicMatter: 3.8 - i * 0.3,
        },
        {
          id: id(410 + i),
          plotId: id(20 + i),
          testedOn: addDays(date, -125),
          ph: ph - 0.2,
          n: 29 + i * 3,
          p: 20 + i * 2,
          k: 165 + i * 15,
          organicMatter: 3.3 - i * 0.3,
        },
        {
          id: id(420 + i),
          plotId: id(20 + i),
          testedOn: addDays(date, -160),
          ph: ph - 0.4,
          n: 25 + i * 3,
          p: 18 + i * 2,
          k: 150 + i * 15,
          organicMatter: 3.0 - i * 0.3,
        },
      ]),
    );
  });
}
