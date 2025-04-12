ALTER TABLE "event_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "item_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "item_history" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "event_members" CASCADE;--> statement-breakpoint
DROP TABLE "item_categories" CASCADE;--> statement-breakpoint
DROP TABLE "item_history" CASCADE;--> statement-breakpoint
DROP TABLE "notifications" CASCADE;--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_category_id_item_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "category_id";