import { useMemo } from 'react';
import {
  RiBarChartLine,
  RiEmotionLine,
  RiFileTextLine,
  RiTimeLine,
  RiFireLine,
  RiFireFill,
} from 'react-icons/ri';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Entry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: 'happy' | 'neutral' | 'sad';
  tags: string[];
}

interface AnalyticsProps {
  entries: Entry[];
}

export function Analytics({ entries }: AnalyticsProps) {
  // Custom flame component with smooth color progression
  const CustomFlame = ({ size = 'medium', streak = 0 }: { size?: 'small' | 'medium' | 'large', streak?: number }) => {
    const sizeClasses = {
      small: 'w-3 h-3',
      medium: 'w-4 h-4', 
      large: 'w-5 h-5'
    };
    
    // Smooth color progression: Red → Orange → Yellow → Green → Blue → Purple
    // Streak range: 0-100 days (can be extended)
    const getFlameColors = (streak: number) => {
      // Normalize streak to 0-1 range (0-100 days)
      const normalized = Math.min(streak / 100, 1);
      
      // Color progression: Red → Orange → Yellow → Green → Blue → Purple
      const colors = [
        { base: '#ff1100', left: '#ff3300', center: '#ff5500', right: '#ff7700', glow: '#ffff00' }, // Red
        { base: '#ff5500', left: '#ff7700', center: '#ff9900', right: '#ffbb00', glow: '#ffff44' }, // Orange
        { base: '#ff9900', left: '#ffbb00', center: '#ffdd00', right: '#ffff00', glow: '#ffff88' }, // Yellow
        { base: '#00aa00', left: '#00cc00', center: '#00ee00', right: '#44ff44', glow: '#88ff88' }, // Green
        { base: '#0040ff', left: '#0060ff', center: '#0080ff', right: '#40a0ff', glow: '#80c0ff' }, // Blue
        { base: '#4a148c', left: '#6a1b9a', center: '#8e24aa', right: '#ab47bc', glow: '#f3e5f5' }  // Purple
      ];
      
      // Calculate which color segment we're in
      const segment = normalized * (colors.length - 1);
      const index = Math.floor(segment);
      const fraction = segment - index;
      
      // Interpolate between colors
      const current = colors[index];
      const next = colors[Math.min(index + 1, colors.length - 1)];
      
      const interpolateColor = (color1: string, color2: string, frac: number) => {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.round(r1 + (r2 - r1) * frac);
        const g = Math.round(g1 + (g2 - g1) * frac);
        const b = Math.round(b1 + (b2 - b1) * frac);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      };
      
      return {
        base: interpolateColor(current.base, next.base, fraction),
        left: interpolateColor(current.left, next.left, fraction),
        center: interpolateColor(current.center, next.center, fraction),
        right: interpolateColor(current.right, next.right, fraction),
        glow: interpolateColor(current.glow, next.glow, fraction)
      };
    };
    
    const colors = getFlameColors(streak);
    
    return (
      <div className={`flame-container ${sizeClasses[size]}`}>
        <div 
          className="flame-base"
          style={{ background: `linear-gradient(to top, ${colors.base} 0%, ${colors.left} 50%, ${colors.center} 100%)` }}
        ></div>
        <div 
          className="flame-left"
          style={{ background: `linear-gradient(to top, ${colors.left} 0%, ${colors.center} 30%, ${colors.right} 60%, ${colors.glow} 85%, #ffffff 100%)` }}
        ></div>
        <div 
          className="flame-center"
          style={{ background: `linear-gradient(to top, ${colors.left} 0%, ${colors.center} 25%, ${colors.right} 50%, ${colors.glow} 75%, #ffffff 100%)` }}
        ></div>
        <div 
          className="flame-right"
          style={{ background: `linear-gradient(to top, ${colors.left} 0%, ${colors.center} 35%, ${colors.right} 65%, ${colors.glow} 90%, #ffffff 100%)` }}
        ></div>
        <div 
          className="flame-glow"
          style={{ background: `linear-gradient(to top, ${colors.glow} 0%, #ffffff 60%, rgba(255, 255, 255, 0.9) 100%)` }}
        ></div>
      </div>
    );
  };

  // Animated streak display functions
  const getStreakIcon = (streak: number) => {
    if (streak >= 30) return <CustomFlame size="large" streak={streak} />;
    if (streak >= 7) return <CustomFlame size="medium" streak={streak} />;
    return <CustomFlame size="small" streak={streak} />;
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-primary";
    if (streak >= 7) return "text-primary";
    return "text-primary";
  };

  const getStreakText = (streak: number) => {
    if (streak >= 365) return `${Math.floor(streak/365)} year streak`;
    if (streak >= 30) return `${Math.floor(streak/30)} month streak`;
    if (streak >= 7) return `${Math.floor(streak/7)} week streak`;
    return `${streak} day streak`;
  };

  const stats = useMemo(() => {
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const wordCounts = sortedEntries.map((entry) => ({
      date: new Date(entry.date).toLocaleDateString(),
      count: entry.content.split(/\s+/).filter(Boolean).length,
    }));

    const moodCounts = {
      happy: entries.filter((e) => e.mood === 'happy').length,
      neutral: entries.filter((e) => e.mood === 'neutral').length,
      sad: entries.filter((e) => e.mood === 'sad').length,
    };

    const totalWords = wordCounts.reduce((sum, { count }) => sum + count, 0);
    const averageWords = Math.round(totalWords / (wordCounts.length || 1));
    const streakDays = calculateStreak(entries);

    return {
      wordCounts,
      moodCounts,
      totalWords,
      averageWords,
      streakDays,
    };
  }, [entries]);

  const chartData = {
    labels: stats.wordCounts.map((wc) => wc.date),
    datasets: [
      {
        label: 'Word Count',
        data: stats.wordCounts.map((wc) => wc.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Word Count',
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-surface rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
          <RiBarChartLine className="w-5 h-5" />
          Writing Statistics
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-hover rounded-lg p-4">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <RiFileTextLine className="w-4 h-4" />
              Total Words
            </div>
            <div className="text-2xl font-bold text-primary">
              {stats.totalWords.toLocaleString()}
            </div>
          </div>
          <div className="bg-surface-hover rounded-lg p-4">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <RiFileTextLine className="w-4 h-4" />
              Average Words
            </div>
            <div className="text-2xl font-bold text-primary">
              {stats.averageWords.toLocaleString()}
            </div>
          </div>
          <div className="bg-surface-hover rounded-lg p-4">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <RiTimeLine className="w-4 h-4" />
              Writing Streak
            </div>
            <div className={`text-2xl font-bold flex items-center gap-2 ${getStreakColor(stats.streakDays)}`}>
              {getStreakIcon(stats.streakDays)}
              <span>{getStreakText(stats.streakDays)}</span>
            </div>
          </div>
          <div className="bg-surface-hover rounded-lg p-4">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <RiEmotionLine className="w-4 h-4" />
              Most Common Mood
            </div>
            <div className="text-2xl font-bold text-primary">
              {Object.entries(stats.moodCounts).reduce((a, b) =>
                a[1] > b[1] ? a : b
              )[0]}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
          <RiBarChartLine className="w-5 h-5" />
          Word Count Trend
        </h2>
        <div className="h-[300px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

function calculateStreak(entries: Entry[]): number {
  if (entries.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entriesByDate = new Map(
    entries.map((entry) => {
      const date = new Date(entry.date);
      date.setHours(0, 0, 0, 0);
      return [date.getTime(), entry];
    })
  );

  let streakDays = 0;
  let currentDate = today;

  while (entriesByDate.has(currentDate.getTime())) {
    streakDays++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streakDays;
} 