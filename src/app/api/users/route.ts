import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersTable } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generate_new_id } from "../_utils/util";

// This route creates a user entry when Clerk authentication succeeds
const postHandler = async (req: NextRequest) => {
  const { clerkId, name } = await req.json();
  const id = generate_new_id();
  // Check if user exists
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  if (existing.length === 0) {
    await db.insert(usersTable).values({ id, clerkId, name });
    return NextResponse.json({ success: true, created: true, name });
  }
  // If user exists, return their name
  return NextResponse.json({
    success: true,
    created: false,
    name: existing[0]?.name,
  });
};

export const POST = postHandler;
// ...existing code...

// Example GET for user info
const getHandler = async (req: NextRequest) => {
  // Authenticate and return user info
  return NextResponse.json({});
};

export const GET = getHandler;
// ...existing code...
