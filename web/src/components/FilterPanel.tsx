import { useState } from 'react';
import { RiFilterLine, RiEmotionHappyLine, RiEmotionNormalLine, RiEmotionUnhappyLine } from 'react-icons/ri';
import { Tags } from './Tags';

interface FilterPanelProps {
  selectedTags: string[];
  availableTags: Array<{ id: string; name: string; color?: string }>;
  onTagSelect: (tagId: string) => void;
  onTagRemove: (tagId: string) => void;
  selectedMoods: ('happy' | 'neutral' | 'sad')[];
  onMoodSelect: (mood: 'happy' | 'neutral' | 'sad') => void;
  onMoodRemove: (mood: 'happy' | 'neutral' | 'sad') => void;
  dateRange: {
    start: string;
    end: string;
  };
  onDateRangeChange: (range: { start: string; end: string }) => void;
}

export function FilterPanel({
  selectedTags,
  availableTags,
  onTagSelect,
  onTagRemove,
  selectedMoods,
  onMoodSelect,
  onMoodRemove,
  dateRange,
  onDateRangeChange,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const moods = [
    { value: 'happy' as const, icon: <RiEmotionHappyLine className="w-4 h-4" />, label: 'Happy', color: '#00ff9d' },
    { value: 'neutral' as const, icon: <RiEmotionNormalLine className="w-4 h-4" />, label: 'Neutral', color: '#ffd700' },
    { value: 'sad' as const, icon: <RiEmotionUnhappyLine className="w-4 h-4" />, label: 'Sad', color: '#ff6b6b' },
  ];

  const handleMoodToggle = (mood: 'happy' | 'neutral' | 'sad') => {
    if (selectedMoods.includes(mood)) {
      onMoodRemove(mood);
    } else {
      onMoodSelect(mood);
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left border-b border-[#2a2a2a]"
      >
        <div className="flex items-center gap-2">
          <RiFilterLine className="w-4 h-4 text-[#00ff9d]" />
          <h2 className="text-base font-medium text-white">Filters</h2>
        </div>
        <div className="flex items-center gap-2 text-[#888] text-xs">
          {selectedTags.length > 0 && (
            <span className="px-2 py-0.5 bg-[#2a2a2a] rounded-full">
              {selectedTags.length} tags
            </span>
          )}
          {selectedMoods.length > 0 && (
            <span className="px-2 py-0.5 bg-[#2a2a2a] rounded-full">
              {selectedMoods.length} moods
            </span>
          )}
          {(dateRange.start || dateRange.end) && (
            <span className="px-2 py-0.5 bg-[#2a2a2a] rounded-full">
              Date range
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm text-[#888] mb-2">Tags</h3>
            <Tags
              selectedTags={selectedTags}
              availableTags={availableTags}
              onTagSelect={onTagSelect}
              onTagRemove={onTagRemove}
            />
          </div>

          <div>
            <h3 className="text-sm text-[#888] mb-2">Mood</h3>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodToggle(mood.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors duration-200 ${
                    selectedMoods.includes(mood.value)
                      ? 'bg-[#2a2a2a]'
                      : 'bg-[#2a2a2a] text-[#888] hover:text-white'
                  }`}
                  style={{
                    color: selectedMoods.includes(mood.value) ? mood.color : undefined,
                    borderColor: selectedMoods.includes(mood.value) ? mood.color : 'transparent',
                    borderWidth: '1px',
                  }}
                >
                  {mood.icon}
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm text-[#888] mb-2">Date Range</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-[#888] mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    onDateRangeChange({ ...dateRange, start: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#2a2a2a] border border-[#333] focus:outline-none focus:border-[#00ff9d] text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#888] mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  min={dateRange.start}
                  onChange={(e) =>
                    onDateRangeChange({ ...dateRange, end: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#2a2a2a] border border-[#333] focus:outline-none focus:border-[#00ff9d] text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 