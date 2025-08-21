import { NextRequest, NextResponse } from "next/server";
import { verifyClerkJWT } from "@/lib/clerk";

export async function authMiddleware(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { error: "Missing Authorization header" },
      { status: 401 }
    );
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const user = await verifyClerkJWT(token);
    // Attach user info to request if needed
    return NextResponse.next();
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
