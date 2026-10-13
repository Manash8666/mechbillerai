'use client';

import { useEffect } from 'react';
import QuantumCrashRecovery from '@/components/QuantumCrashRecovery';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[MechBillerAI Root Crash Captured]:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 p-0 bg-slate-950 text-white overflow-hidden">
        <QuantumCrashRecovery
          error={error}
          reset={reset}
          title="CRITICAL ROOT SYSTEM CRASH"
          description="Root application hierarchy encountered a fatal failure. Toggle the quantum reboot core to restart the core application container."
        />
      </body>
    </html>
  );
}
