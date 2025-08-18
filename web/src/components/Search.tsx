'use client';

import { useState, useEffect } from 'react';
import { RiSearchLine, RiCloseLine } from 'react-icons/ri';

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Search({ value, onChange, placeholder = "Search entries...", className = "" }: SearchProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center transition-all duration-200 ${
        isFocused 
          ? 'ring-2 ring-primary ring-opacity-50' 
          : 'ring-1 ring-border'
      } bg-surface rounded-lg overflow-hidden`}>
        {/* Search Icon */}
        <div className="absolute left-3 text-text-secondary">
          <RiSearchLine className="w-4 h-4" />
        </div>
        
        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-transparent text-text-primary placeholder-text-secondary focus:outline-none"
        />
        
        {/* Clear Button */}
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-2 p-1 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-surface-hover"
            aria-label="Clear search"
          >
            <RiCloseLine className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Search Results Count */}
      {value && (
        <div className="absolute -bottom-6 left-0 text-xs text-text-secondary">
          Type to search titles and content...
        </div>
      )}
    </div>
  );
} 