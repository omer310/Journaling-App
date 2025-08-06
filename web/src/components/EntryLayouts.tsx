import { RiEdit2Line, RiDeleteBinLine, RiCheckboxBlankLine, RiCheckboxFill } from 'react-icons/ri';
import { sanitizeRichTextHtml } from '@/lib/sanitize';

interface Entry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: 'happy' | 'neutral' | 'sad';
  tags: string[] | any; // Allow any type for tags to handle different data structures
  source?: 'mobile' | 'web';
}

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface EntryLayoutProps {
  entries: any[];
  tags: any[];
  selectedEntries: string[];
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onHover?: (id: string) => void;
}

// Helper function to safely get tags array
function getTagsArray(tags: any): string[] {
  if (Array.isArray(tags)) {
    return tags;
  }
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function ListLayout({ entries, tags, selectedEntries, onSelect, onEdit, onDelete, onHover }: EntryLayoutProps) {
  // Add null checks
  if (!entries || !Array.isArray(entries)) {
    return (
      <div className="bg-surface rounded-xl shadow-lg p-6 text-center">
        <p className="text-secondary">Loading entries...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-surface rounded-xl shadow-lg p-6 text-center">
        <p className="text-secondary">No entries found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const entryTags = getTagsArray(entry.tags);
        
        return (
          <div
            key={entry.id}
            className={`bg-surface rounded-xl shadow-lg p-6 transition-colors duration-200 ${
              selectedEntries.includes(entry.id) ? 'ring-2 ring-[#00ff9d]' : ''
            }`}
            onMouseEnter={() => onHover?.(entry.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <button onClick={() => onSelect(entry.id)} className="mt-1">
                  {selectedEntries.includes(entry.id) ? (
                    <RiCheckboxFill className="w-5 h-5 text-[#00ff9d]" />
                  ) : (
                    <RiCheckboxBlankLine className="w-5 h-5 text-[#888]" />
                  )}
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-primary mb-2">{entry.title}</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-sm text-secondary">
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'numeric', 
                        day: 'numeric' 
                      })} at{' '}
                      {new Date(entry.date).toLocaleTimeString()}
                    </p>
                    {entry.source && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        entry.source === 'mobile' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {entry.source}
                      </span>
                    )}
                  </div>
                  <div
                    className="prose dark:prose-invert line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(entry.content) }}
                  />
                  <div className="flex flex-wrap gap-2 mt-4">
                    {entry.mood && (
                      <span
                        className={`tag ${
                          entry.mood === 'happy'
                            ? 'text-green-500 border-green-500'
                            : entry.mood === 'sad'
                            ? 'text-red-500 border-red-500'
                            : 'text-yellow-500 border-yellow-500'
                        }`}
                      >
                        {entry.mood}
                      </span>
                    )}
                    {entryTags.map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <span
                          key={tag.id}
                          className="tag"
                          style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                        >
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(entry.id)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                  title="Edit entry"
                >
                  <RiEdit2Line className="w-5 h-5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  title="Delete entry"
                >
                  <RiDeleteBinLine className="w-5 h-5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function GridLayout({ entries = [], tags = [], selectedEntries = [], onSelect, onEdit, onDelete }: EntryLayoutProps) {
  // Add null checks
  if (!entries || !Array.isArray(entries)) {
    return (
      <div className="bg-surface rounded-xl shadow-lg p-6 text-center">
        <p className="text-secondary">Loading entries...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-surface rounded-xl shadow-lg p-6 text-center">
        <p className="text-secondary">No entries found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {entries.map((entry) => {
        const entryTags = getTagsArray(entry.tags);
        
        return (
          <div
            key={entry.id}
            className={`bg-surface rounded-xl shadow-lg p-4 transition-colors duration-200 ${
              selectedEntries.includes(entry.id) ? 'ring-2 ring-[#00ff9d]' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <button onClick={() => onSelect(entry.id)}>
                {selectedEntries.includes(entry.id) ? (
                  <RiCheckboxFill className="w-5 h-5 text-[#00ff9d]" />
                ) : (
                  <RiCheckboxBlankLine className="w-5 h-5 text-[#888]" />
                )}
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(entry.id)}
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                  title="Edit entry"
                >
                  <RiEdit2Line className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  title="Delete entry"
                >
                  <RiDeleteBinLine className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-primary mb-1">{entry.title}</h2>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs text-secondary">
                {new Date(entry.date).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'numeric', 
                  day: 'numeric' 
                })}
              </p>
              {entry.source && (
                <span className={`px-1 py-0.5 text-xs rounded-full ${
                  entry.source === 'mobile' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {entry.source}
                </span>
              )}
            </div>
            <div
              className="prose dark:prose-invert text-sm line-clamp-4 mb-3"
              dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(entry.content) }}
            />
            <div className="flex flex-wrap gap-1">
              {entry.mood && (
                <span
                  className={`tag text-xs ${
                    entry.mood === 'happy'
                      ? 'text-green-500 border-green-500'
                      : entry.mood === 'sad'
                      ? 'text-red-500 border-red-500'
                      : 'text-yellow-500 border-yellow-500'
                  }`}
                >
                  {entry.mood}
                </span>
              )}
              {entryTags.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tag.id}
                    className="tag text-xs"
                    style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                  >
                    {tag.name}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CompactLayout({ entries = [], tags = [], selectedEntries = [], onSelect, onEdit, onDelete }: EntryLayoutProps) {
  // Add null checks
  if (!entries || !Array.isArray(entries)) {
    return (
      <div className="bg-surface rounded-xl shadow-lg p-6 text-center">
        <p className="text-secondary">Loading entries...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-surface rounded-xl shadow-lg p-6 text-center">
        <p className="text-secondary">No entries found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const entryTags = getTagsArray(entry.tags);
        
        return (
          <div
            key={entry.id}
            className={`bg-surface rounded-lg shadow p-3 transition-colors duration-200 ${
              selectedEntries.includes(entry.id) ? 'ring-2 ring-[#00ff9d]' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <button onClick={() => onSelect(entry.id)}>
                {selectedEntries.includes(entry.id) ? (
                  <RiCheckboxFill className="w-4 h-4 text-[#00ff9d]" />
                ) : (
                  <RiCheckboxBlankLine className="w-4 h-4 text-[#888]" />
                )}
              </button>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-medium text-primary truncate">{entry.title}</h2>
                  <span className="text-xs text-secondary whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'numeric', 
                      day: 'numeric' 
                    })}
                  </span>
                  {entry.source && (
                    <span className={`px-1 py-0.5 text-xs rounded-full ${
                      entry.source === 'mobile' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {entry.source}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {entry.mood && (
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        entry.mood === 'happy'
                          ? 'bg-green-500'
                          : entry.mood === 'sad'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                  )}
                  {entryTags.length > 0 && (
                    <span className="text-xs text-secondary truncate">
                      {entryTags
                        .map((tagId) => tags.find((t) => t.id === tagId)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => onEdit(entry.id)}
                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                  title="Edit entry"
                >
                  <RiEdit2Line className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  title="Delete entry"
                >
                  <RiDeleteBinLine className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 