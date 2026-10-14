import Link from 'next/link';
import Animated404Face from '@/components/Animated404Face';

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0%,transparent_60%)] pointer-events-none" />

      {/* Grid line pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center flex flex-col items-center">
        {/* Animated 404 Face */}
        <Animated404Face size={160} color="#38bdf8" />

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          HTTP 404 • ROUTE UNCHARTED
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono mb-3">
          PAGE NOT FOUND
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-md mb-8">
          The garage bay, invoice, or route you are looking for has been relocated or never existed in the matrix.
        </p>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-center"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/dashboard/jobcards"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 font-medium text-sm transition-all duration-200 text-center"
          >
            Open Job Cards
          </Link>
        </div>

        {/* Branding Footer */}
        <div className="mt-14 font-mono text-xs text-slate-500">
          <span className="text-cyan-400 font-semibold">MotoBan</span> · Autonomous Garage POS
          <div className="text-[10px] text-slate-600 mt-0.5">Powered by Hybrid StudioZ</div>
        </div>
      </div>
    </div>
  );
}
