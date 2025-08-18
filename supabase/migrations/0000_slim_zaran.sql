CREATE TABLE "pets" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"species" text NOT NULL,
	"age" integer NOT NULL,
	"ownerId" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;