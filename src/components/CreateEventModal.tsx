'use client';

import { useState } from 'react';
import { useLang } from '@/lib/LangContext';

interface Props {
  initialDate?: string;
  initialEndDate?: string;
  onSave: (data: {
    title: string; date: string; endDate?: string;
    time: string; location: string; description: string; locked: boolean;
  }) => void;
  onClose: () => void;
}

export default function CreateEventModal({ initialDate = '', initialEndDate = '', onSave, onClose }: Props) {
  const { t } = useLang();
  const isInitMultiDay = Boolean(initialEndDate && initialEndDate !== initialDate);

  const [title, setTitle]       = useState('');
  const [date, setDate]         = useState(initialDate);
  const [multiDay, setMultiDay] = useState(isInitMultiDay);
  const [endDate, setEndDate]   = useState(isInitMultiDay ? initialEndDate : '');
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

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 text-gray-900 dark:text-white';
  const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl my-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">{t.newEvent}</h2>
        <form onSubmit={submit} className="space-y-4">

          <div>
            <label className={labelCls}>{t.titleLabel}</label>
            <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={t.titlePlaceholder} maxLength={80} className={inputCls} />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={multiDay}
              onChange={e => { setMultiDay(e.target.checked); if (!e.target.checked) setEndDate(''); }}
              className="w-4 h-4 accent-blue-600 rounded" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.multiDayLabel}</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{multiDay ? t.startDateLabel : t.dateLabel}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            </div>
            {multiDay ? (
              <div>
                <label className={labelCls}>{t.endDateLabel}</label>
                <input type="date" value={endDate} min={date || undefined}
                  onChange={e => setEndDate(e.target.value)} className={inputCls} />
              </div>
            ) : (
              <div>
                <label className={labelCls}>{t.timeLabel}</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
              </div>
            )}
          </div>

          {multiDay && (
            <div>
              <label className={labelCls}>{t.timeOptLabel}</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
            </div>
          )}

          <div>
            <label className={labelCls}>{t.locationLabel}</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder={t.locationPlaceholder} maxLength={100} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>{t.descLabel}</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)}
              placeholder={t.descPlaceholder} rows={3} maxLength={300}
              className={`${inputCls} resize-none`} />
          </div>

          <label className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl cursor-pointer select-none">
            <input type="checkbox" checked={locked} onChange={e => setLocked(e.target.checked)}
              className="w-4 h-4 accent-blue-600" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">{t.lockLabel}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                {t.lockHintPrefix}{multiDay && endDate ? t.lockHintMulti : t.lockHintSingle}{t.lockHintSuffix}
              </p>
            </div>
          </label>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {t.cancel}
            </button>
            <button type="submit"
              disabled={!title.trim() || !date || (multiDay && !endDate)}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {t.addEventBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
