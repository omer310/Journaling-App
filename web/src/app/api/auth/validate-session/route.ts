import { NextRequest, NextResponse } from 'next/server';
import { trackUserSession } from '@/lib/server/clerkAuth';

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId } = await trackUserSession(request);

    return NextResponse.json({
      valid: true,
      userId,
      sessionId,
      lastActivity: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ error: 'No valid session found' }, { status: 401 });
  }
}
