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
    return NextResponse.json({ success: true, created: true, id, name });
  }
  // If user exists, return their name and internal ID
  return NextResponse.json({
    success: true,
    created: false,
    id: existing[0]?.id,
    name: existing[0]?.name,
  });
};

export const POST = postHandler;
// ...existing code...

// Example GET for user info (no authentication)
const getHandler = async (req: NextRequest) => {
  // For now, just return the first user in the database (for demo purposes)
  const user = await db.select().from(usersTable);
  if (!user.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ id: user[0].id, name: user[0].name });
};

export const GET = getHandler;
// ...existing code...
