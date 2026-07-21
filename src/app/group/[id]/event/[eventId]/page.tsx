'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { storage, CalendarEvent, Snap } from '@/lib/storage';

function isPast(event: CalendarEvent) {
  const endDate = event.endDate ?? event.date;
  return new Date(endDate + 'T23:59:59') < new Date();
}

export default function EventPage({ params }: { params: Promise<{ id: string; eventId: string }> }) {
  const { id, eventId } = use(params);

  const [event, setEvent]   = useState<CalendarEvent | null>(null);
  const [snaps, setSnaps]   = useState<Snap[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ev = storage.getEvents().find(e => e.id === eventId) || null;
    setEvent(ev);
    setSnaps(storage.getSnaps().filter(s => s.eventId === eventId));
  }, [eventId]);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const snap: Snap = {
          id: crypto.randomUUID(),
          eventId,
          dataUrl: reader.result as string,
          addedAt: new Date().toISOString(),
        };
        const allSnaps = storage.getSnaps();
        const next = [...allSnaps, snap];
        storage.saveSnaps(next);
        setSnaps(next.filter(s => s.eventId === eventId));
      };
      reader.readAsDataURL(file);
    });
  }

  function deleteSnap(snapId: string) {
    const next = storage.getSnaps().filter(s => s.id !== snapId);
    storage.saveSnaps(next);
    setSnaps(next.filter(s => s.eventId === eventId));
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-blue-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg font-semibold">Event not found</p>
          <Link href={`/group/${id}`} className="text-blue-300 text-sm mt-2 block hover:underline">← Back to group</Link>
        </div>
      </div>
    );
  }

  const past = isPast(event);
  const locked = event.locked && !past;
  const isMultiDay = event.endDate && event.endDate !== event.date;
  const d = new Date(event.date + 'T00:00:00');
  const dateLabel = isMultiDay
    ? `${d.toLocaleDateString([], { month: 'long', day: 'numeric' })} – ${new Date(event.endDate! + 'T00:00:00').toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}`
    : d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4 flex items-center gap-3 shadow-md">
        <Link href={`/group/${id}`} className="text-blue-200 hover:text-white transition-colors text-sm shrink-0">
          ← Back
        </Link>
        <h1 className="font-bold text-lg truncate flex-1">{event.title}</h1>
        {event.locked && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${locked ? 'bg-white/20 text-white' : 'bg-green-400/20 text-green-200'}`}>
            {locked ? '🔒 Locked' : '🔓 Unlocked'}
          </span>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Event details card */}
        <div className="bg-white rounded-2xl border border-blue-100 p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-semibold text-gray-900">{dateLabel}</p>
              {event.time && <p className="text-sm text-gray-500">at {event.time}</p>}
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📍</span>
              <p className="text-gray-700">{event.location}</p>
            </div>
          )}

          {event.description && (
            <div className="flex items-start gap-2.5">
              <span className="text-2xl">📝</span>
              <p className="text-gray-700 text-sm leading-relaxed">{event.description}</p>
            </div>
          )}

          {past && (
            <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-green-50 rounded-xl">
              <span>✅</span>
              <p className="text-green-700 text-sm font-medium">This event has happened!</p>
            </div>
          )}
        </div>

        {/* Snaps section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-900 text-base">Snaps</h2>
              <p className="text-xs text-gray-400 mt-0.5">Quick photos from the group</p>
            </div>
            {!locked && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  📸 Add snap
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleFiles(e.target.files)}
                />
              </>
            )}
          </div>

          {/* Locked state */}
          {locked ? (
            <div className="bg-blue-950 rounded-2xl p-10 text-center">
              <div className="text-5xl mb-3">🔒</div>
              <p className="text-white font-bold text-lg">Snaps are locked</p>
              <p className="text-blue-300 text-sm mt-2 max-w-xs mx-auto">
                These photos will be revealed once the event date has passed.
              </p>
              <p className="text-blue-400 text-xs mt-3 font-medium">{snaps.length} snap{snaps.length !== 1 ? 's' : ''} waiting</p>
            </div>
          ) : snaps.length === 0 ? (
            <div className="bg-white border border-dashed border-blue-200 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">📷</div>
              <p className="text-gray-500 text-sm">No snaps yet</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-blue-600 text-sm font-medium mt-2 hover:underline"
              >
                Add the first snap
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {snaps.map(snap => (
                <div key={snap.id} className="relative group aspect-square">
                  <img
                    src={snap.dataUrl}
                    alt="snap"
                    className="w-full h-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightbox(snap.dataUrl)}
                  />
                  <button
                    onClick={() => deleteSnap(snap.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {/* Add more tile */}
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-400 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <span className="text-2xl">+</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="snap" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
