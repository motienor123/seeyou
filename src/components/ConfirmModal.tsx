'use client';

import { useEffect } from 'react';
import { useLang } from '@/lib/LangContext';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ message, onConfirm, onCancel }: Props) {
  const { t } = useLang();

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: 'fadeInBackdrop 0.15s ease-out forwards' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Card */}
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        style={{ animation: 'slideInModal 0.2s ease-out forwards' }}
      >
        {/* Top accent stripe */}
        <div className="h-1 bg-gradient-to-r from-red-400 to-red-600" />

        <div className="p-6">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1.5">{t.confirmTitle}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed mb-1">{message}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-6">{t.confirmCannotUndo}</p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: 'linear-gradient(135deg, #f87171, #dc2626)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, #f87171, #dc2626)')}
            >
              {t.deleteBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
