CREATE TABLE "app_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "card_likes" (
	"verse_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "card_likes_verse_id_user_id_pk" PRIMARY KEY("verse_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "card_likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "verse_likes" (
	"user_id" uuid NOT NULL,
	"book_number" integer NOT NULL,
	"chapter" integer NOT NULL,
	"verse_start" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verse_likes_user_id_book_number_chapter_verse_start_pk" PRIMARY KEY("user_id","book_number","chapter","verse_start")
);
--> statement-breakpoint
ALTER TABLE "verse_likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "seen_version" text;--> statement-breakpoint
ALTER TABLE "verses" ADD COLUMN "starred_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_events" ADD CONSTRAINT "app_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_likes" ADD CONSTRAINT "card_likes_verse_id_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."verses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_likes" ADD CONSTRAINT "card_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_likes" ADD CONSTRAINT "verse_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_events_created_idx" ON "app_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "app_events_user_idx" ON "app_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "card_likes_user_idx" ON "card_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verse_likes_place_idx" ON "verse_likes" USING btree ("book_number","chapter","verse_start");