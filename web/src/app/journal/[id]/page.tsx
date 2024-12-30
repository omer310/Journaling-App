import { Metadata } from 'next';
import { EditJournalClient } from './EditJournalClient';

export const metadata: Metadata = {
  title: 'Edit Journal Entry',
};

export default function Page({
  params,
}: {
  params: { id: string };
}) {
  return <EditJournalClient params={params} />;
} 