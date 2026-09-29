CREATE TABLE "game_stars" (
	"user_id" uuid NOT NULL,
	"game" "game_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_stars_user_id_game_pk" PRIMARY KEY("user_id","game")
);
--> statement-breakpoint
ALTER TABLE "game_stars" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "game_stars" ADD CONSTRAINT "game_stars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;