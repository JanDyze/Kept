CREATE TYPE "public"."practice_mode" AS ENUM('read', 'first_letter', 'fill_blank', 'recite');--> statement-breakpoint
CREATE TYPE "public"."review_rating" AS ENUM('again', 'hard', 'good', 'easy');--> statement-breakpoint
CREATE TYPE "public"."verse_status" AS ENUM('new', 'learning', 'review', 'mastered');--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verse_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rating" "review_rating" NOT NULL,
	"mode" "practice_mode" NOT NULL,
	"duration_ms" integer
);
--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "verses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reference" text NOT NULL,
	"book" text NOT NULL,
	"book_number" integer NOT NULL,
	"chapter" integer NOT NULL,
	"verse_start" integer NOT NULL,
	"verse_end" integer,
	"translation" text NOT NULL,
	"text" text NOT NULL,
	"notes" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "verse_status" DEFAULT 'new' NOT NULL,
	"srs" jsonb,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "verses_book_number_range" CHECK ("verses"."book_number" between 1 and 66),
	CONSTRAINT "verses_verse_range" CHECK ("verses"."verse_end" is null or "verses"."verse_end" >= "verses"."verse_start")
);
--> statement-breakpoint
ALTER TABLE "verses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_verse_id_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."verses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verses" ADD CONSTRAINT "verses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_user_reviewed_idx" ON "reviews" USING btree ("user_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "reviews_verse_idx" ON "reviews" USING btree ("verse_id");--> statement-breakpoint
CREATE INDEX "verses_user_due_idx" ON "verses" USING btree ("user_id","due_at");