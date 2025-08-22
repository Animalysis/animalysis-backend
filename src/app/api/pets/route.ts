import { db } from "@/lib/db";
import { schema } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { InsertPet } from "../../../../drizzle/schema";
import { z } from "zod";
import { NextResponse } from "next/server";
import { generate_new_id } from "../_utils/util";
import { petResponseSchema } from "../_utils/schema";

const petsTable = schema.petsTable;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schemaValidator = z
      .object({
        name: z.string(),
        species: z.string(),
        breed: z.string(),
        weight: z.coerce.number().positive(),
        age: z.coerce
          .number({
            invalid_type_error: "Age must be a valid number",
          })
          .int()
          .min(0, "Age must be a non-negative integer"),
        user_id: z.string(),
      })
      .strict();
    const validated = schemaValidator.parse(body);

    const newPet = await db.transaction(async (tx) => {
      const insertResult = await tx
        .insert(petsTable)
        .values({
          name: validated.name,
          species: validated.species,
          breed: validated.breed,
          weight: validated.weight,
          age: validated.age,
          user_id: validated.user_id,
          id: generate_new_id(),
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
    return NextResponse.json(petResponseSchema.array().parse(petsList));
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
