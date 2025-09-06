import { db } from "@/lib/db";
import { schema } from "../../../../../drizzle/schema";
import { eq, and, or, desc, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { healthRecordResponseSchema } from "../../_utils/schema";

const healthRecordsTable = schema.healthRecordsTable;

// GET /api/health-records/recent - Get recent records (status: "completed" or "ongoing")
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const animal = searchParams.get("animal");
    const days = parseInt(searchParams.get("days") || "30");
    
    // Calculate date range for recent records
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    // Build where conditions for recent records
    const statusConditions = or(
      eq(healthRecordsTable.status, "completed" as any),
      eq(healthRecordsTable.status, "ongoing" as any)
    );
    
    const dateConditions = and(
      gte(healthRecordsTable.date, startDateString),
      lte(healthRecordsTable.date, endDateString)
    );
    
    let conditions = [statusConditions, dateConditions];
    
    if (animal) {
      conditions.push(eq(healthRecordsTable.animal_name, animal));
    }
    
    const recentRecords = await db
      .select()
      .from(healthRecordsTable)
      .where(and(...conditions))
      .orderBy(desc(healthRecordsTable.date));

    // Transform to response format
    const transformedRecords = recentRecords.map(record => ({
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
        message: "Failed to fetch recent records",
      },
      { status: 500 }
    );
  }
}