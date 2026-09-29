CREATE TABLE "tips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"kind" text NOT NULL,
	"from_name" text,
	"email" text,
	"message" text,
	"amount_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"monthly" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "tips_source_external_idx" ON "tips" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "tips_paid_idx" ON "tips" USING btree ("paid_at");