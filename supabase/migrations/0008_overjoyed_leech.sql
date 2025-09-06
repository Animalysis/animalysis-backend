CREATE TABLE "health_records" (
	"id" text PRIMARY KEY NOT NULL,
	"animal_id" text NOT NULL,
	"animal_name" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" date NOT NULL,
	"veterinarian" text,
	"status" text NOT NULL,
	"priority" text NOT NULL,
	"clinic" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
