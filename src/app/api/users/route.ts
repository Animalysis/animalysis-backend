import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersTable } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generate_new_id } from "../_utils/util";

// This route creates a user entry when Clerk authentication succeeds
const postHandler = async (req: NextRequest) => {
  const body = await req.json();
  console.log("POST /api/users received:", JSON.stringify(body, null, 2));
  
  const { clerkId, name } = body;
  const id = generate_new_id();
  
  // Check if user exists
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  if (existing.length === 0) {
    await db.insert(usersTable).values({ id, clerkId, name });
    console.log(`Created user: ${name} with Clerk ID: ${clerkId}`);
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

// Example GET for user info (no authentication)
const getHandler = async (req: NextRequest) => {
  // For now, just return the first user in the database (for demo purposes)
  const users = await db.select().from(usersTable);
  console.log("GET /api/users - Found users:", JSON.stringify(users, null, 2));
  
  if (!users.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ id: users[0].id, name: users[0].name });
};

export const GET = getHandler;
// ...existing code...
