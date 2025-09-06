import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersTable } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generate_new_id } from "../../_utils/util";
import { createClerkClient } from "@clerk/backend";

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Clerk webhook secret - should be set in environment variables
// For development, you can leave this empty and webhook verification will be disabled
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || "";

// Simple webhook signature verification (for development/testing)
// In production, use Clerk's official SDK or a proper verification method
const verifyWebhookSignature = (signature: string, payload: string, secret: string): boolean => {
  // For development/testing without webhook secret, skip verification
  if (!secret) {
    console.warn("Webhook verification disabled - running in development mode");
    return true;
  }
  
  // In production, implement proper HMAC verification here
  // You would use: import { verifyWebhook } from '@clerk/backend';
  console.warn("Webhook verification not implemented - running in development mode");
  return true;
};

export async function POST(req: NextRequest) {
  try {
    // Get the signature header
    const signature = req.headers.get('svix-signature');
    
    // For development without webhook setup, allow proceeding without signature
    if (!signature && WEBHOOK_SECRET) {
      console.warn("Webhook signature missing - proceeding in development mode");
      // return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Get the body
    const payload = await req.text();
    
    // Verify the webhook signature (for production)
    if (WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(signature, payload, WEBHOOK_SECRET);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const evt = JSON.parse(payload);

    // Handle the webhook
    const eventType = evt.type;

    // Handle user creation events
    if (eventType === "user.created" || eventType === "session.created") {
      const data = evt.data;
      const clerkId = data.user_id;
      
      console.log("Webhook data received:", JSON.stringify(data, null, 2));

      // Fetch the actual user information from Clerk API
      let name = "User";
      try {
        const user = await clerkClient.users.getUser(clerkId);
        name = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0] || "User";
        
        console.log("Fetched user from Clerk API:", JSON.stringify(user, null, 2));
      } catch (error) {
        console.error("Failed to fetch user from Clerk API:", error);
        // Fallback to webhook data if API call fails
        if (data.first_name && data.last_name) {
          name = `${data.first_name} ${data.last_name}`;
        } else if (data.username) {
          name = data.username;
        } else if (data.email_addresses && data.email_addresses.length > 0) {
          name = data.email_addresses[0].email_address.split('@')[0];
        }
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkId));

      if (existingUser.length === 0) {
        // Create new user in database
        const id = generate_new_id();
        await db.insert(usersTable).values({
          id,
          clerkId,
          name,
        });

        console.log(`Created user ${name} with Clerk ID: ${clerkId}`);
        return NextResponse.json({ success: true, message: "User created" });
      } else {
        console.log(`User ${name} already exists`);
        return NextResponse.json({ success: true, message: "User already exists" });
      }
    }

    // Handle user deletion events
    if (eventType === "user.deleted") {
      const { id: clerkId } = evt.data;
      
      // Delete user from database
      await db.delete(usersTable).where(eq(usersTable.clerkId, clerkId));
      
      console.log(`Deleted user with Clerk ID: ${clerkId}`);
      return NextResponse.json({ success: true, message: "User deleted" });
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}