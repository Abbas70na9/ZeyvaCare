import { useEffect, useState } from "react";

/**
 * Forces the component to re-render every `intervalMs` (default 60s) so that
 * relative timestamps (computed at render time from a review's `createdAt`)
 * keep advancing — "Just now" turns into "2 minutes ago", etc. — without
 * needing a page refresh.
 */
export function useLiveClock(intervalMs = 60_000): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
}
