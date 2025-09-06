import { db } from "@/lib/db";
import { schema } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { InsertHealthRecord } from "../../../../../drizzle/schema";
import { z } from "zod";
import { NextResponse } from "next/server";
import { 
  healthRecordResponseSchema,
  healthRecordUpdateSchema,
  type HealthRecordUpdate
} from "../../_utils/schema";

const healthRecordsTable = schema.healthRecordsTable;

// GET /api/health-records/{record_id} - Get specific health record
export async function GET(
  req: Request,
  { params }: { params: { record_id: string } }
) {
  try {
    const recordId = params.record_id;
    
    const record = await db
      .select()
      .from(healthRecordsTable)
      .where(eq(healthRecordsTable.id, recordId));

    if (!record.length) {
      return NextResponse.json(
        {
          code: "NOT_FOUND",
          message: "Health record not found",
        },
        { status: 404 }
      );
    }

    const healthRecord = record[0];
    
    // Transform to response format
    const responseRecord = {
      id: healthRecord.id,
      animalId: healthRecord.animal_id,
      animalName: healthRecord.animal_name,
      type: healthRecord.type,
      title: healthRecord.title,
      description: healthRecord.description,
      date: healthRecord.date,
      veterinarian: healthRecord.veterinarian,
      clinic: healthRecord.clinic,
      status: healthRecord.status,
      priority: healthRecord.priority,
      userId: healthRecord.user_id,
      createdAt: healthRecord.created_at,
      updatedAt: healthRecord.updated_at,
    };

    return NextResponse.json(
      healthRecordResponseSchema.parse(responseRecord)
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        code: "DATABASE_ERROR",
        message: "Failed to fetch health record",
      },
      { status: 500 }
    );
  }
}

// PUT /api/health-records/{record_id} - Update existing health record
export async function PUT(
  req: Request,
  { params }: { params: { record_id: string } }
) {
  try {
    const recordId = params.record_id;
    const body = await req.json();
    const validated = healthRecordUpdateSchema.parse(body);

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(healthRecordsTable)
      .where(eq(healthRecordsTable.id, recordId));

    if (!existingRecord.length) {
      return NextResponse.json(
        {
          code: "NOT_FOUND",
          message: "Health record not found",
        },
        { status: 404 }
      );
    }

    const updateData: Partial<InsertHealthRecord> = {};
    
    // Only include fields that are provided
    if (validated.animalId !== undefined) updateData.animal_id = validated.animalId;
    if (validated.animalName !== undefined) updateData.animal_name = validated.animalName;
    if (validated.type !== undefined) updateData.type = validated.type;
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.date !== undefined) updateData.date = validated.date;
    if (validated.veterinarian !== undefined) updateData.veterinarian = validated.veterinarian;
    if (validated.clinic !== undefined) updateData.clinic = validated.clinic;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.priority !== undefined) updateData.priority = validated.priority;
    if (validated.userId !== undefined) updateData.user_id = validated.userId;

    const updatedRecord = await db
      .update(healthRecordsTable)
      .set(updateData)
      .where(eq(healthRecordsTable.id, recordId))
      .returning();

    if (!updatedRecord.length) {
      return NextResponse.json(
        {
          code: "UPDATE_FAILED",
          message: "Failed to update health record",
        },
        { status: 500 }
      );
    }

    const record = updatedRecord[0];
    
    // Transform to response format
    const responseRecord = {
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
    };

    return NextResponse.json(
      healthRecordResponseSchema.parse(responseRecord)
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
        message: "Failed to update health record",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/health-records/{record_id} - Delete health record
export async function DELETE(
  req: Request,
  { params }: { params: { record_id: string } }
) {
  try {
    const recordId = params.record_id;
    
    const result = await db
      .delete(healthRecordsTable)
      .where(eq(healthRecordsTable.id, recordId))
      .returning();

    if (!result.length) {
      return NextResponse.json(
        {
          code: "NOT_FOUND",
          message: "Health record not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Health record deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        code: "DATABASE_ERROR",
        message: "Failed to delete health record",
      },
      { status: 500 }
    );
  }
}