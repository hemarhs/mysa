CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'confirmed', 'declined', 'cancelled');--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(160) NOT NULL,
	"phone" varchar(40),
	"party_size" smallint NOT NULL,
	"date" varchar(10) NOT NULL,
	"time" varchar(5) NOT NULL,
	"occasion" varchar(80),
	"notes" text,
	"status" "reservation_status" DEFAULT 'pending' NOT NULL,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "reservations_status_idx" ON "reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reservations_date_idx" ON "reservations" USING btree ("date");