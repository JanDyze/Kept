CREATE TABLE "card_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verses" ADD COLUMN "card" jsonb;--> statement-breakpoint
ALTER TABLE "card_images" ADD CONSTRAINT "card_images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_images_user_idx" ON "card_images" USING btree ("user_id","created_at");