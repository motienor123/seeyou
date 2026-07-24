'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { storage, Group, CalendarEvent, Snap } from '@/lib/storage';
import { getColor, EVENT_PALETTE } from '@/lib/colors';
import { useLang } from '@/lib/LangContext';
import Calendar from '@/components/Calendar';
import CreateEventModal from '@/components/CreateEventModal';
import ConfirmModal from '@/components/ConfirmModal';

function isPast(event: CalendarEvent) {
  const endDate = event.endDate ?? event.date;
  return new Date(endDate + 'T23:59:59') < new Date();
}

function fmtShort(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLang();

  const [group, setGroup]                 = useState<Group | null>(null);
  const [events, setEvents]               = useState<CalendarEvent[]>([]);
  const [groupSnaps, setGroupSnaps]       = useState<Snap[]>([]);
  const [calYear, setCalYear]             = useState(new Date().getFullYear());
  const [activeTab, setActiveTab]         = useState<'calendar' | 'camera'>('calendar');
  const [showModal, setShowModal]         = useState(false);
  const [pickedDate, setPickedDate]       = useState('');
  const [pickedEndDate, setPickedEndDate] = useState('');
  const [addFriendMsg, setAddFriendMsg]   = useState(false);
  const [snapToast, setSnapToast]         = useState<string | null>(null);
  const [confirm, setConfirm]             = useState<{ msg: string; action: () => void } | null>(null);

  const avatarFileRef = useRef<HTMLInputElement>(null);
  const cameraFileRef = useRef<HTMLInputElement>(null);
  const snappingEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    const g = storage.getGroups().find(g => g.id === id) || null;
    setGroup(g);
    const evs = storage.getEvents().filter(e => e.groupId === id);
    setEvents(evs);
    const eventIds = new Set(evs.map(e => e.id));
    setGroupSnaps(storage.getSnaps().filter(s => eventIds.has(s.eventId)));
  }, [id]);

  function handleCalendarSelect(start: string, end: string) {
    setPickedDate(start);
    setPickedEndDate(start === end ? '' : end);
    setShowModal(true);
  }

  function saveEvent(data: {
    title: string; date: string; endDate?: string;
    time: string; location: string; description: string; locked: boolean;
  }) {
    const colorIndex = events.length % EVENT_PALETTE.length;
    const ev: CalendarEvent = {
      id: crypto.randomUUID(), groupId: id,
      createdAt: new Date().toISOString(), colorIndex, ...data,
    };
    const next = [...storage.getEvents(), ev];
    storage.saveEvents(next);
    const groupEvs = next.filter(e => e.groupId === id);
    setEvents(groupEvs);
    setShowModal(false);
  }

  function deleteEvent(evId: string) {
    setConfirm({
      msg: t.deleteEventConfirm,
      action: () => {
        const next = storage.getEvents().filter(e => e.id !== evId);
        storage.saveEvents(next);
        const groupEvs = next.filter(e => e.groupId === id);
        setEvents(groupEvs);
        const eventIds = new Set(groupEvs.map(e => e.id));
        setGroupSnaps(storage.getSnaps().filter(s => eventIds.has(s.eventId)));
        setConfirm(null);
      },
    });
  }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !group) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...group, avatar: reader.result as string };
      storage.saveGroups(storage.getGroups().map(g => g.id === id ? updated : g));
      setGroup(updated);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // ── Camera tab snap upload ──────────────────────────────────────────────────
  function snapToEvent(evId: string) {
    snappingEventIdRef.current = evId;
    cameraFileRef.current?.click();
  }

  function handleCameraFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const eventId = snappingEventIdRef.current;
    if (!file || !eventId) return;
    snappingEventIdRef.current = null;

    const reader = new FileReader();
    reader.onload = () => {
      const snap: Snap = {
        id: crypto.randomUUID(), eventId,
        dataUrl: reader.result as string,
        addedAt: new Date().toISOString(),
      };
      const allSnaps = [...storage.getSnaps(), snap];
      storage.saveSnaps(allSnaps);
      const eventIds = new Set(events.map(ev => ev.id));
      setGroupSnaps(allSnaps.filter(s => eventIds.has(s.eventId)));
      const ev = events.find(ev => ev.id === eventId);
      if (ev) {
        setSnapToast(t.snapSentTo(ev.title));
        setTimeout(() => setSnapToast(null), 2500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const yearEvents = events.filter(e => {
    const end = e.endDate ?? e.date;
    return e.date <= `${calYear}-12-31` && end >= `${calYear}-01-01`;
  });

  const upcomingEvents = [...events].filter(e => !isPast(e)).sort((a, b) => a.date.localeCompare(b.date));
  const pastEvents     = [...events].filter(e =>  isPast(e)).sort((a, b) => b.date.localeCompare(a.date));
  const allEventsSorted = [...upcomingEvents, ...pastEvents];

  if (!group) {
    return (
      <div className="min-h-screen bg-blue-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg font-semibold">{t.groupNotFound}</p>
          <Link href="/" className="text-blue-300 text-sm mt-2 block hover:underline">{t.backHome}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-blue-600 text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <Link href="/" className="text-blue-200 hover:text-white transition-colors text-sm shrink-0">
          ← seeyou
        </Link>

        <button onClick={() => avatarFileRef.current?.click()}
          className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative group/av" title={t.changePhoto}>
          {group.avatar ? (
            <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {group.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/av:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
            EDIT
          </div>
        </button>

        <h1 className="font-bold text-lg truncate flex-1">{group.name}</h1>

        <button
          onClick={() => { setAddFriendMsg(true); setTimeout(() => setAddFriendMsg(false), 3000); }}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors shrink-0"
        >
          {t.addFriend}
        </button>
      </header>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-2 flex gap-1.5">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            {t.tabCalendar}
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'camera'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CameraIcon className="w-4 h-4" />
            {t.tabCamera}
          </button>
        </div>
      </div>

      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
      {addFriendMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
          {t.addFriendLater}
        </div>
      )}
      {snapToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white text-sm px-5 py-3 rounded-xl shadow-xl flex items-center gap-2"
          style={{ animation: 'slideInModal 0.2s ease-out forwards' }}>
          <span>📸</span>
          {snapToast}
        </div>
      )}

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {activeTab === 'calendar' && (
          <>
            <Calendar
              year={calYear}
              events={yearEvents}
              onPrevYear={() => setCalYear(y => y - 1)}
              onNextYear={() => setCalYear(y => y + 1)}
              onSelect={handleCalendarSelect}
            />

            <button
              onClick={() => { setPickedDate(''); setPickedEndDate(''); setShowModal(true); }}
              className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors"
            >
              {t.addEventManually}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t.upcoming}</p>
                {upcomingEvents.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
                    <p className="text-gray-400 text-sm">{t.noUpcoming}</p>
                    <button onClick={() => { setPickedDate(''); setPickedEndDate(''); setShowModal(true); }}
                      className="text-blue-600 text-sm font-medium mt-1 hover:underline">
                      {t.planSomething}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map(ev => (
                      <EventCard key={ev.id} event={ev} tripLabel={t.trip} onDelete={deleteEvent} />
                    ))}
                  </div>
                )}
              </div>

              {pastEvents.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t.pastEvents}</p>
                  <div className="space-y-2">
                    {pastEvents.map(ev => (
                      <EventCard key={ev.id} event={ev} tripLabel={t.trip} past onDelete={deleteEvent} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'camera' && (
          <div className="space-y-4">
            {/* Camera tab header */}
            <div className="bg-blue-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <CameraIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-base">{t.quickSnapsTitle}</h2>
                  <p className="text-blue-200 text-xs mt-0.5">{t.quickSnapsSubtitle}</p>
                </div>
              </div>
            </div>

            {allEventsSorted.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3">📷</div>
                <p className="text-gray-400 text-sm">{t.noEventsCamera}</p>
                <button onClick={() => setActiveTab('calendar')}
                  className="text-blue-600 text-sm font-medium mt-2 hover:underline">
                  {t.tabCalendar} →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {allEventsSorted.map(ev => {
                  const color    = getColor(ev.colorIndex);
                  const locked   = ev.locked && !isPast(ev);
                  const past     = isPast(ev);
                  const count    = groupSnaps.filter(s => s.eventId === ev.id).length;
                  const isMulti  = ev.endDate && ev.endDate !== ev.date;
                  const startD   = new Date(ev.date + 'T00:00:00');

                  return (
                    <div
                      key={ev.id}
                      className={`flex items-center gap-3 bg-white border rounded-2xl p-4 transition-all ${
                        past ? 'opacity-60 border-gray-100' : 'border-gray-100 hover:border-blue-100 hover:shadow-sm'
                      }`}
                    >
                      {/* Date badge */}
                      <div
                        className="w-12 h-12 rounded-xl shrink-0 flex flex-col items-center justify-center"
                        style={{ background: past ? '#f3f4f6' : color.card }}
                      >
                        {isMulti ? (
                          <span className={`text-[9px] font-bold text-center leading-tight ${past ? 'text-gray-500' : 'text-white'}`}>
                            {fmtShort(ev.date)}<br/>→{fmtShort(ev.endDate!)}
                          </span>
                        ) : (
                          <>
                            <span className={`text-[10px] font-semibold uppercase ${past ? 'text-gray-400' : 'text-white/70'}`}>
                              {startD.toLocaleDateString([], { month: 'short' })}
                            </span>
                            <span className={`text-base font-black leading-none ${past ? 'text-gray-600' : 'text-white'}`}>
                              {startD.getDate()}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{ev.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {ev.location && (
                            <span className="text-xs text-gray-400 truncate max-w-[120px]">📍 {ev.location}</span>
                          )}
                          <span className="text-xs font-medium" style={{ color: count > 0 ? color.circle : '#9ca3af' }}>
                            {t.snapCount(count)}
                          </span>
                        </div>
                        {locked && (
                          <p className="text-xs text-amber-500 mt-0.5 font-medium">🔒 {t.lockedUntilAfter}</p>
                        )}
                      </div>

                      {/* Action button */}
                      {locked ? (
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                          <span className="text-lg">🔒</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => snapToEvent(ev.id)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white transition-all hover:scale-105 active:scale-95"
                          style={{ background: color.card }}
                          title={`Add snap to ${ev.title}`}
                        >
                          <CameraIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Hidden inputs ──────────────────────────────────────────────────── */}
      <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
      <input ref={cameraFileRef} type="file" accept="image/*" className="hidden" onChange={handleCameraFile} />

      {showModal && (
        <CreateEventModal
          initialDate={pickedDate}
          initialEndDate={pickedEndDate}
          onSave={saveEvent}
          onClose={() => setShowModal(false)}
        />
      )}

      {confirm && (
        <ConfirmModal
          message={confirm.msg}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── EventCard ───────────────────────────────────────────────────────────────

function EventCard({ event, past = false, tripLabel, onDelete }: {
  event: CalendarEvent; past?: boolean; tripLabel: string; onDelete: (id: string) => void;
}) {
  const isMultiDay = event.endDate && event.endDate !== event.date;
  const startD = new Date(event.date + 'T00:00:00');
  const color  = getColor(event.colorIndex);

  return (
    <div
      className={`flex gap-3 bg-white border rounded-2xl p-4 hover:shadow-md transition-all group ${past ? 'opacity-70' : ''}`}
      style={{ borderColor: past ? '#f3f4f6' : `${color.circle}40` }}
    >
      <div
        className={`flex flex-col items-center justify-center rounded-xl shrink-0 ${isMultiDay ? 'w-14 h-12 px-1' : 'w-12 h-12'}`}
        style={{ background: past ? '#f3f4f6' : color.card }}
      >
        {isMultiDay ? (
          <span className={`text-[10px] font-bold text-center leading-tight ${past ? 'text-gray-600' : 'text-white'}`}>
            {fmtShort(event.date)}<br/>→ {fmtShort(event.endDate!)}
          </span>
        ) : (
          <>
            <span className={`text-xs font-semibold uppercase ${past ? 'text-gray-500' : 'text-white/70'}`}>
              {startD.toLocaleDateString([], { month: 'short' })}
            </span>
            <span className={`text-lg font-black leading-none ${past ? 'text-gray-700' : 'text-white'}`}>
              {startD.getDate()}
            </span>
          </>
        )}
      </div>

      <Link href={`/group/${event.groupId}/event/${event.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-gray-900 text-sm truncate">{event.title}</p>
          {isMultiDay && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 text-white"
              style={{ background: color.circle }}>{tripLabel}</span>
          )}
        </div>
        {event.time && <p className="text-xs text-gray-500 mt-0.5">⏰ {event.time}</p>}
        {event.location && <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {event.location}</p>}
        {event.locked && <p className="text-xs text-blue-500 mt-1 font-medium">🔒 Snaps locked</p>}
      </Link>

      <button
        onClick={e => { e.preventDefault(); onDelete(event.id); }}
        className="text-gray-300 hover:text-red-500 text-sm transition-all self-start pt-0.5 opacity-0 group-hover:opacity-100"
      >✕</button>
    </div>
  );
}
