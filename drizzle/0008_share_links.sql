ALTER TABLE "verses" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "verses" ADD CONSTRAINT "verses_share_token_unique" UNIQUE("share_token");