ALTER TABLE "site_settings" ADD COLUMN "seo_title" varchar(160) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "seo_description" varchar(320) DEFAULT '' NOT NULL;