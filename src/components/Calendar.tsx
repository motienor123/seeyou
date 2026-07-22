'use client';

import { useState, useEffect, useRef } from 'react';
import { CalendarEvent } from '@/lib/storage';
import { getColor } from '@/lib/colors';
import { useLang } from '@/lib/LangContext';

interface Props {
  year: number;
  events: CalendarEvent[];
  onPrevYear: () => void;
  onNextYear: () => void;
  onSelect: (start: string, end: string) => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

// Season background and accent per month (0 = Jan)
const SEASON: Record<string, { bg: string; accent: string }> = {
  winter: { bg: '#eff6ff', accent: '#60a5fa' },
  spring: { bg: '#f0fdf4', accent: '#4ade80' },
  summer: { bg: '#fefce8', accent: '#facc15' },
  autumn: { bg: '#fff7ed', accent: '#fb923c' },
};

function getSeason(month: number) {
  if (month === 11 || month <= 1) return SEASON.winter;
  if (month <= 4)  return SEASON.spring;
  if (month <= 7)  return SEASON.summer;
  return SEASON.autumn;
}

function getEventsForDay(dateStr: string, events: CalendarEvent[]) {
  const singleDay: CalendarEvent[] = [];
  const ranges: { ev: CalendarEvent; isStart: boolean; isEnd: boolean }[] = [];
  for (const ev of events) {
    const isRange = ev.endDate && ev.endDate !== ev.date;
    if (isRange) {
      if (dateStr >= ev.date && dateStr <= ev.endDate!) {
        ranges.push({ ev, isStart: dateStr === ev.date, isEnd: dateStr === ev.endDate });
      }
    } else {
      if (ev.date === dateStr) singleDay.push(ev);
    }
  }
  return { singleDay, ranges };
}

export default function Calendar({ year, events, onPrevYear, onNextYear, onSelect }: Props) {
  const { t } = useLang();
  const [selStart, setSelStart] = useState<string | null>(null);
  const [hovDate, setHovDate]   = useState<string | null>(null);

  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tooltip, setTooltip] = useState<{ events: CalendarEvent[]; rect: DOMRect } | null>(null);

