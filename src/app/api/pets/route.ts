import { db } from '../../../lib/db';
import { schema } from '../../../../drizzle/schema';
import { eq } from 'drizzle-orm'; // Added missing import
import { z } from 'zod';
import { NextResponse } from 'next/server';

const petsTable = schema.petsTable;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schemaValidator = z.object({
      name: z.string().min(1),
      species: z.string().min(1),
      age: z.number().int().min(0),
      ownerId: z.number().int().min(1),
    });
    const validated = schemaValidator.parse(body);

    const newPet = await db
      .insert(petsTable)
      .values(validated as any) // Bypass type mismatch for required fields
      .returning();

    return NextResponse.json(newPet, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idParam = url.pathname.split('/').pop();
  let id: number | null = null;

  if (idParam) {
    id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
  }

  if (id) {
    const [pet] = await db
      .select()
      .from(petsTable)
      .where(eq(petsTable.id, id));

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    return NextResponse.json(pet);
  } else {
    const petsList = await db.select().from(petsTable);
    return NextResponse.json(petsList);
  }
}

export async function PUT(req: Request) {
  const url = new URL(req.url);
  const idParam = url.pathname.split('/').pop();
  const id = Number(idParam);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const schemaValidator = z.object({
      name: z.string().min(1),
      species: z.string().min(1),
      age: z.number().int().min(0),
      ownerId: z.number().int().min(1),
    });
    const validated = schemaValidator.parse(body);

    const updatedPet = await db
      .update(petsTable)
      .set(validated)
      .where(eq(petsTable.id, id))
      .returning();

    if (updatedPet.length === 0) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    return NextResponse.json(updatedPet[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const idParam = url.pathname.split('/').pop();
  const id = Number(idParam);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const deletedPet = await db
      .delete(petsTable)
      .where(eq(petsTable.id, id))
      .returning();

    if (deletedPet.length === 0) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Pet deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}