'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/lib/storage';

interface Props {
  year: number;
  events: CalendarEvent[];
  onPrevYear: () => void;
  onNextYear: () => void;
  onSelect: (start: string, end: string) => void;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_ABBR = ['S','M','T','W','T','F','S'];

function pad(n: number) { return String(n).padStart(2, '0'); }

function getDayFlags(dateStr: string, events: CalendarEvent[]) {
  let hasDot = false, inRange = false, isRangeStart = false, isRangeEnd = false;
  for (const ev of events) {
    const end = ev.endDate && ev.endDate !== ev.date ? ev.endDate : null;
    if (!end) {
      if (ev.date === dateStr) hasDot = true;
    } else {
      if (dateStr >= ev.date && dateStr <= end) {
        inRange = true;
        if (dateStr === ev.date) isRangeStart = true;
        if (dateStr === end) isRangeEnd = true;
      }
    }
  }
  return { hasDot, inRange, isRangeStart, isRangeEnd };
}

export default function Calendar({ year, events, onPrevYear, onNextYear, onSelect }: Props) {
  const [selStart, setSelStart] = useState<string | null>(null);
  const [hovDate, setHovDate] = useState<string | null>(null);

  useEffect(() => {
    setSelStart(null);
    setHovDate(null);
  }, [year]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // Normalize selection preview (start ≤ end)
  const previewEnd = selStart ? (hovDate ?? selStart) : null;
  const normStart = selStart && previewEnd
    ? (selStart <= previewEnd ? selStart : previewEnd)
    : null;
  const normEnd = selStart && previewEnd
    ? (selStart <= previewEnd ? previewEnd : selStart)
    : null;

  function handleDayClick(dateStr: string) {
    if (!selStart) {
      setSelStart(dateStr);
    } else {
      const s = selStart <= dateStr ? selStart : dateStr;
      const e = selStart <= dateStr ? dateStr : selStart;
      setSelStart(null);
      setHovDate(null);
      onSelect(s, e);
    }
  }

  function handleDayHover(dateStr: string | null) {
    if (selStart) setHovDate(dateStr);
  }

  const isSelectingRange = normStart && normEnd && normStart !== normEnd;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
      {/* Year header */}
      <div className="flex items-center justify-between px-5 py-3 bg-blue-600 text-white">
        <button
          onClick={() => { setSelStart(null); onPrevYear(); }}
          className="p-2 rounded-lg hover:bg-blue-500 transition-colors text-xl leading-none"
        >‹</button>
        <span className="font-bold text-xl">{year}</span>
        <button
          onClick={() => { setSelStart(null); onNextYear(); }}
          className="p-2 rounded-lg hover:bg-blue-500 transition-colors text-xl leading-none"
        >›</button>
      </div>

      {/* Hint bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100">
        {selStart ? (
          <>
            <span className="text-xs text-blue-700 font-medium">
              {isSelectingRange
                ? `${normStart} → ${normEnd}`
                : `From ${selStart} — tap an end date (or same day for single-day)`}
            </span>
            <button
              onClick={() => { setSelStart(null); setHovDate(null); }}
              className="text-xs text-blue-500 hover:text-blue-700 font-semibold ml-3 shrink-0"
            >Cancel</button>
          </>
        ) : (
          <p className="text-xs text-blue-400 w-full text-center">Tap a day to start adding an event</p>
        )}
      </div>

      {/* 12 months grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 divide-x divide-y divide-blue-50">
        {Array.from({ length: 12 }, (_, month) => (
          <MonthGrid
            key={month}
            year={year}
            month={month}
            events={events}
            todayStr={todayStr}
            normStart={normStart}
            normEnd={normEnd}
            onDayClick={handleDayClick}
            onDayHover={handleDayHover}
          />
        ))}
      </div>
    </div>
  );
}

function MonthGrid({ year, month, events, todayStr, normStart, normEnd, onDayClick, onDayHover }: {
  year: number;
  month: number;
  events: CalendarEvent[];
  todayStr: string;
  normStart: string | null;
  normEnd: string | null;
  onDayClick: (d: string) => void;
  onDayHover: (d: string | null) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selIsRange = normStart && normEnd && normStart !== normEnd;

  return (
    <div className="p-3">
      <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-2 text-center">
        {MONTH_NAMES[month]}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {DAY_ABBR.map((d, i) => (
          <span key={i} className="text-[9px] text-gray-300 text-center font-bold">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-7" />;

          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const colIdx = i % 7;
          const isToday = dateStr === todayStr;
          const { hasDot, inRange, isRangeStart, isRangeEnd } = getDayFlags(dateStr, events);

          const inSel = normStart && normEnd
            ? dateStr >= normStart && dateStr <= normEnd
            : dateStr === normStart;
          const isSelStart = dateStr === normStart;
          const isSelEnd = Boolean(normEnd && dateStr === normEnd);

          // Event range stripe edges
          const evLeft  = inRange && isRangeStart && colIdx > 0 ? 'left-1/2' : 'left-0';
          const evRight = inRange && isRangeEnd   && colIdx < 6 ? 'right-1/2' : 'right-0';

          // Selection stripe edges
          const selLeft  = inSel && isSelStart && selIsRange && colIdx > 0 ? 'left-1/2' : 'left-0';
          const selRight = inSel && isSelEnd   && selIsRange && colIdx < 6 ? 'right-1/2' : 'right-0';

          const circleClass =
            isToday             ? 'bg-blue-600 text-white' :
            isSelStart || isSelEnd ? 'bg-blue-500 text-white' :
            isRangeStart || isRangeEnd ? 'bg-blue-400 text-white' :
            inSel || inRange    ? 'text-blue-800' :
            'text-gray-700';

          return (
            <button
              key={i}
              onClick={() => onDayClick(dateStr)}
              onMouseEnter={() => onDayHover(dateStr)}
              onMouseLeave={() => onDayHover(null)}
              className="h-7 relative flex items-center justify-center group"
            >
              {/* Event range stripe */}
              {inRange && (
                <div className={`absolute inset-y-1 bg-blue-100 ${evLeft} ${evRight}`} />
              )}
              {/* Selection stripe */}
              {inSel && selIsRange && (
                <div className={`absolute inset-y-1 bg-blue-200 ${selLeft} ${selRight}`} />
              )}

              <span className={`relative z-10 text-[10px] w-5 h-5 flex items-center justify-center rounded-full transition-colors group-hover:bg-blue-500 group-hover:text-white ${circleClass}`}>
                {day}
              </span>

              {hasDot && !inRange && !inSel && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500 z-10" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
