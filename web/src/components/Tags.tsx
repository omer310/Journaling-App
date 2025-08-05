'use client';

import { useState, useRef, useEffect } from 'react';
import { RiAddLine, RiCloseLine, RiSubtractLine } from 'react-icons/ri';

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface TagsProps {
  selectedTags: string[];
  availableTags: Tag[];
  onTagSelect: (tagId: string) => void;
  onTagRemove: (tagId: string) => void;
  onTagDelete?: (tagId: string) => void;
  onTagCreate?: (tagName: string) => void;
  className?: string;
}

export function Tags({
  selectedTags,
  availableTags,
  onTagSelect,
  onTagRemove,
  onTagDelete,
  onTagCreate,
  className = '',
}: TagsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleCreateTag = () => {
    if (newTagName.trim() && onTagCreate) {
      onTagCreate(newTagName.trim());
      setNewTagName('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTag();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTagName('');
    }
  };

  const availableTagsList = availableTags.filter(tag => !selectedTags.includes(tag.id));

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tagId) => {
          const tag = availableTags.find((t) => t.id === tagId);
          if (!tag) return null;

          return (
            <span
              key={tag.id}
              className="inline-flex items-center"
            >
              <span className="px-3 py-1.5 bg-[#2a2a2a] rounded-l-full text-sm text-white border-r border-[#333]">
                {tag.name}
              </span>
              <button
                onClick={() => onTagRemove(tag.id)}
                className="h-full px-2 bg-[#2a2a2a] hover:bg-[#333] rounded-r-full text-[#666] hover:text-red-500 transition-colors duration-200"
                title="Remove tag from this entry"
              >
                <RiSubtractLine className="w-4 h-4" />
              </button>
            </span>
          );
        })}
        {onTagCreate && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333] rounded-full text-sm text-[#888] hover:text-white transition-colors duration-200"
          >
            <RiAddLine className="w-4 h-4" />
            Add Tag
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mt-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter tag name..."
              className="flex-1 px-3 py-1.5 bg-[#2a2a2a] rounded-lg text-sm text-white border border-[#333] focus:outline-none focus:border-[#00ff9d]"
            />
            <button
              onClick={handleCreateTag}
              disabled={!newTagName.trim()}
              className="px-3 py-1.5 bg-[#00ff9d] text-black rounded-lg text-sm font-medium hover:bg-[#00cc7d] disabled:opacity-50 disabled:hover:bg-[#00ff9d]"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewTagName('');
              }}
              className="px-3 py-1.5 bg-[#2a2a2a] text-[#888] hover:text-white rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {availableTagsList.length > 0 && !isAdding && (
        <div className="mt-4">
          <div className="text-xs text-[#888] mb-2">Available Tags</div>
          <div className="flex flex-wrap gap-2">
            {availableTagsList.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center"
              >
                <button
                  onClick={() => onTagSelect(tag.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333] rounded-l-full text-sm text-[#888] hover:text-white transition-colors duration-200 border-r border-[#333]"
                >
                  {tag.name}
                </button>
                <button
                  onClick={() => onTagDelete?.(tag.id)}
                  className="h-full px-2 bg-[#2a2a2a] hover:bg-[#333] rounded-r-full text-[#666] hover:text-red-500 transition-colors duration-200"
                  title="Delete tag permanently"
                >
                  <RiCloseLine className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 