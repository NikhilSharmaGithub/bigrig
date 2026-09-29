-- Demo products were seeded with made-up star ratings and review counts.
-- A product's rating must come from its reviews only (recomputeProductRating),
-- so clear it wherever no review exists.
UPDATE "products"
SET "rating_avg" = 0, "rating_count" = 0
WHERE NOT EXISTS (SELECT 1 FROM "reviews" r WHERE r."product_id" = "products"."id");
