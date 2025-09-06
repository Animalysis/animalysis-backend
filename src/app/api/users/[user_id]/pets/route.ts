import { db } from "@/lib/db";
import { schema } from "../../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";
import { generate_new_id } from "../../../_utils/util";

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

export async function POST(
    request: NextRequest,
    { params }: { params: { user_id: string } }
) {
    try {
        const { user_id } = params;
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
        const body = await request.json();
        // Validate required fields
        if (
            !body.name ||
            !body.species ||
            !body.breed ||
            !body.age ||
            !body.weight
        ) {
            return NextResponse.json(
                {
                    code: "VALIDATION_ERROR",
                    message: "Missing required pet fields",
                },
                { status: 400 }
            );
        }
        // Insert pet into database
        const newPet = await db
            .insert(petsTable)
            .values({
                id: generate_new_id(),
                name: body.name,
                species: body.species,
                breed: body.breed,
                age: body.age,
                weight: body.weight,
                user_id: user_id,
            })
            .returning();
        return NextResponse.json({ success: true, pet: newPet[0] });
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json(
            {
                code: "DATABASE_ERROR",
                message: "Failed to add pet",
            },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { user_id: string } }
) {
    try {
        // Extract user_id from params safely
        const { user_id } = await params;
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
