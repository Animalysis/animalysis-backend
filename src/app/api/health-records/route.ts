import { db } from "@/lib/db";
import { schema } from "../../../../drizzle/schema";
import { eq, and, or, desc, gte, lte, sql } from "drizzle-orm";
import type { InsertHealthRecord } from "../../../../drizzle/schema";
import { z } from "zod";
import { NextResponse } from "next/server";
import { generate_new_id } from "../_utils/util";
import { 
  healthRecordResponseSchema, 
  healthRecordCreateSchema,
  healthRecordUpdateSchema,
  type HealthRecordCreate
} from "../_utils/schema";

const healthRecordsTable = schema.healthRecordsTable;

// GET /api/health-records - Get all health records with optional filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const animal = searchParams.get("animal");
    const type = searchParams.get("type");
    
    // Build where conditions
    const conditions = [];
    
    if (animal) {
      conditions.push(eq(healthRecordsTable.animal_name, animal));
    }
    
    if (type && ["vaccination", "checkup", "treatment", "appointment"].includes(type)) {
      conditions.push(eq(healthRecordsTable.type, type as any));
    }
    
    const healthRecords = await db.select()
      .from(healthRecordsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(healthRecordsTable.date));
    
    // Transform to response format
    const transformedRecords = healthRecords.map(record => ({
      id: record.id,
      animalId: record.animal_id,
      animalName: record.animal_name,
      type: record.type,
      title: record.title,
      description: record.description,
      date: record.date,
      veterinarian: record.veterinarian,
      clinic: record.clinic,
      status: record.status,
      priority: record.priority,
      userId: record.user_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));
    
    return NextResponse.json(
      healthRecordResponseSchema.array().parse(transformedRecords)
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        code: "DATABASE_ERROR",
        message: "Failed to fetch health records",
      },
      { status: 500 }
    );
  }
}

// POST /api/health-records - Create new health record
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = healthRecordCreateSchema.parse(body);

    const newRecord = await db.transaction(async (tx) => {
      const insertResult = await tx
        .insert(healthRecordsTable)
        .values({
          id: generate_new_id(),
          animal_id: validated.animalId,
          animal_name: validated.animalName,
          type: validated.type,
          title: validated.title,
          description: validated.description || null,
          date: validated.date,
          veterinarian: validated.veterinarian || null,
          clinic: validated.clinic || null,
          status: validated.status,
          priority: validated.priority,
          user_id: validated.userId,
        } satisfies InsertHealthRecord)
        .returning();

      if (!insertResult[0]?.id) {
        tx.rollback();
        throw new Error("Failed to create health record");
      }
      return insertResult[0];
    });

    // Transform to response format
    const responseRecord = {
      id: newRecord.id,
      animalId: newRecord.animal_id,
      animalName: newRecord.animal_name,
      type: newRecord.type,
      title: newRecord.title,
      description: newRecord.description,
      date: newRecord.date,
      veterinarian: newRecord.veterinarian,
      clinic: newRecord.clinic,
      status: newRecord.status,
      priority: newRecord.priority,
      userId: newRecord.user_id,
      createdAt: newRecord.created_at,
      updatedAt: newRecord.updated_at,
    };

    return NextResponse.json(
      healthRecordResponseSchema.parse(responseRecord),
      { status: 201 }
    );
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
        message: "Failed to create health record",
      },
      { status: 500 }
    );
  }
}