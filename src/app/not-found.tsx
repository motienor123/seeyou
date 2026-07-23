import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        {/* 404 card */}
        <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
          <span className="text-3xl font-black text-white/70 tracking-tighter">404</span>
        </div>

        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Page not found</h1>
        <p className="text-blue-300 text-sm mb-8 leading-relaxed">
          This page doesn&apos;t exist or may have been moved.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow-lg"
        >
          Go home
        </Link>

        <p className="text-blue-600 text-xs mt-8 font-medium tracking-wide">seeyou</p>
      </div>
    </div>
  );
}
