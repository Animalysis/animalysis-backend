import { db } from "@/lib/db";
import { schema } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm"; // Added missing import
import { z } from "zod";
import { NextResponse } from "next/server";

const petsTable = schema.petsTable;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schemaValidator = z.object({
      name: z.string().min(1),
      species: z.string().min(1),
      age: z.number().int().min(0),
      ownerId: z.string().min(1),
    });
    const validated = schemaValidator.parse(body);

    const newPet = await db
      .insert(petsTable)
      .values(validated as any) // Bypass type mismatch for required fields
      .returning();

    return NextResponse.json(newPet, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
}

export async function GET() {
  const petsList = await db.select().from(petsTable);
  return NextResponse.json(petsList);
}
