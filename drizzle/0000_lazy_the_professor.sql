CREATE TABLE "crops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"common_name" text NOT NULL,
	"family_id" uuid NOT NULL,
	"nutrient_demand" text NOT NULL,
	"days_to_harvest" integer DEFAULT 60 NOT NULL,
	"image" text DEFAULT '/images/garden.jpg' NOT NULL,
	CONSTRAINT "crops_common_name_unique" UNIQUE("common_name"),
	CONSTRAINT "valid_nutrient_demand" CHECK ("crops"."nutrient_demand" in ('Tinggi', 'Sedang', 'Rendah'))
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plant_families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "plant_families_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "plantings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plot_id" uuid NOT NULL,
	"crop_id" uuid NOT NULL,
	"planted_on" date NOT NULL,
	"harvested_on" date,
	"expected_harvest_on" date,
	"notes" text DEFAULT '' NOT NULL,
	CONSTRAINT "valid_harvest_date" CHECK ("plantings"."harvested_on" is null or "plantings"."harvested_on" >= "plantings"."planted_on"),
	CONSTRAINT "valid_expected_harvest" CHECK ("plantings"."expected_harvest_on" is null or "plantings"."expected_harvest_on" >= "plantings"."planted_on")
);
--> statement-breakpoint
CREATE TABLE "plots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"area" real NOT NULL,
	"soil_type" text NOT NULL,
	CONSTRAINT "positive_plot_area" CHECK ("plots"."area" > 0)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soil_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plot_id" uuid NOT NULL,
	"tested_on" date NOT NULL,
	"ph" real NOT NULL,
	"n" real NOT NULL,
	"p" real NOT NULL,
	"k" real NOT NULL,
	"organic_matter" real NOT NULL,
	CONSTRAINT "valid_ph" CHECK ("soil_tests"."ph" >= 0 and "soil_tests"."ph" <= 14),
	CONSTRAINT "valid_soil_nutrients" CHECK ("soil_tests"."n" >= 0 and "soil_tests"."p" >= 0 and "soil_tests"."k" >= 0),
	CONSTRAINT "valid_organic_matter" CHECK ("soil_tests"."organic_matter" >= 0 and "soil_tests"."organic_matter" <= 100)
);
--> statement-breakpoint
ALTER TABLE "crops" ADD CONSTRAINT "crops_family_id_plant_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."plant_families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soil_tests" ADD CONSTRAINT "soil_tests_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "farms_owner_idx" ON "farms" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "plantings_plot_date_idx" ON "plantings" USING btree ("plot_id","planted_on");--> statement-breakpoint
CREATE INDEX "plots_farm_idx" ON "plots" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "soil_tests_plot_date_idx" ON "soil_tests" USING btree ("plot_id","tested_on");