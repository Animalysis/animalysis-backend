import { db } from "@/lib/db";
import { schema } from "../../../../../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { healthRecordResponseSchema } from "../../_utils/schema";

const healthRecordsTable = schema.healthRecordsTable;

// GET /api/health-records/upcoming - Get upcoming appointments (status: "scheduled")
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const animal = searchParams.get("animal");
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    
    // Build where conditions for upcoming appointments
    const conditions = [
      eq(healthRecordsTable.status, "scheduled" as any),
      gte(healthRecordsTable.date, todayString)
    ];
    
    if (animal) {
      conditions.push(eq(healthRecordsTable.animal_name, animal));
    }
    
    const upcomingRecords = await db
      .select()
      .from(healthRecordsTable)
      .where(and(...conditions))
      .orderBy(healthRecordsTable.date);

    // Transform to response format
    const transformedRecords = upcomingRecords.map(record => ({
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
        message: "Failed to fetch upcoming appointments",
      },
      { status: 500 }
    );
  }
}