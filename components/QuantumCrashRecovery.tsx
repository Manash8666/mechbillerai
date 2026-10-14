'use client';

import React, { useState } from 'react';

interface QuantumCrashProps {
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  description?: string;
}

export default function QuantumCrashRecovery({
  error,
  reset,
  title = "CORE SYSTEM IRREGULARITY DETECTED",
  description = "A runtime thread was terminated by the quantum telemetry boundary. Activate the holographic matrix core below to initiate full state revival and cashflow engine re-initialization."
}: QuantumCrashProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsChecked(checked);

    if (checked) {
      setIsRebooting(true);
      setTimeout(() => {
        if (reset) {
          reset();
        } else {
          window.location.reload();
        }
      }, 1200);
    }
  };

  return (
    <div className="holo-screen-wrap">
      {/* 3D Moving Perspective Grid Plane */}
      <div className="grid-plane" />

      {/* 3-Layer 3D Depth Starfield */}
      <div className="stars-container">
        <div className="star-layer" />
        <div className="star-layer" />
        <div className="star-layer" />
      </div>

      {/* MotoBan Mission Control Crash Header */}
      <div className="relative z-20 text-center max-w-xl px-6 mb-8 select-none pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-mono font-medium tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          SYSTEM CRASH INTERCEPTED • 0x7E4F
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-mono">
          {title}
        </h1>

        <p className="text-sm text-slate-400 font-sans leading-relaxed mb-3">
          {description}
        </p>

        {error?.message && (
          <div className="p-2.5 rounded-lg bg-black/60 border border-cyan-900/40 text-cyan-400/90 font-mono text-[11px] truncate max-w-lg mx-auto shadow-inner">
            DIAGNOSTIC: {error.message} {error.digest ? `[DIGEST: ${error.digest}]` : ''}
          </div>
        )}
      </div>

      {/* Holographic 3D Interactive Checkbox Chamber */}
      <div className="checkbox-container">
        <input
          className="holo-checkbox-input"
          id="holo-check"
          type="checkbox"
          checked={isChecked}
          onChange={handleToggle}
          disabled={isRebooting}
        />
        <label className="holo-checkbox" htmlFor="holo-check" title="Activate Quantum System Reboot">
          <div className="holo-box">
            <div className="holo-inner" />
            <div className="scan-effect" />
            <div className="holo-particles">
              <div className="holo-particle" />
              <div className="holo-particle" />
              <div className="holo-particle" />
              <div className="holo-particle" />
              <div className="holo-particle" />
              <div className="holo-particle" />
            </div>
            <div className="activation-rings">
              <div className="activation-ring" />
              <div className="activation-ring" />
              <div className="activation-ring" />
            </div>
            <div className="cube-transform">
              <div className="cube-face" />
              <div className="cube-face" />
              <div className="cube-face" />
              <div className="cube-face" />
              <div className="cube-face" />
              <div className="cube-face" />
            </div>
          </div>
          <div className="corner-accent" />
          <div className="corner-accent" />
          <div className="corner-accent" />
          <div className="corner-accent" />
          <div className="holo-glow" />
        </label>

        <div className="status-text" />

        <div className="frequency-spectrum">
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
          <div className="frequency-bar" />
        </div>

        <div className="data-chips">
          <div className="data-chip">
            {isChecked ? "STATUS: REBOOTING [0xFF]" : "STATUS: CRASHED [0x4F]"}
          </div>
          <div className="data-chip">
            {isChecked ? "QUANTUM VERIFY: 100%" : "QUANTUM VERIFY: 82.6%"}
          </div>
          <div className="data-chip">
            {isChecked ? "SYNCH: RESTORING CASHFLOW" : "SYNCH: THREAD SUSPENDED"}
          </div>
          <div className="data-chip">0x7A2C8B9F</div>
        </div>
      </div>

      {/* MotoBan Brand Stamp */}
      <div className="relative z-20 mt-10 text-center font-mono text-xs text-slate-500 tracking-wider">
        <span className="text-cyan-400 font-semibold">MotoBan</span> · Autonomous Garage POS
        <div className="text-[10px] text-slate-600 mt-0.5">Powered by Hybrid StudioZ</div>
      </div>
    </div>
  );
}
