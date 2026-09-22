CREATE TYPE "public"."gallery_category" AS ENUM('space', 'drinks', 'desserts');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('new', 'read', 'archived');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(160) NOT NULL,
	"name" varchar(120),
	"password_hash" text NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"alt" varchar(300) NOT NULL,
	"caption" varchar(300),
	"category" "gallery_category" DEFAULT 'space' NOT NULL,
	"storage_key" text,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"price_cents" integer NOT NULL,
	"image_url" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_sold_out" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(160) NOT NULL,
	"subject" varchar(200),
	"body" text NOT NULL,
	"status" "message_status" DEFAULT 'new' NOT NULL,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opening_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_of_week" smallint NOT NULL,
	"opens_at" varchar(5) DEFAULT '08:00' NOT NULL,
	"closes_at" varchar(5) DEFAULT '17:00' NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"note" varchar(160)
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" varchar(16) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"address_line1" varchar(160) NOT NULL,
	"address_line2" varchar(160),
	"city" varchar(120) NOT NULL,
	"region" varchar(120),
	"postal_code" varchar(32),
	"country" varchar(2) DEFAULT 'US' NOT NULL,
	"latitude" varchar(32),
	"longitude" varchar(32),
	"map_url" text,
	"neighbourhood_note" text,
	"phone" varchar(40),
	"email" varchar(160) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"announcement" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "gallery_category_idx" ON "gallery_images" USING btree ("category");--> statement-breakpoint
CREATE INDEX "menu_items_category_idx" ON "menu_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "menu_items_featured_idx" ON "menu_items" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_created_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "opening_hours_day_idx" ON "opening_hours" USING btree ("day_of_week");