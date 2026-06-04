import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCollections } from '@/lib/mongodb';
import { logSecurityEvent } from '@/lib/server/clerkAuth';

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    const {
      eventType,
      details,
      severity = 'MEDIUM',
      userId,
      email
    } = eventData;

    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing event type' },
        { status: 400 }
      );
    }

    const { userId: clerkUserId } = await auth();
    const effectiveUserId = clerkUserId || userId || null;
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const enhancedDetails = {
      ...details,
      ip_address: ipAddress,
      user_agent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      server_side: true
    };

    const securityEvent = await logSecurityEvent({
      userId: effectiveUserId,
      email,
      eventType,
      details: enhancedDetails,
      severity,
    });

    const collections = await getCollections();
    const recentEvents = await collections.securityEvents
      .find({
        user_id: effectiveUserId,
        event_type: eventType,
        timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
      })
      .sort({ timestamp: -1 })
      .toArray();

    if (recentEvents.length > 10) {
      console.warn(`Suspicious activity detected for user ${effectiveUserId}: ${recentEvents.length} ${eventType} events in the last hour`);
    }

    return NextResponse.json({
      success: true,
      eventId: securityEvent.id,
      alertCreated: severity === 'HIGH' || severity === 'CRITICAL'
    });
  } catch (error) {
    console.error('Security report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
