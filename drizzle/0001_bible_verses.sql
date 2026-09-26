CREATE TABLE "bible_verses" (
	"translation" text NOT NULL,
	"book_number" integer NOT NULL,
	"chapter" integer NOT NULL,
	"verse" integer NOT NULL,
	"verse_end" integer NOT NULL,
	"text" text NOT NULL,
	CONSTRAINT "bible_verses_translation_book_number_chapter_verse_pk" PRIMARY KEY("translation","book_number","chapter","verse")
);
--> statement-breakpoint
ALTER TABLE "bible_verses" ENABLE ROW LEVEL SECURITY;