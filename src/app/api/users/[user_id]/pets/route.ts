import { db } from "@/lib/db";
import { schema } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";

const usersTable = schema.usersTable;
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

export async function GET(
  req: Request,
  { params }: { params: { user_id: string } }
) {
  try {
    // Validate user_id format
    const validationResult = userIdSchema.safeParse(params.user_id);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          issues: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const user = await db.transaction(async (tx) => {
      const pets = await tx
        .select()
        .from(petsTable)
        .where(eq(petsTable.user_id, params.user_id));

      return { pets };
    });

    if (!user) {
      return NextResponse.json(
        {
          code: "NOT_FOUND",
          message: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user.pets });
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
