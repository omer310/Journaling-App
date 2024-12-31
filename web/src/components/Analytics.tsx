import { useMemo } from 'react';
import {
  RiBarChartLine,
  RiEmotionLine,
  RiFileTextLine,
  RiTimeLine,
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
            <div className="text-2xl font-bold text-primary">
              {stats.streakDays} days
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