import EditJournalForm from './EditJournalForm';

export default function EditJournalPage({ params }: { params: { id: string } }) {
  return <EditJournalForm id={params.id} />;
} 