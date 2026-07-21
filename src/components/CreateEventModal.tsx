'use client';

import { useState } from 'react';

interface Props {
  initialDate?: string;
  onSave: (data: {
    title: string; date: string; endDate?: string;
    time: string; location: string; description: string; locked: boolean;
  }) => void;
  onClose: () => void;
}

export default function CreateEventModal({ initialDate = '', onSave, onClose }: Props) {
  const [title, setTitle]       = useState('');
  const [date, setDate]         = useState(initialDate);
  const [multiDay, setMultiDay] = useState(false);
  const [endDate, setEndDate]   = useState('');
  const [time, setTime]         = useState('');
  const [location, setLocation] = useState('');
  const [description, setDesc]  = useState('');
  const [locked, setLocked]     = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    if (multiDay && endDate && endDate < date) return;
    onSave({
      title: title.trim(),
      date,
      endDate: multiDay && endDate ? endDate : undefined,
      time,
      location: location.trim(),
      description: description.trim(),
      locked,
    });
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-900';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl my-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-5">New event</h2>
        <form onSubmit={submit} className="space-y-4">

          {/* Title */}
          <div>
            <label className={labelCls}>Title *</label>
            <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Beach day 🏖️" maxLength={80} className={inputCls} />
          </div>

          {/* Multi-day toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={multiDay} onChange={e => { setMultiDay(e.target.checked); setEndDate(''); }}
              className="w-4 h-4 accent-blue-600 rounded" />
            <span className="text-sm font-medium text-gray-700">Multi-day event (e.g. vacation)</span>
          </label>

          {/* Dates */}
          <div className={`grid gap-3 ${multiDay ? 'grid-cols-2' : 'grid-cols-2'}`}>
            <div>
              <label className={labelCls}>{multiDay ? 'Start date *' : 'Date *'}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            </div>
            {multiDay ? (
              <div>
                <label className={labelCls}>End date *</label>
                <input type="date" value={endDate} min={date || undefined}
                  onChange={e => setEndDate(e.target.value)} className={inputCls} />
              </div>
            ) : (
              <div>
                <label className={labelCls}>Time</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
              </div>
            )}
          </div>

          {/* Time (only for single-day, already shown above in second column) */}
          {multiDay && (
            <div>
              <label className={labelCls}>Time (optional)</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
            </div>
          )}

          {/* Location */}
          <div>
            <label className={labelCls}>Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Where are you going?" maxLength={100} className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)}
              placeholder="What's the plan?" rows={3} maxLength={300}
              className={`${inputCls} resize-none`} />
          </div>

          {/* Lock snaps */}
          <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer select-none">
            <input type="checkbox" checked={locked} onChange={e => setLocked(e.target.checked)}
              className="w-4 h-4 accent-blue-600" />
            <div>
              <p className="text-sm font-semibold text-blue-900">🔒 Lock snaps until after the event</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Photos unlock once {multiDay && endDate ? 'the last day' : 'the event date'} has passed
              </p>
            </div>
          </label>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit"
              disabled={!title.trim() || !date || (multiDay && !endDate)}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Add event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
