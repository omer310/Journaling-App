'use client';

import { useState, useRef, useEffect } from 'react';
import { RiCloseLine, RiAddLine } from 'react-icons/ri';

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
  onTagCreate?: (tagName: string) => void;
  className?: string;
}

export function Tags({
  selectedTags,
  availableTags,
  onTagSelect,
  onTagRemove,
  onTagCreate,
  className = '',
}: TagsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredTags = availableTags.filter(
    (tag) =>
      !selectedTags.includes(tag.id) &&
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedTags.map((tagId) => {
          const tag = availableTags.find((t) => t.id === tagId);
          if (!tag) return null;

          return (
            <span
              key={tag.id}
              className="tag group"
              style={
                tag.color
                  ? {
                      borderColor: tag.color,
                      color: tag.color,
                    }
                  : undefined
              }
            >
              {tag.name}
              <button
                onClick={() => onTagRemove(tag.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            </span>
          );
        })}
        {onTagCreate && (
          <button
            onClick={() => setIsAdding(true)}
            className="tag border-dashed"
          >
            <RiAddLine className="w-4 h-4" />
            Add Tag
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-4">
          <input
            ref={inputRef}
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter tag name..."
            className="search-input"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleCreateTag}
              disabled={!newTagName.trim()}
              className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewTagName('');
              }}
              className="px-3 py-1 bg-surface hover:bg-surface-hover text-secondary rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {filteredTags.length > 0 && (
        <>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="search-input mb-4"
          />

          <div className="flex flex-wrap gap-2">
            {filteredTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagSelect(tag.id)}
                className="tag"
                style={
                  tag.color
                    ? {
                        borderColor: tag.color,
                        color: tag.color,
                      }
                    : undefined
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 