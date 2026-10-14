"use client";

import { useEffect } from "react";

interface TelemetryBeaconProps {
  source?: string;
}

export default function TelemetryBeacon({
  source = "mechbillerai",
}: TelemetryBeaconProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Run once per session to avoid redundant pings
    const sessionKey = `_mb_telemetry_${source}`;
    if (sessionStorage.getItem(sessionKey)) return;

    try {
      const payload = {
        source,
        hostname: window.location.hostname,
        origin: window.location.origin,
        pathname: window.location.pathname,
        timestamp: Date.now(),
        screen: {
          width: window.screen.width,
          height: window.screen.height,
        },
      };

      const endpoint = "https://motoban.in/api/telemetry";

      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], {
          type: "application/json",
        });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          mode: "cors",
          keepalive: true,
        }).catch(() => {});
      }

      sessionStorage.setItem(sessionKey, "1");
    } catch {}
  }, [source]);

  return (
    // Remote tracking pixel: Even if JS is disabled or blocked, the browser's HTTP Referer header reports back to motoban.in
    <img
      src={`https://motoban.in/api/beacon?src=${source}`}
      alt=""
      width={1}
      height={1}
      className="hidden pointer-events-none opacity-0 fixed bottom-0 left-0 -z-50"
      aria-hidden="true"
    />
  );
}
