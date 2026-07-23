'use client';

import Link from 'next/link';
import { useLang } from '@/lib/LangContext';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        {/* Icon card */}
        <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
          <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">{t.errorTitle}</h1>
        <p className="text-blue-300 text-sm mb-8 leading-relaxed">{t.errorDesc}</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-sm font-semibold transition-colors backdrop-blur-sm"
          >
            {t.tryAgain}
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            {t.goHome}
          </Link>
        </div>

        <p className="text-blue-600 text-xs mt-8 font-medium tracking-wide">seeyou</p>
      </div>
    </div>
  );
}
