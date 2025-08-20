ALTER TABLE "pets" RENAME COLUMN "ownerId" TO "user_id";--> statement-breakpoint
ALTER TABLE "pets" DROP CONSTRAINT "pets_ownerId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "pets" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;