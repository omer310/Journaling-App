'use client';

import { useState, useEffect, useCallback } from 'react';
import { RiSearchLine, RiCloseLine } from 'react-icons/ri';
import debounce from 'lodash/debounce';
import { sanitizeSearchHtml } from '@/lib/sanitize';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  matchingText?: string;
}

interface SearchProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  onResultClick: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function Search({
  onSearch,
  onResultClick,
  placeholder = 'Search your journal entries...',
  className = '',
}: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await onSearch(searchQuery);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [onSearch]
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const highlightedText = text.replace(
      regex,
      '<mark class="bg-primary-light/20 dark:bg-primary-dark/30 rounded px-1">$1</mark>'
    );
    
    // Sanitize the highlighted text to prevent XSS
    return sanitizeSearchHtml(highlightedText);
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="search-input pl-10"
        />
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && (query || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-center text-secondary">Searching...</div>
          ) : results.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-4 hover:bg-surface-hover border-b border-border last:border-b-0"
                >
                  <h3 className="font-medium text-primary mb-1">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: highlightMatch(result.title, query),
                      }}
                    />
                  </h3>
                  <p className="text-sm text-secondary mb-2">
                    {new Date(result.date).toLocaleDateString()}
                  </p>
                  {result.matchingText && (
                    <p className="text-sm text-secondary line-clamp-2">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: highlightMatch(result.matchingText, query),
                        }}
                      />
                    </p>
                  )}
                  {result.tags && result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-surface-hover text-secondary rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-secondary">
              No results found for &quot;{query}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 