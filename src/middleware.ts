import { middleware as cors } from "@/middleware/cors";

import { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // First apply CORS
  const corsRes = cors(req);
  if (corsRes) return corsRes;
  return null;
}
