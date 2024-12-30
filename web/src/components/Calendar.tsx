'use client';

import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarLine,
} from 'react-icons/ri';

interface CalendarProps {
  entries: {
    id: string;
    date: string;
    title: string;
  }[];
  onDateSelect: (date: Date) => void;
}

export function Calendar({ entries, onDateSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  
  const calendarDays = useMemo(() => {
    const daysInMonth = currentDate.daysInMonth();
    const firstDayOfMonth = currentDate.startOf('month').day();
    const lastDayOfMonth = currentDate.endOf('month').day();
    
    const days = [];
    const entriesByDate = new Map(
      entries.map(entry => [dayjs(entry.date).format('YYYY-MM-DD'), entry])
    );

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-start-${i}`} className="calendar-day opacity-0" />);
    }

    // Add cells for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = currentDate.date(i);
      const dateStr = date.format('YYYY-MM-DD');
      const hasEntry = entriesByDate.has(dateStr);
      const isToday = date.isSame(dayjs(), 'day');

      days.push(
        <button
          key={i}
          onClick={() => onDateSelect(date.toDate())}
          className={`calendar-day hover:bg-surface-hover ${
            hasEntry ? 'has-entry font-medium text-primary' : ''
          } ${
            isToday
              ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-dark-bg'
              : ''
          }`}
        >
          <span className="text-sm">{i}</span>
          {hasEntry && (
            <span className="text-xs text-secondary truncate max-w-[80px]">
              {entriesByDate.get(dateStr)?.title}
            </span>
          )}
        </button>
      );
    }

    // Add empty cells for days after the last day of the month
    for (let i = lastDayOfMonth; i < 6; i++) {
      days.push(<div key={`empty-end-${i}`} className="calendar-day opacity-0" />);
    }

    return days;
  }, [currentDate, entries, onDateSelect]);

  const previousMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const nextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };

  const goToToday = () => {
    setCurrentDate(dayjs());
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-primary">
            {currentDate.format('MMMM YYYY')}
          </h2>
          <button
            onClick={goToToday}
            className="p-1 text-secondary hover:text-primary"
            title="Go to today"
          >
            <RiCalendarLine className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg hover:bg-surface-hover text-secondary hover:text-primary"
          >
            <RiArrowLeftSLine className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-surface-hover text-secondary hover:text-primary"
          >
            <RiArrowRightSLine className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-secondary py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">{calendarDays}</div>
    </div>
  );
} 