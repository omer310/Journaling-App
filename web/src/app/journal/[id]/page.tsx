import { Metadata } from 'next';
import { EditJournalClient } from './EditJournalClient';

export const metadata: Metadata = {
  title: 'Edit Journal Entry',
};

// This generates all possible paths at build time
export async function generateStaticParams() {
  // For now, we'll generate a few dummy IDs
  // Later you can fetch real IDs from your database
  return [
    { id: 'new' },
    { id: 'demo' }
  ];
}

export default function Page({
  params,
}: {
  params: { id: string };
}) {
  return <EditJournalClient params={params} />;
} 