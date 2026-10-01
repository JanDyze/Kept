ALTER TABLE "notification_prefs" ALTER COLUMN "email" SET DEFAULT true;--> statement-breakpoint
-- Rows made before email could be switched were saved with the old default (off): turn them on.
UPDATE "notification_prefs" SET "email" = true WHERE "email" = false AND "updated_at" < '2026-10-02';
