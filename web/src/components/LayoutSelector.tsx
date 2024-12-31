import { RiListUnordered, RiGridFill, RiMenuLine } from 'react-icons/ri';

export type LayoutMode = 'list' | 'grid' | 'compact';

interface LayoutSelectorProps {
  value: LayoutMode;
  onChange: (mode: LayoutMode) => void;
}

export function LayoutSelector({ value, onChange }: LayoutSelectorProps) {
  const layouts = [
    {
      id: 'list' as const,
      icon: <RiListUnordered className="w-4 h-4" />,
      label: 'List View',
    },
    {
      id: 'grid' as const,
      icon: <RiGridFill className="w-4 h-4" />,
      label: 'Grid View',
    },
    {
      id: 'compact' as const,
      icon: <RiMenuLine className="w-4 h-4" />,
      label: 'Compact View',
    },
  ];

  return (
    <div className="flex gap-1 bg-[#2a2a2a] p-1 rounded-lg">
      {layouts.map((layout) => (
        <button
          key={layout.id}
          onClick={() => onChange(layout.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
            value === layout.id
              ? 'bg-[#00ff9d] text-black'
              : 'text-[#888] hover:text-white'
          }`}
          title={layout.label}
        >
          {layout.icon}
        </button>
      ))}
    </div>
  );
} 