-- Category cleanup on stores whose catalog is already seeded (no-ops on a fresh
-- database, where the catalog seed creates these from src/lib/catalog.ts).

-- Air springs had no subcategory of their own.
INSERT INTO "categories" ("slug", "name", "parent_id", "position")
SELECT 'air-springs', 'Air Springs', p."id", 5
FROM "categories" p
WHERE p."slug" = 'brakes-suspension-steering'
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
-- Two subcategories were both called "Doors & Hardware".
UPDATE "categories" SET "name" = 'Cab Doors & Hardware'
WHERE "slug" = 'doors' AND "name" = 'Doors & Hardware';
--> statement-breakpoint
UPDATE "categories" SET "name" = 'Trailer Doors & Hardware'
WHERE "slug" = 'trailer-doors' AND "name" = 'Doors & Hardware';
--> statement-breakpoint
-- The trailer ABS relay valve is an air brake valve, not suspension.
UPDATE "products"
SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'air-brakes')
WHERE "slug" = 'haldex-trailer-brake-valve'
  AND "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'trailer-suspension');
