import 'server-only';

import { auth, currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { getCollections } from '@/lib/mongodb';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export async function requireClerkUser() {
  const { userId, sessionId } = await auth();

  if (!userId) {
    throw new Error('User not authenticated');
  }

  return { userId, sessionId };
}

export async function getCurrentUserEmail() {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;
}

export async function trackUserSession(request: NextRequest, active = true) {
  const { userId, sessionId } = await requireClerkUser();
  const collections = await getCollections();
  const now = new Date().toISOString();
  const sessionKey = sessionId || `${userId}:unknown`;

  await collections.userSessions.updateOne(
    { session_id: sessionKey },
    {
      $set: {
        user_id: userId,
        session_id: sessionKey,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || undefined,
        active,
        last_activity: now,
      },
      $setOnInsert: {
        id: randomUUID(),
        created_at: now,
      },
    },
    { upsert: true }
  );

  return { userId, sessionId: sessionKey };
}

export async function logSecurityEvent({
  userId,
  email,
  eventType,
  details,
  severity = 'MEDIUM',
}: {
  userId?: string | null;
  email?: string | null;
  eventType: string;
  details?: Record<string, unknown>;
  severity?: Severity;
}) {
  const collections = await getCollections();
  const now = new Date().toISOString();
  const event = {
    id: randomUUID(),
    user_id: userId,
    email,
    event_type: eventType,
    details,
    severity,
    timestamp: now,
    resolved: false,
    created_at: now,
  };

  await collections.securityEvents.insertOne(event);

  if (severity === 'HIGH' || severity === 'CRITICAL') {
    await collections.securityAlerts.insertOne({
      id: randomUUID(),
      event_id: event.id,
      user_id: userId,
      email,
      alert_type: `${eventType}_${severity}`,
      details,
      severity,
      created_at: now,
      resolved: false,
    });
  }

  return event;
}
