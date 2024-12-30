'use client';

import { use } from 'react';
import { EditJournalClient } from './EditJournalClient';

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return <EditJournalClient params={resolvedParams} />;
} 