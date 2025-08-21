import { jwtVerify } from "jose";

const CLERK_JWT_PUBLIC_KEY = process.env.CLERK_JWT_PUBLIC_KEY || "";

export async function verifyClerkJWT(token: string) {
  if (!CLERK_JWT_PUBLIC_KEY) throw new Error("Missing Clerk JWT public key");
  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(CLERK_JWT_PUBLIC_KEY)
  );
  return payload;
}
