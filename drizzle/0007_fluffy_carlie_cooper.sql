CREATE TABLE "product_cross_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"brand" text,
	"part_numbers" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "manufacturer" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "vmrs_code" text;--> statement-breakpoint
ALTER TABLE "product_cross_references" ADD CONSTRAINT "product_cross_references_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_cross_refs_product_idx" ON "product_cross_references" USING btree ("product_id");