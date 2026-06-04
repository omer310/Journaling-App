import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getCollections, type JournalEntryDocument } from '@/lib/mongodb';
import { requireClerkUser, trackUserSession } from '@/lib/server/clerkAuth';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await trackUserSession(request);
    const collections = await getCollections();
    const entries = await collections.journalEntries
      .find({ user_id: userId })
      .sort({ last_modified: -1 })
      .limit(1000)
      .toArray();

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Fetch journal entries error:', error);
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await trackUserSession(request);
    const body = await request.json();
    const now = new Date().toISOString();

    const entry: JournalEntryDocument = {
      id: randomUUID(),
      title: body.title,
      content: body.content,
      date: body.date || now,
      tags: Array.isArray(body.tags) ? body.tags : [],
      user_id: userId,
      encryption_user_id: body.encryption_user_id || userId,
      source: body.source || 'web',
      last_modified: body.last_modified || now,
      mood: body.mood || null,
      created_at: now,
      updated_at: now,
    };

    const collections = await getCollections();
    await collections.journalEntries.insertOne(entry);

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Create journal entry error:', error);
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireClerkUser();
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Entry IDs are required' }, { status: 400 });
    }

    const collections = await getCollections();
    await collections.journalEntries.deleteMany({
      id: { $in: ids },
      user_id: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete journal entries error:', error);
    return NextResponse.json({ error: 'Failed to delete journal entries' }, { status: 500 });
  }
}
