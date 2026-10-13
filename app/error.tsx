'use client';

import { useEffect } from 'react';
import QuantumCrashRecovery from '@/components/QuantumCrashRecovery';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log crash to telemetry or console
    console.error('[MechBillerAI System Crash Captured]:', error);
  }, [error]);

  return (
    <QuantumCrashRecovery
      error={error}
      reset={reset}
      title="SYSTEM RUNTIME BREACH ENCOUNTERED"
      description="The application layer faced an unexpected state exception. Toggle the holographic quantum core below to purge volatile cache and revive your garage session."
    />
  );
}
