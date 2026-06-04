import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import {
  getCurrentUserEmail,
  logSecurityEvent,
  requireClerkUser,
} from '@/lib/server/clerkAuth';

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId } = await requireClerkUser();
    const body = await request.json().catch(() => ({}));
    const logoutReason = body.reason || body.type || 'user_initiated';
    const endedAt = new Date().toISOString();
    const collections = await getCollections();

    if (sessionId) {
      await collections.userSessions.updateOne(
        { session_id: sessionId },
        {
          $set: {
            active: false,
            ended_at: endedAt,
            logout_reason: logoutReason,
          },
        }
      );
    }

    await logSecurityEvent({
      userId,
      email: await getCurrentUserEmail(),
      eventType: 'LOGOUT',
      severity: String(logoutReason).includes('security') ? 'MEDIUM' : 'LOW',
      details: {
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        logout_reason: logoutReason,
        session_id: sessionId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Session marked as logged out',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'No valid session found' }, { status: 401 });
  }
}
