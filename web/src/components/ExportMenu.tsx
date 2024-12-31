import { useState, useRef } from 'react';
import { RiDownloadLine, RiFileTextLine, RiMarkdownLine, RiFilePdfLine } from 'react-icons/ri';

interface Entry {
  title: string;
  content: string;
  date: string;
  mood?: 'happy' | 'neutral' | 'sad';
  tags: string[];
}

interface ExportMenuProps {
  entries: Entry[];
  tags: Array<{ id: string; name: string }>;
  onExport: (format: 'pdf' | 'markdown' | 'text') => void;
}

export function ExportMenu({ entries, tags, onExport }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const exportFormats = [
    {
      id: 'pdf',
      label: 'PDF Document',
      icon: <RiFilePdfLine className="w-4 h-4" />,
      description: 'Export as a formatted PDF document',
    },
    {
      id: 'markdown',
      label: 'Markdown',
      icon: <RiMarkdownLine className="w-4 h-4" />,
      description: 'Export as Markdown files',
    },
    {
      id: 'text',
      label: 'Plain Text',
      icon: <RiFileTextLine className="w-4 h-4" />,
      description: 'Export as plain text files',
    },
  ] as const;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2a2a2a] text-white hover:bg-[#333] transition-colors duration-200"
      >
        <RiDownloadLine className="w-4 h-4" />
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1a1a1a] shadow-lg border border-[#2a2a2a] overflow-hidden z-10">
          <div className="p-3 border-b border-[#2a2a2a]">
            <h3 className="text-sm font-medium text-white">Export {entries.length} entries</h3>
            <p className="text-xs text-[#888] mt-1">Choose an export format</p>
          </div>
          <div className="p-1">
            {exportFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => {
                  onExport(format.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors duration-200 text-left"
              >
                <div className="mt-0.5 text-[#00ff9d]">{format.icon}</div>
                <div>
                  <div className="text-sm font-medium text-white">{format.label}</div>
                  <div className="text-xs text-[#888]">{format.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 