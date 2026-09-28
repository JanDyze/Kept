CREATE TABLE "verse_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verse_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verse_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verse_notes" ADD CONSTRAINT "verse_notes_verse_id_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."verses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_notes" ADD CONSTRAINT "verse_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "verse_notes_verse_idx" ON "verse_notes" USING btree ("verse_id","created_at");--> statement-breakpoint
-- Each existing note becomes the first entry of its verse's thread, dated when the verse was added.
-- verses.notes is left as it was (a backup); the app no longer reads or writes it.
INSERT INTO "verse_notes" ("verse_id", "user_id", "body", "created_at")
SELECT "id", "user_id", btrim("notes"), "created_at" FROM "verses" WHERE "notes" IS NOT NULL AND btrim("notes") <> '';
