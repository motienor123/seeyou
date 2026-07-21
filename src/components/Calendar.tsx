'use client';

import { CalendarEvent } from '@/lib/storage';

interface Props {
  year: number;
  month: number;
  events: CalendarEvent[];
  onPrev: () => void;
  onNext: () => void;
  onDayClick: (date: string) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function pad(n: number) { return String(n).padStart(2, '0'); }

// All days in [start, end] inclusive as YYYY-MM-DD strings
function daysInRange(start: string, end: string): Set<string> {
  const result = new Set<string>();
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) {
    result.add(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

interface DayFlags {
  hasDot: boolean;       // single-day event
  inRange: boolean;      // inside a multi-day range
  isRangeStart: boolean;
  isRangeEnd: boolean;
}

function getDayFlags(dateStr: string, events: CalendarEvent[]): DayFlags {
  let hasDot = false, inRange = false, isRangeStart = false, isRangeEnd = false;
  for (const ev of events) {
    const end = ev.endDate && ev.endDate !== ev.date ? ev.endDate : null;
    if (!end) {
      if (ev.date === dateStr) hasDot = true;
    } else {
      if (dateStr >= ev.date && dateStr <= end) {
        inRange = true;
        if (dateStr === ev.date)  isRangeStart = true;
        if (dateStr === end)      isRangeEnd   = true;
      }
    }
  }
  return { hasDot, inRange, isRangeStart, isRangeEnd };
}

export default function Calendar({ year, month, events, onPrev, onNext, onDayClick }: Props) {
  const today     = new Date();
  const firstDay  = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month + 1, 0).getDate();

  // Expand multi-day events so we can detect ranges spanning into this month
  const expandedEvents = events.filter(e => e.endDate && e.endDate !== e.date);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
      {/* Month header */}
      <div className="flex items-center justify-between px-5 py-4 bg-blue-600 text-white">
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-blue-500 transition-colors text-lg leading-none">‹</button>
        <span className="font-semibold text-base">{MONTH_NAMES[month]} {year}</span>
        <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-blue-500 transition-colors text-lg leading-none">›</button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 border-b border-blue-50">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center py-2 text-xs font-semibold text-blue-400 uppercase tracking-wide">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-12 border-b border-r border-blue-50 last:border-r-0" />;

          const dateStr   = `${year}-${pad(month + 1)}-${pad(day)}`;
          const colIndex  = i % 7;
          const isToday   = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const { hasDot, inRange, isRangeStart, isRangeEnd } = getDayFlags(dateStr, events);

          // Stripe position: starts at cell-center for range start, ends at cell-center for range end
          const stripeLeft  = inRange && isRangeStart && colIndex > 0 ? 'left-1/2' : 'left-0';
          const stripeRight = inRange && isRangeEnd   && colIndex < 6 ? 'right-1/2' : 'right-0';

          return (
            <button
              key={i}
              onClick={() => onDayClick(dateStr)}
              className={`h-12 flex flex-col items-center justify-center border-b border-r border-blue-50 last:border-r-0 transition-colors relative overflow-visible hover:bg-blue-50 group ${isToday && !inRange ? 'bg-blue-50' : ''}`}
            >
              {/* Range stripe */}
              {inRange && (
                <div className={`absolute inset-y-2 bg-blue-100 ${stripeLeft} ${stripeRight}`} />
              )}

              {/* Day number */}
              <span className={`relative z-10 text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium transition-colors group-hover:bg-blue-600 group-hover:text-white ${
                isToday ? 'bg-blue-600 text-white' :
                (isRangeStart || isRangeEnd) ? 'bg-blue-500 text-white' :
                inRange ? 'text-blue-800' :
                'text-gray-700'
              }`}>
                {day}
              </span>

              {/* Dot for single-day events */}
              {hasDot && !inRange && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-blue-500 z-10" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
