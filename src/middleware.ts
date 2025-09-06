import { middleware as cors } from "@/middleware/cors";
import { authMiddleware } from "@/middleware/auth";

import { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // First apply CORS
  const corsRes = cors(req);
  if (corsRes) return corsRes;

  // Then apply authentication (except for webhooks and health checks)
  const path = req.nextUrl.pathname;
  if (!path.startsWith('/api/health') && !path.startsWith('/api/webhooks')) {
    const authRes = await authMiddleware(req);
    if (authRes.status !== 200) {
      return authRes;
    }
  }

  return null;
}
