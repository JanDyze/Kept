CREATE TABLE "verse_alternatives" (
	"text_hash" text PRIMARY KEY NOT NULL,
	"translation" text NOT NULL,
	"model" text NOT NULL,
	"words" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verse_alternatives" ENABLE ROW LEVEL SECURITY;