import { NextRequest, NextResponse } from "next/server";

// Simple JWT verification for Clerk tokens
// In production, use Clerk's backend SDK for proper verification
const verifyJWT = async (token: string): Promise<{ clerkId: string; isValid: boolean }> => {
  try {
    // For development/testing, we'll parse the token without proper verification
    // In production, use: import { verifyToken } from '@clerk/backend';
    
    // Simple base64 decoding for development
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) {
      return { clerkId: '', isValid: false };
    }
    
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    return { 
      clerkId: payload.sub || payload.user_id || '', 
      isValid: true 
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return { clerkId: '', isValid: false };
  }
};

export async function authMiddleware(req: NextRequest) {
  // Skip auth for public routes and webhooks
  const path = req.nextUrl.pathname;
  if (path.startsWith('/api/health') || path.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  // Get the authorization header
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authorization header missing or invalid' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify the JWT token
  const { clerkId, isValid } = await verifyJWT(token);

  if (!isValid || !clerkId) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Add clerkId to request headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-clerk-user-id', clerkId);
  
  return response;
}