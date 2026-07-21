'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { storage, Group, CalendarEvent } from '@/lib/storage';
import Calendar from '@/components/Calendar';
import CreateEventModal from '@/components/CreateEventModal';

function isPast(event: CalendarEvent) {
  const endDate = event.endDate ?? event.date;
  return new Date(endDate + 'T23:59:59') < new Date();
}

function fmtShort(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [group, setGroup]           = useState<Group | null>(null);
  const [events, setEvents]         = useState<CalendarEvent[]>([]);
  const [calYear, setCalYear]       = useState(new Date().getFullYear());
  const [calMonth, setCalMonth]     = useState(new Date().getMonth());
  const [showModal, setShowModal]   = useState(false);
  const [pickedDate, setPickedDate] = useState('');
  const [addFriendMsg, setAddFriendMsg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const g = storage.getGroups().find(g => g.id === id) || null;
    setGroup(g);
    setEvents(storage.getEvents().filter(e => e.groupId === id));
  }, [id]);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  function onDayClick(date: string) { setPickedDate(date); setShowModal(true); }

  function saveEvent(data: {
    title: string; date: string; endDate?: string;
    time: string; location: string; description: string; locked: boolean;
  }) {
    const ev: CalendarEvent = { id: crypto.randomUUID(), groupId: id, createdAt: new Date().toISOString(), ...data };
    const next = [...storage.getEvents(), ev];
    storage.saveEvents(next);
    setEvents(next.filter(e => e.groupId === id));
    setShowModal(false);
  }

  function deleteEvent(evId: string) {
    if (!confirm('Delete this event?')) return;
    const next = storage.getEvents().filter(e => e.id !== evId);
    storage.saveEvents(next);
    setEvents(next.filter(e => e.groupId === id));
  }

  function changeAvatar() { fileRef.current?.click(); }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !group) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...group, avatar: reader.result as string };
      const allGroups = storage.getGroups().map(g => g.id === id ? updated : g);
      storage.saveGroups(allGroups);
      setGroup(updated);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // Events visible in the current calendar month (including multi-day ranges that overlap)
  const monthEvents = events.filter(e => {
    const start = e.date;
    const end   = e.endDate ?? e.date;
    const mStart = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const mEnd   = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${new Date(calYear, calMonth + 1, 0).getDate().toString().padStart(2, '0')}`;
    return start <= mEnd && end >= mStart;
  });

  const upcomingEvents = [...events].filter(e => !isPast(e)).sort((a, b) => a.date.localeCompare(b.date));
  const pastEvents     = [...events].filter(e =>  isPast(e)).sort((a, b) => b.date.localeCompare(a.date));

  if (!group) {
    return (
      <div className="min-h-screen bg-blue-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg font-semibold">Group not found</p>
          <Link href="/" className="text-blue-300 text-sm mt-2 block hover:underline">← Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <Link href="/" className="text-blue-200 hover:text-white transition-colors text-sm shrink-0">
          ← seeyou
        </Link>

        {/* Avatar */}
        <button onClick={changeAvatar} className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative group/av" title="Change group photo">
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
          👤 Add friend
        </button>
      </header>

      {addFriendMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
          ✦ This feature will be added later
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar */}
        <div className="space-y-4">
          <Calendar year={calYear} month={calMonth} events={monthEvents}
            onPrev={prevMonth} onNext={nextMonth} onDayClick={onDayClick} />
          <button
            onClick={() => { setPickedDate(''); setShowModal(true); }}
            className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors"
          >
            + Add event
          </button>
        </div>

        {/* Events list */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Upcoming</p>
            {upcomingEvents.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
                <p className="text-gray-400 text-sm">No upcoming events</p>
                <button onClick={() => { setPickedDate(''); setShowModal(true); }}
                  className="text-blue-600 text-sm font-medium mt-1 hover:underline">
                  Plan something
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map(ev => <EventCard key={ev.id} event={ev} onDelete={deleteEvent} />)}
              </div>
            )}
          </div>

          {pastEvents.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Past events</p>
              <div className="space-y-2">
                {pastEvents.map(ev => <EventCard key={ev.id} event={ev} past onDelete={deleteEvent} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />

      {showModal && (
        <CreateEventModal initialDate={pickedDate} onSave={saveEvent} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

function EventCard({ event, past = false, onDelete }: { event: CalendarEvent; past?: boolean; onDelete: (id: string) => void }) {
  const isMultiDay = event.endDate && event.endDate !== event.date;
  const startD = new Date(event.date + 'T00:00:00');

  return (
    <Link
      href={`/group/${event.groupId}/event/${event.id}`}
      className={`flex gap-3 bg-white border rounded-2xl p-4 hover:shadow-md transition-all group ${past ? 'border-gray-100 opacity-70' : 'border-blue-100 hover:border-blue-200'}`}
    >
      {/* Date badge */}
      <div className={`flex flex-col items-center justify-center rounded-xl shrink-0 ${isMultiDay ? 'w-14 h-12 px-1' : 'w-12 h-12'} ${past ? 'bg-gray-100' : 'bg-blue-600'}`}>
        {isMultiDay ? (
          <span className={`text-[10px] font-bold text-center leading-tight ${past ? 'text-gray-600' : 'text-white'}`}>
            {fmtShort(event.date)}<br/>→ {fmtShort(event.endDate!)}
          </span>
        ) : (
          <>
            <span className={`text-xs font-semibold uppercase ${past ? 'text-gray-500' : 'text-blue-200'}`}>
              {startD.toLocaleDateString([], { month: 'short' })}
            </span>
            <span className={`text-lg font-black leading-none ${past ? 'text-gray-700' : 'text-white'}`}>
              {startD.getDate()}
            </span>
          </>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-gray-900 text-sm truncate">{event.title}</p>
          {isMultiDay && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">trip</span>}
        </div>
        {event.time && <p className="text-xs text-gray-500 mt-0.5">⏰ {event.time}</p>}
        {event.location && <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {event.location}</p>}
        {event.locked && <p className="text-xs text-blue-500 mt-1 font-medium">🔒 Snaps locked</p>}
      </div>

      <button
        onClick={e => { e.preventDefault(); onDelete(event.id); }}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 text-sm transition-all self-start"
      >
        ✕
      </button>
    </Link>
  );
}
