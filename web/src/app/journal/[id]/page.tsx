'use client';

import { use } from 'react';
import { EditJournalClient } from './EditJournalClient';

export default function Page({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  // Handle both Promise and direct params
  const resolvedParams = ('then' in params) ? use(params) : params;
  return <EditJournalClient params={resolvedParams} />;
} 