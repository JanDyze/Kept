CREATE TABLE IF NOT EXISTS "highlights" (
	"user_id" uuid NOT NULL,
	"book_number" integer NOT NULL,
	"chapter" integer NOT NULL,
	"verse" integer NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "highlights_user_id_book_number_chapter_verse_pk" PRIMARY KEY("user_id","book_number","chapter","verse")
);
--> statement-breakpoint
ALTER TABLE "highlights" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "card_likes" ADD COLUMN IF NOT EXISTS "reaction" text DEFAULT 'heart' NOT NULL;--> statement-breakpoint
ALTER TABLE "verses" ADD COLUMN IF NOT EXISTS "reaction" text;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "highlights" ADD CONSTRAINT "highlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "highlights_user_created_idx" ON "highlights" USING btree ("user_id","created_at");
