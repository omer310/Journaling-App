import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

interface Entry {
  title: string;
  content: string;
  date: string;
  mood?: 'happy' | 'neutral' | 'sad';
  tags: string[];
}

interface Tag {
  id: string;
  name: string;
}

function stripHtml(html: string) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function formatDate(date: string) {
  return format(new Date(date), 'PPP');
}

export async function exportToPdf(entries: Entry[], tags: Tag[]) {
  const doc = new jsPDF();
  let y = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Journal Entries', margin, y);
  y += lineHeight * 2;

  entries.forEach((entry) => {
    // Check if we need a new page
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(entry.title, margin, y);
    y += lineHeight;

    // Date and mood
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const dateText = formatDate(entry.date);
    const moodText = entry.mood ? ` • ${entry.mood}` : '';
    doc.text(`${dateText}${moodText}`, margin, y);
    y += lineHeight;

    // Tags
    if (entry.tags.length > 0) {
      const entryTags = entry.tags
        .map((tagId) => tags.find((t) => t.id === tagId)?.name)
        .filter(Boolean)
        .join(', ');
      doc.text(`Tags: ${entryTags}`, margin, y);
      y += lineHeight;
    }

    // Content
    doc.setFontSize(12);
    const content = stripHtml(entry.content);
    const lines = doc.splitTextToSize(content, doc.internal.pageSize.width - margin * 2);
    lines.forEach((line: string) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    y += lineHeight * 2;
  });

  doc.save('journal-entries.pdf');
}

export function exportToMarkdown(entries: Entry[], tags: Tag[]) {
  let markdown = '# Journal Entries\n\n';

  entries.forEach((entry) => {
    markdown += `## ${entry.title}\n`;
    markdown += `*${formatDate(entry.date)}*`;
    if (entry.mood) {
      markdown += ` • ${entry.mood}`;
    }
    markdown += '\n\n';

    if (entry.tags.length > 0) {
      const entryTags = entry.tags
        .map((tagId) => tags.find((t) => t.id === tagId)?.name)
        .filter(Boolean)
        .join(', ');
      markdown += `**Tags**: ${entryTags}\n\n`;
    }

    markdown += `${stripHtml(entry.content)}\n\n---\n\n`;
  });

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'journal-entries.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToText(entries: Entry[], tags: Tag[]) {
  let text = 'JOURNAL ENTRIES\n\n';

  entries.forEach((entry) => {
    text += `${entry.title}\n`;
    text += `${formatDate(entry.date)}`;
    if (entry.mood) {
      text += ` • ${entry.mood}`;
    }
    text += '\n\n';

    if (entry.tags.length > 0) {
      const entryTags = entry.tags
        .map((tagId) => tags.find((t) => t.id === tagId)?.name)
        .filter(Boolean)
        .join(', ');
      text += `Tags: ${entryTags}\n\n`;
    }

    text += `${stripHtml(entry.content)}\n\n`;
    text += '-------------------\n\n';
  });

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'journal-entries.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 