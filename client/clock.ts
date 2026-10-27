import { useEffect, useState } from "preact/hooks";

// Offset between this browser's clock and the server's, so every device
// counts down and pixel-steps from the same server timestamps.
let offsetMs = 0;
let syncing: Promise<void> | null = null;

export function syncClock(): Promise<void> {
  syncing ??= (async () => {
    let best = { rtt: Infinity, offset: 0 };
    for (let i = 0; i < 4; i++) {
      try {
        const sent = Date.now();
        const res = await fetch("/api/time", { cache: "no-store" });
        const { now } = (await res.json()) as { now: number };
        const received = Date.now();
        const rtt = received - sent;
        if (rtt < best.rtt) best = { rtt, offset: now - (sent + received) / 2 };
      } catch {
        // Keep whatever we have; local time is a fine fallback.
      }
    }
    if (best.rtt !== Infinity) offsetMs = best.offset;
  })();
  return syncing;
}

export const serverNow = () => Date.now() + offsetMs;

/** Re-renders roughly every `intervalMs` with the current server time. */
export function useServerNow(intervalMs = 100): number {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const timer = setInterval(() => setNow(serverNow()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
