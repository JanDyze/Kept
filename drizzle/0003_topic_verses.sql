CREATE TABLE "topic_verses" (
	"topic" text NOT NULL,
	"book_number" integer NOT NULL,
	"chapter" integer NOT NULL,
	"verse_start" integer NOT NULL,
	"verse_end" integer,
	"votes" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "topic_verses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "topic_verses_topic_idx" ON "topic_verses" USING btree ("topic","votes");