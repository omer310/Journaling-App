import EditJournalForm from './EditJournalForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Journal Entry',
  description: 'Edit your journal entry',
};

export function generateStaticParams() {
  return [{ id: 'new' }];
}

export default async function EditJournalPage({
  params,
}: {
  params: { id: string };
}) {
  return <EditJournalForm id={params.id} />;
} 