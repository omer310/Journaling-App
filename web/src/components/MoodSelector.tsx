import { RiEmotionHappyLine, RiEmotionNormalLine, RiEmotionUnhappyLine } from 'react-icons/ri';

type Mood = 'happy' | 'neutral' | 'sad';

interface MoodSelectorProps {
  value?: Mood;
  onChange: (mood: Mood) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  const moods: { value: Mood; icon: React.ReactNode; label: string; color: string }[] = [
    {
      value: 'happy',
      icon: <RiEmotionHappyLine className="w-4 h-4" />,
      label: 'Happy',
      color: '#00ff9d',
    },
    {
      value: 'neutral',
      icon: <RiEmotionNormalLine className="w-4 h-4" />,
      label: 'Neutral',
      color: '#ffd700',
    },
    {
      value: 'sad',
      icon: <RiEmotionUnhappyLine className="w-4 h-4" />,
      label: 'Sad',
      color: '#ff6b6b',
    },
  ];

  return (
    <div className="flex gap-2">
      {moods.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onChange(mood.value)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors duration-200 ${
            value === mood.value
              ? 'bg-[#2a2a2a]'
              : 'bg-[#2a2a2a] text-[#888] hover:text-white'
          }`}
          style={{
            color: value === mood.value ? mood.color : undefined,
            borderColor: value === mood.value ? mood.color : 'transparent',
            borderWidth: '1px',
          }}
          title={mood.label}
        >
          <div style={{ color: value === mood.value ? mood.color : undefined }}>
            {mood.icon}
          </div>
          <span>{mood.label}</span>
        </button>
      ))}
    </div>
  );
} 