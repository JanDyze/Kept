CREATE TYPE "public"."game_kind" AS ENUM('missing_word', 'reference_wordle', 'fill_blanks', 'unscramble');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('in_progress', 'won', 'lost');--> statement-breakpoint
ALTER TYPE "public"."practice_mode" ADD VALUE 'unscramble';--> statement-breakpoint
CREATE TABLE "daily_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"game" "game_kind" NOT NULL,
	"verse_ids" uuid[] NOT NULL,
	"puzzle" jsonb NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "game_status" DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "daily_games" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_games" ADD CONSTRAINT "daily_games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_games_user_day_game_idx" ON "daily_games" USING btree ("user_id","day","game");