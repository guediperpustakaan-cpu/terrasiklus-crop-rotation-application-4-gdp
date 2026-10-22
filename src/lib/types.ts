export interface Profile {
  id: string;
  username: string;
  createdAt: string;
}
export interface Farm {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  createdAt: string;
}
export interface Plot {
  id: string;
  farmId: string;
  name: string;
  area: number;
  soilType: string;
}
export interface PlantFamily {
  id: string;
  name: string;
}
export interface Crop {
  id: string;
  commonName: string;
  familyId: string;
  nutrientDemand: "Tinggi" | "Sedang" | "Rendah";
  daysToHarvest: number;
  image: string;
}
export interface Planting {
  id: string;
  plotId: string;
  cropId: string;
  plantedOn: string;
  harvestedOn: string | null;
  expectedHarvestOn: string | null;
  notes: string;
}
export interface SoilTest {
  id: string;
  plotId: string;
  testedOn: string;
  ph: number;
  n: number;
  p: number;
  k: number;
  organicMatter: number;
  createdAt: string;
}
export interface Workspace {
  profile: Profile;
  farms: Farm[];
  plots: Plot[];
  families: PlantFamily[];
  crops: Crop[];
  plantings: Planting[];
  soilTests: SoilTest[];
}
export interface Recommendation {
  crop: Crop;
  family: string;
  recommended: boolean;
  reason: string;
  score: number;
}
export type Page =
  "dashboard" | "gardens" | "rotation" | "history" | "soil" | "catalog";
export type Mutation = (
  resource: string,
  values: Record<string, unknown>,
  method?: "POST" | "PATCH" | "DELETE",
) => Promise<void>;
export interface PlantingPreset {
  plotId?: string;
  cropId?: string;
  planned?: boolean;
}