  useEffect(() => { setSelStart(null); setHovDate(null); }, [year]);
  useEffect(() => {
    return () => { if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); };
  }, []);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const previewEnd = selStart ? (hovDate ?? selStart) : null;
  const normStart = selStart && previewEnd
    ? (selStart <= previewEnd ? selStart : previewEnd) : null;
  const normEnd = selStart && previewEnd
    ? (selStart <= previewEnd ? previewEnd : selStart) : null;
  const selIsRange = Boolean(normStart && normEnd && normStart !== normEnd);

  function handleDayClick(dateStr: string) {
    if (!selStart) {
      setSelStart(dateStr);
    } else {
      const s = selStart <= dateStr ? selStart : dateStr;
      const e = selStart <= dateStr ? dateStr : selStart;
      setSelStart(null); setHovDate(null);
      onSelect(s, e);
    }
  }

  function showTooltip(dayEvents: CalendarEvent[], e: React.MouseEvent<HTMLButtonElement>) {
    if (dayEvents.length === 0) return;
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltip({ events: dayEvents, rect: e.currentTarget.getBoundingClientRect() });
  }

  function hideTooltip() {
    tooltipTimerRef.current = setTimeout(() => setTooltip(null), 80);
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
        {/* Year header */}
        <div className="flex items-center justify-between px-5 py-3 bg-blue-600 text-white">
          <button onClick={() => { setSelStart(null); onPrevYear(); }}
            className="p-2 rounded-lg hover:bg-blue-500 transition-colors text-xl leading-none">‹</button>
          <span className="font-bold text-xl">{year}</span>
          <button onClick={() => { setSelStart(null); onNextYear(); }}
            className="p-2 rounded-lg hover:bg-blue-500 transition-colors text-xl leading-none">›</button>
        </div>

        {/* Hint bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100 min-h-[36px]">
          {selStart ? (
            <>
              <span className="text-xs text-blue-700 font-medium">
                {selIsRange
                  ? `${normStart} → ${normEnd}`
                  : `${t.fromLabel} ${selStart} — ${t.tapEndDate}`}
              </span>
              <button onClick={() => { setSelStart(null); setHovDate(null); }}
                className="text-xs text-blue-500 hover:text-blue-700 font-semibold ml-3 shrink-0">
                {t.cancel}
              </button>
            </>
          ) : (
            <p className="text-xs text-blue-400 w-full text-center">{t.tapToAdd}</p>
          )}
        </div>

        {/* 12 months */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 divide-x divide-y divide-blue-50">
          {Array.from({ length: 12 }, (_, month) => (
            <MonthGrid
              key={month}
              year={year}
              month={month}
              monthName={t.months[month]}
              dayAbbr={t.days}
              events={events}
              todayStr={todayStr}
              normStart={normStart}
              normEnd={normEnd}
              selIsRange={selIsRange}
              onDayClick={handleDayClick}
              onDayHover={date => { if (selStart) setHovDate(date); }}
              onShowTooltip={showTooltip}
              onHideTooltip={hideTooltip}
            />
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (() => {
        const above = tooltip.rect.top > 130;
        return (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltip.rect.left + tooltip.rect.width / 2,
              top: above ? tooltip.rect.top - 10 : tooltip.rect.bottom + 10,
              transform: above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl border border-gray-100 p-2.5 min-w-[150px] max-w-[230px]"
              style={{ animation: 'fadeInTooltip 0.15s ease-out forwards' }}
            >
              {tooltip.events.map((ev, i) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-2 py-1.5 first:pt-0 last:pb-0"
                  style={{ borderBottom: i < tooltip.events.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                >
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0"
                    style={{ background: getColor(ev.colorIndex).circle }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{ev.title}</p>
                    {ev.endDate && ev.endDate !== ev.date && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{ev.date} → {ev.endDate}</p>
                    )}
                    {ev.time && <p className="text-[10px] text-gray-400 mt-0.5">⏰ {ev.time}</p>}
                    {ev.location && <p className="text-[10px] text-gray-400 truncate">📍 {ev.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </>
  );
}

function MonthGrid({ year, month, monthName, dayAbbr, events, todayStr, normStart, normEnd, selIsRange,
  onDayClick, onDayHover, onShowTooltip, onHideTooltip }: {
  year: number; month: number; monthName: string; dayAbbr: readonly string[];
  events: CalendarEvent[]; todayStr: string;
  normStart: string | null; normEnd: string | null; selIsRange: boolean;
  onDayClick: (d: string) => void;
  onDayHover: (d: string | null) => void;
  onShowTooltip: (evs: CalendarEvent[], e: React.MouseEvent<HTMLButtonElement>) => void;
  onHideTooltip: () => void;
}) {
  const season = getSeason(month);
  const firstDay  = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="p-3" style={{ background: season.bg }}>
      <p className="text-[11px] font-bold uppercase tracking-wider mb-2 text-center"
        style={{ color: season.accent }}>
        {monthName}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {dayAbbr.map((d, i) => (
          <span key={i} className="text-[9px] text-gray-300 text-center font-bold">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-8" />;

          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const colIdx  = i % 7;
          const isToday = dateStr === todayStr;

          const { singleDay, ranges } = getEventsForDay(dateStr, events);
          const primaryRange = ranges[0] ?? null;
          const allDayEvents = [...ranges.map(r => r.ev), ...singleDay];

          const inSel = normStart && normEnd
            ? dateStr >= normStart && dateStr <= normEnd
            : dateStr === normStart;
          const isSelStart = dateStr === normStart;
          const isSelEnd   = Boolean(normEnd && dateStr === normEnd);

          const evLeft  = primaryRange?.isStart && colIdx > 0 ? '50%' : '0';
          const evRight = primaryRange?.isEnd   && colIdx < 6 ? '50%' : '0';
          const selLeft  = inSel && isSelStart && selIsRange && colIdx > 0 ? '50%' : '0';
          const selRight = inSel && isSelEnd   && selIsRange && colIdx < 6 ? '50%' : '0';

          const evColor = primaryRange ? getColor(primaryRange.ev.colorIndex) : null;
          let circleStyle: React.CSSProperties = {};
          if (isToday) {
            circleStyle = { background: '#1d4ed8', color: 'white' };
          } else if (isSelStart || isSelEnd) {
            circleStyle = { background: '#3b82f6', color: 'white' };
          } else if (evColor && (primaryRange!.isStart || primaryRange!.isEnd)) {
            circleStyle = { background: evColor.circle, color: 'white' };
          }

          return (
            <button
              key={i}
              onClick={() => onDayClick(dateStr)}
              onMouseEnter={e => {
                onDayHover(dateStr);
                if (allDayEvents.length > 0) onShowTooltip(allDayEvents, e);
              }}
              onMouseLeave={() => { onDayHover(null); onHideTooltip(); }}
              className="h-8 relative flex flex-col items-center justify-center group"
            >
              {primaryRange && (
                <div className="absolute" style={{
                  top: '4px', bottom: '6px',
                  left: evLeft, right: evRight,
                  background: evColor!.stripe,
                }} />
              )}
              {inSel && selIsRange && (
                <div className="absolute bg-blue-200"
                  style={{ top: '4px', bottom: '6px', left: selLeft, right: selRight }} />
              )}
              <span
                className="relative z-10 text-[10px] w-5 h-5 flex items-center justify-center rounded-full transition-colors group-hover:bg-blue-500 group-hover:text-white"
                style={circleStyle}
              >{day}</span>
              {singleDay.length > 0 && (
                <div className="absolute bottom-0.5 flex gap-0.5 justify-center z-10 left-0 right-0">
                  {singleDay.slice(0, 3).map((ev, ei) => (
                    <span key={ei} className="w-1 h-1 rounded-full"
                      style={{ background: getColor(ev.colorIndex).circle }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
