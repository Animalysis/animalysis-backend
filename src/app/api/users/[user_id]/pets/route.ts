import { db } from "@/lib/db";
import { schema } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";

const petsTable = schema.petsTable;

const userIdSchema = z.string();

const PetResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  species: z.string(),
  age: z.number(),
  user_id: z.string().uuid(),
});

export type PetResponse = z.infer<typeof PetResponseSchema>;

import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  try {
    // Extract user_id from params safely
    const user_id = await params?.user_id;
    const validationResult = userIdSchema.safeParse(user_id);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          issues: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const pets = await db
      .select({
        id: petsTable.id,
        name: petsTable.name,
        species: petsTable.species,
        breed: petsTable.breed,
        weight: petsTable.weight,
        age: petsTable.age,
        user_id: petsTable.user_id,
      })
      .from(petsTable)
      .where(eq(petsTable.user_id, user_id));

    return NextResponse.json(pets);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        code: "DATABASE_ERROR",
        message: "Failed to fetch user pets",
      },
      { status: 500 }
    );
  }
}
