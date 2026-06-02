ALTER TABLE "enrollment_status_history"
  RENAME COLUMN "from_status" TO "old_status";--> statement-breakpoint
ALTER TABLE "enrollment_status_history"
  RENAME COLUMN "to_status" TO "new_status";--> statement-breakpoint
ALTER TABLE "enrollment_status_history"
  ALTER COLUMN "changed_by" TYPE uuid USING "changed_by"::uuid;--> statement-breakpoint
ALTER TABLE "enrollment_status_history"
  ALTER COLUMN "changed_at" TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrollment_status_history"
  ADD CONSTRAINT "enrollment_status_history_changed_by_user_id_fk"
  FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
