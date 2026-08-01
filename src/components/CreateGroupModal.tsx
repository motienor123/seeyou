'use client';

import { useState } from 'react';
import { useLang } from '@/lib/LangContext';

interface Props {
  onCreate: (name: string) => void;
  onClose: () => void;
}

export default function CreateGroupModal({ onCreate, onClose }: Props) {
  const { t } = useLang();
  const [name, setName] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t.createAGroup}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t.groupNameHint}</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t.groupNamePlaceholder}
            maxLength={50}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 text-gray-900 dark:text-white"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t.createGroupBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
