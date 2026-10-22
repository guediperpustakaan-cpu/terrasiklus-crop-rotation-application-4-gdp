import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  real,
  date,
  integer,
  index,
  check,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const farms = pgTable(
  "farms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    location: text("location").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("farms_owner_idx").on(t.ownerId)],
);

export const plots = pgTable(
  "plots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .references(() => farms.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    area: real("area").notNull(),
    soilType: text("soil_type").notNull(),
  },
  (t) => [
    index("plots_farm_idx").on(t.farmId),
    check("positive_plot_area", sql`${t.area} > 0`),
  ],
);

export const plantFamilies = pgTable("plant_families", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});

export const crops = pgTable(
  "crops",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    commonName: text("common_name").notNull().unique(),
    familyId: uuid("family_id")
      .references(() => plantFamilies.id)
      .notNull(),
    nutrientDemand: text("nutrient_demand", {
      enum: ["Tinggi", "Sedang", "Rendah"],
    }).notNull(),
    daysToHarvest: integer("days_to_harvest").notNull().default(60),
    image: text("image").notNull().default("/images/garden.jpg"),
  },
  (t) => [
    check(
      "valid_nutrient_demand",
      sql`${t.nutrientDemand} in ('Tinggi', 'Sedang', 'Rendah')`,
    ),
  ],
);

export const plantings = pgTable(
  "plantings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    plotId: uuid("plot_id")
      .references(() => plots.id, { onDelete: "cascade" })
      .notNull(),
    cropId: uuid("crop_id")
      .references(() => crops.id)
      .notNull(),
    plantedOn: date("planted_on").notNull(),
    harvestedOn: date("harvested_on"),
    expectedHarvestOn: date("expected_harvest_on"),
    notes: text("notes").notNull().default(""),
  },
  (t) => [
    index("plantings_plot_date_idx").on(t.plotId, t.plantedOn),
    check(
      "valid_harvest_date",
      sql`${t.harvestedOn} is null or ${t.harvestedOn} >= ${t.plantedOn}`,
    ),
    check(
      "valid_expected_harvest",
      sql`${t.expectedHarvestOn} is null or ${t.expectedHarvestOn} >= ${t.plantedOn}`,
    ),
  ],
);

export const soilTests = pgTable(
  "soil_tests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    plotId: uuid("plot_id")
      .references(() => plots.id, { onDelete: "cascade" })
      .notNull(),
    testedOn: date("tested_on").notNull(),
    ph: real("ph").notNull(),
    n: real("n").notNull(),
    p: real("p").notNull(),
    k: real("k").notNull(),
    organicMatter: real("organic_matter").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("soil_tests_plot_date_idx").on(t.plotId, t.testedOn),
    check("valid_ph", sql`${t.ph} >= 0 and ${t.ph} <= 14`),
    check(
      "valid_soil_nutrients",
      sql`${t.n} >= 0 and ${t.p} >= 0 and ${t.k} >= 0`,
    ),
    check(
      "valid_organic_matter",
      sql`${t.organicMatter} >= 0 and ${t.organicMatter} <= 100`,
    ),
  ],
);
