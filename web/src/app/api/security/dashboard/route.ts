import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';

export async function GET() {
  try {
    const collections = await getCollections();
    const [events, sessions] = await Promise.all([
      collections.securityEvents.find({}).sort({ timestamp: -1 }).limit(50).toArray(),
      collections.userSessions.find({ active: true }).sort({ last_activity: -1 }).toArray(),
    ]);

    return NextResponse.json({ events, sessions });
  } catch (error) {
    console.error('Security dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch security data' }, { status: 500 });
  }
}
