import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { requireClerkUser, trackUserSession } from '@/lib/server/clerkAuth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await trackUserSession(_request);
    const { id } = await context.params;
    const collections = await getCollections();
    const entry = await collections.journalEntries.findOne({ id, user_id: userId });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Fetch journal entry error:', error);
    return NextResponse.json({ error: 'Failed to fetch journal entry' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await trackUserSession(request);
    const { id } = await context.params;
    const body = await request.json();
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      updated_at: now,
      last_modified: body.last_modified || now,
    };

    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.encryption_user_id !== undefined) updates.encryption_user_id = body.encryption_user_id;
    if (body.date !== undefined) updates.date = body.date;
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body.mood !== undefined) updates.mood = body.mood;
    if (body.source !== undefined) updates.source = body.source;

    const collections = await getCollections();
    const result = await collections.journalEntries.findOneAndUpdate(
      { id, user_id: userId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ entry: result });
  } catch (error) {
    console.error('Update journal entry error:', error);
    return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await requireClerkUser();
    const { id } = await context.params;
    const collections = await getCollections();
    await collections.journalEntries.deleteOne({ id, user_id: userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    return NextResponse.json({ error: 'Failed to delete journal entry' }, { status: 500 });
  }
}
