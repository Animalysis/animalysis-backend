import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";

// Define usersTable for foreign key reference
export const usersTable = pgTable("users", {
  id: integer("id").primaryKey(),
});

export const petsTable = pgTable("pets", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species").notNull(),
  age: integer("age").notNull(),
  ownerId: integer("ownerId")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertPet = typeof petsTable.$inferInsert;
export type SelectPet = typeof petsTable.$inferSelect;

export const schema = { petsTable, usersTable };