import { db } from "@/db";
import { eq, desc } from "drizzle-orm";
import {
  profiles,
  farms,
  plots,
  plantFamilies,
  crops,
  plantings,
  soilTests,
} from "./schema";
import { ensureSeed, WORKSPACE_OWNER_ID } from "./seed";
import type { Workspace } from "@/lib/types";

export async function getWorkspace(): Promise<Workspace> {
  await ensureSeed();
  const [
    profileRows,
    farmRows,
    plotRows,
    familyRows,
    cropRows,
    plantingRows,
    soilRows,
  ] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, WORKSPACE_OWNER_ID)),
    db
      .select()
      .from(farms)
      .where(eq(farms.ownerId, WORKSPACE_OWNER_ID))
      .orderBy(farms.createdAt),
    db.select().from(plots).orderBy(plots.name),
    db.select().from(plantFamilies).orderBy(plantFamilies.name),
    db.select().from(crops).orderBy(crops.commonName),
    db.select().from(plantings).orderBy(desc(plantings.plantedOn)),
    db
      .select()
      .from(soilTests)
      .orderBy(desc(soilTests.testedOn), desc(soilTests.createdAt)),
  ]);
  const ownedFarmIds = new Set(farmRows.map((f) => f.id));
  const ownedPlots = plotRows.filter((p) => ownedFarmIds.has(p.farmId));
  const ownedPlotIds = new Set(ownedPlots.map((p) => p.id));
  return JSON.parse(
    JSON.stringify({
      profile: profileRows[0],
      farms: farmRows,
      plots: ownedPlots,
      families: familyRows,
      crops: cropRows,
      plantings: plantingRows.filter((p) => ownedPlotIds.has(p.plotId)),
      soilTests: soilRows.filter((s) => ownedPlotIds.has(s.plotId)),
    }),
  ) as Workspace;
}
