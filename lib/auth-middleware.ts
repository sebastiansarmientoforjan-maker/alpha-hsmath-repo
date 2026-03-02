import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from './firebase-admin';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

/**
 * Middleware to verify Firebase authentication token
 * Returns user data if authenticated, or error response
 */
export async function verifyAuth(
  request: NextRequest
): Promise<{ userId: string; userEmail: string; isAdmin: boolean } | NextResponse> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Check if user has @alpha.school email
    const userEmail = decodedToken.email || '';
    const isAlphaSchoolUser = userEmail.endsWith('@alpha.school');

    if (!isAlphaSchoolUser) {
      return NextResponse.json(
        { error: 'Forbidden: Only @alpha.school users are allowed' },
        { status: 403 }
      );
    }

    // Check if user is admin (sebastian.sarmiento@alpha.school)
    const isAdmin = userEmail === 'sebastian.sarmiento@alpha.school';

    return {
      userId: decodedToken.uid,
      userEmail: userEmail,
      isAdmin: isAdmin,
    };
  } catch (error: any) {
    console.error('Auth verification error:', error.code || error.message);

    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Unauthorized: Token expired' },
        { status: 401 }
      );
    }

    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Unauthorized: Authentication failed' },
      { status: 401 }
    );
  }
}

/**
 * Verify that user is admin
 */
export async function verifyAdmin(request: NextRequest): Promise<{ userId: string; userEmail: string } | NextResponse> {
  const authResult = await verifyAuth(request);

  // If authResult is a NextResponse (error), return it
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check if user is admin
  if (!authResult.isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  return {
    userId: authResult.userId,
    userEmail: authResult.userEmail,
  };
}
