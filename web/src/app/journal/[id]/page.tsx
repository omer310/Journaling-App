import { Metadata } from 'next';
import { EditJournalClient } from './EditJournalClient';

export const dynamic = 'force-dynamic';

export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  return {
    title: `Edit Journal Entry - ${params.id}`,
  };
}

export default function Page({
  params,
}: {
  params: { id: string };
}) {
  return <EditJournalClient params={params} />;
} 