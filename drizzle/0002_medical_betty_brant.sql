ALTER TABLE "products" ADD COLUMN "set_contents" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "hero_title_accent" varchar(160) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "about_bullets" text DEFAULT '' NOT NULL;