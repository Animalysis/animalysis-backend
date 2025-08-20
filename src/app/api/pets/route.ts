import { db } from "@/lib/db";
import { schema } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { InsertPet } from "../../../../drizzle/schema";
import { z } from "zod";
import { NextResponse } from "next/server";

const petsTable = schema.petsTable;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schemaValidator = z
      .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        species: z.string().min(2, "Species must be at least 2 characters"),
        age: z.coerce
          .number({
            invalid_type_error: "Age must be a valid number",
          })
          .int()
          .min(0, "Age must be a non-negative integer"),
        user_id: z.coerce
          .number({
            invalid_type_error: "User ID must be a valid numeric identifier",
          })
          .int()
          .positive()
          .refine(async (id) => {
            const result = await db
              .select()
              .from(schema.usersTable)
              .where(eq(schema.usersTable.id, id));
            return result.length > 0;
          }, "User not found"),
      })
      .strict();
    const validated = schemaValidator.parse(body);

    const newPet = await db.transaction(async (tx) => {
      const insertResult = await tx
        .insert(petsTable)
        .values({
          name: validated.name,
          species: validated.species,
          age: validated.age,
          user_id: validated.user_id,
          // Removed manual timestamp handling since Drizzle schema has defaults
        } satisfies InsertPet)
        .returning();

      if (!insertResult[0]?.id) {
        tx.rollback();
        throw new Error("Failed to create pet");
      }
      return insertResult;
    });

    return NextResponse.json(newPet, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          issues: error.errors,
        },
        { status: 400 }
      );
    }
    console.error("Database error:", error);
    return NextResponse.json(
      {
        code: "DATABASE_ERROR",
        message: "Failed to create pet record",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const petsList = await db.select().from(petsTable);
    return NextResponse.json({ data: petsList });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        code: "DATABASE_ERROR",
        message: "Failed to fetch pets",
      },
      { status: 500 }
    );
  }
}
