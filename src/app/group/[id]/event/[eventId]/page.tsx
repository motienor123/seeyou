'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { storage, CalendarEvent, Snap } from '@/lib/storage';
import { useLang } from '@/lib/LangContext';

function isPast(event: CalendarEvent) {
  const endDate = event.endDate ?? event.date;
  return new Date(endDate + 'T23:59:59') < new Date();
}

export default function EventPage({ params }: { params: Promise<{ id: string; eventId: string }> }) {
  const { id, eventId } = use(params);
  const { t } = useLang();

  const [event, setEvent]     = useState<CalendarEvent | null>(null);
  const [snaps, setSnaps]     = useState<Snap[]>([]);
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
          <p className="text-white text-lg font-semibold">{t.eventNotFound}</p>
          <Link href={`/group/${id}`} className="text-blue-300 text-sm mt-2 block hover:underline">
            {t.backToGroup}
          </Link>
        </div>
      </div>
    );
  }


  const past   = isPast(event);
  const locked = event.locked && !past;
  const isMultiDay = event.endDate && event.endDate !== event.date;
  const d = new Date(event.date + 'T00:00:00');
  const dateLabel = isMultiDay
    ? `${d.toLocaleDateString([], { month: 'long', day: 'numeric' })} – ${new Date(event.endDate! + 'T00:00:00').toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}`
    : d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-blue-600 text-white px-6 py-4 flex items-center gap-3 shadow-md">
        <Link href={`/group/${id}`} className="text-blue-200 hover:text-white transition-colors text-sm shrink-0">
          {t.backBtn}
        </Link>
        <h1 className="font-bold text-lg truncate flex-1">{event.title}</h1>
        {event.locked && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${locked ? 'bg-white/20 text-white' : 'bg-green-400/20 text-green-200'}`}>
            {locked ? t.lockedBadge : t.unlockedBadge}
          </span>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-100 dark:border-gray-800 p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{dateLabel}</p>
              {event.time && <p className="text-sm text-gray-500 dark:text-gray-400">{t.atTime(event.time)}</p>}
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📍</span>
              <p className="text-gray-700 dark:text-gray-300">{event.location}</p>
            </div>
          )}

          {event.description && (
            <div className="flex items-start gap-2.5">
              <span className="text-2xl">📝</span>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{event.description}</p>
            </div>
          )}

          {past && (
            <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-green-50 dark:bg-green-950/40 rounded-xl">
              <span>✅</span>
              <p className="text-green-700 dark:text-green-400 text-sm font-medium">{t.eventHappened}</p>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-base">{t.snapsTitle}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.snapsSubtitle}</p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              {t.addSnap}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handleFiles(e.target.files)} />
          </div>

          {locked ? (
            <div className="bg-blue-950 rounded-2xl p-10 text-center">
              <div className="text-5xl mb-3">🔒</div>
              <p className="text-white font-bold text-lg">{t.snapsLockedTitle}</p>
              <p className="text-blue-300 text-sm mt-2 max-w-xs mx-auto">{t.snapsLockedDesc}</p>
              <p className="text-blue-400 text-xs mt-3 font-medium">{t.snapsWaiting(snaps.length)}</p>
            </div>
          ) : snaps.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-dashed border-blue-200 dark:border-gray-700 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">📷</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t.noSnaps}</p>
              <button onClick={() => fileRef.current?.click()}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-2 hover:underline">
                {t.addFirstSnap}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {snaps.map(snap => (
                <div key={snap.id} className="relative group aspect-square">
                  <img src={snap.dataUrl} alt="snap"
                    className="w-full h-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightbox(snap.dataUrl)} />
                  <button onClick={() => deleteSnap(snap.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    ✕
                  </button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-blue-200 dark:border-gray-700 flex items-center justify-center text-blue-400 dark:text-gray-500 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
                <span className="text-2xl">+</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="snap" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
