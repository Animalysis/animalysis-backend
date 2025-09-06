import {
  pgTable,
  integer,
  text,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

// Define usersTable for foreign key reference
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // internal user id
  clerkId: text("clerk_id").notNull(), // Clerk user id
  name: text("name").notNull(),
});

export const petsTable = pgTable("pets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species").notNull(),
  age: integer("age").notNull(),
  breed: text("breed").notNull(),
  weight: integer("weight").notNull(),
  user_id: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

// Health records table
export const healthRecordsTable = pgTable("health_records", {
  id: text("id").primaryKey(),
  animal_id: text("animal_id").notNull(),
  animal_name: text("animal_name").notNull(),
  type: text("type").notNull(), // vaccination, checkup, treatment, appointment
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  veterinarian: text("veterinarian"),
  status: text("status").notNull().default("scheduled"),
  priority: text("priority").notNull().default("routine"),
  clinic: text("clinic"),
  user_id: text("user_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertPet = typeof petsTable.$inferInsert;
export type SelectPet = typeof petsTable.$inferSelect;

export type InsertHealthRecord = typeof healthRecordsTable.$inferInsert;
export type SelectHealthRecord = typeof healthRecordsTable.$inferSelect;

export const schema = { petsTable, usersTable, healthRecordsTable };
