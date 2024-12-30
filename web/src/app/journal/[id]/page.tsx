import { Metadata } from 'next';
import { EditJournalClient } from './EditJournalClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Edit Journal Entry - ${resolvedParams.id}`,
  };
}

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  return <EditJournalClient params={params} />;
} 