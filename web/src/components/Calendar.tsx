'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { normalizeDateForDisplay } from '@/lib/dateUtils';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarLine,
  RiArrowDownSLine,
} from 'react-icons/ri';

interface CalendarProps {
  entries: {
    id: string;
    date: string;
    title: string;
  }[];
  onDateSelect: (date: Date) => void;
  onClearFilters?: () => void;
}

export function Calendar({ entries, onDateSelect, onClearFilters }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  
  const calendarDays = useMemo(() => {
    const daysInMonth = currentDate.daysInMonth();
    const firstDayOfMonth = currentDate.startOf('month').day();
    
    const days = [];
    const entriesByDate = new Map<string, number>();
    
    // Count entries per date using normalized dates
    entries.forEach(entry => {
      const normalizedDate = normalizeDateForDisplay(entry.date);
      entriesByDate.set(normalizedDate, (entriesByDate.get(normalizedDate) || 0) + 1);
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-start-${i}`} className="calendar-day empty" />);
    }

    // Add cells for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = currentDate.date(i);
      const dateStr = date.format('YYYY-MM-DD');
      const entryCount = entriesByDate.get(dateStr) || 0;
      const isToday = date.isSame(dayjs(), 'day');
      const isSelected = selectedDate && date.isSame(dayjs(selectedDate), 'day');

      days.push(
        <button
          key={i}
          onClick={() => {
            setSelectedDate(date.toDate());
            onDateSelect(date.toDate());
          }}
          className={`calendar-day ${entryCount > 0 ? 'has-entries' : ''} ${
            isToday ? 'today' : ''
          } ${isSelected ? 'selected' : ''}`}
        >
          <span className="day-number">{i}</span>
          {entryCount > 0 && (
            <div className="entry-indicator">
              <span className="entry-count">{entryCount}</span>
            </div>
          )}
        </button>
      );
    }

    // Add empty cells to complete the grid (6 rows max)
    const totalCells = days.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="calendar-day empty" />);
    }

    return days;
  }, [currentDate, entries, selectedDate, onDateSelect]);

  const previousMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const nextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };

  const goToToday = () => {
    setCurrentDate(dayjs());
    setSelectedDate(new Date());
    onDateSelect(new Date());
  };

  const handleClearFilters = () => {
    setSelectedDate(null);
    if (onClearFilters) {
      onClearFilters();
    }
  };

  // Month and year data
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const currentYear = dayjs().year();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handleMonthChange = (monthIndex: number) => {
    setCurrentDate(currentDate.month(monthIndex));
    setShowMonthDropdown(false);
  };

  const handleYearChange = (year: number) => {
    setCurrentDate(currentDate.year(year));
    setShowYearDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setShowMonthDropdown(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <button
          onClick={previousMonth}
          className="nav-button"
          aria-label="Previous month"
        >
          <RiArrowLeftSLine className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-2">
          {/* Month Dropdown */}
          <div className="relative" ref={monthDropdownRef}>
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="flex items-center gap-1 px-3 py-1 bg-surface-hover rounded-md text-text-primary hover:bg-surface-hover/80 transition-colors"
            >
              <span className="text-sm font-medium">{months[currentDate.month()]}</span>
              <RiArrowDownSLine className="w-3 h-3" />
            </button>
            
            {showMonthDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-md shadow-lg z-10 min-w-[80px] max-h-[300px] overflow-y-auto">
                {months.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleMonthChange(index)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors ${
                      currentDate.month() === index ? 'bg-primary text-white' : 'text-text-primary'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year Dropdown */}
          <div className="relative" ref={yearDropdownRef}>
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center gap-1 px-3 py-1 bg-surface-hover rounded-md text-text-primary hover:bg-surface-hover/80 transition-colors"
            >
              <span className="text-sm font-medium">{currentDate.year()}</span>
              <RiArrowDownSLine className="w-3 h-3" />
            </button>
            
            {showYearDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-md shadow-lg z-10 min-w-[80px] max-h-[200px] overflow-y-auto">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearChange(year)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors ${
                      currentDate.year() === year ? 'bg-primary text-white' : 'text-text-primary'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={nextMonth}
          className="nav-button"
          aria-label="Next month"
        >
          <RiArrowRightSLine className="w-4 h-4" />
        </button>
      </div>

      {/* Days of week */}
      <div className="days-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="day-label">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid">
        {calendarDays}
      </div>

      {/* Footer controls */}
      <div className="calendar-footer">
        <button onClick={handleClearFilters} className="footer-button">
          Clear
        </button>
        <button onClick={goToToday} className="footer-button">
          Today
        </button>
      </div>
    </div>
  );
} 