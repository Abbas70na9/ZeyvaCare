/**
 * Turns a real creation timestamp into a human-friendly, LIVE relative label
 * ("Just now", "5 minutes ago", "3 hours ago", "Yesterday", "2 weeks ago"...).
 *
 * Unlike a static "Just now" string saved once at submit time, this is
 * recomputed from the actual `createdAt` timestamp every time it's called —
 * so it keeps advancing the longer the review has existed, instead of being
 * frozen forever.
 *
 * `fallback` is used for older/seed reviews that don't have a real
 * `createdAt` timestamp (e.g. the default demo reviews), so their existing
 * fixed text (e.g. "2 weeks ago") keeps showing exactly as before.
 */
export function formatRelativeTime(createdAt?: number, fallback?: string): string {
  if (!createdAt || Number.isNaN(createdAt)) {
    return fallback || "Recent";
  }

  const diffMs = Date.now() - createdAt;
  if (diffMs < 0) return fallback || "Just now";

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) {
    const m = Math.floor(diffMs / minute);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diffMs < day) {
    const h = Math.floor(diffMs / hour);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (diffMs < 2 * day) return "Yesterday";
  if (diffMs < week) {
    const d = Math.floor(diffMs / day);
    return `${d} days ago`;
  }
  if (diffMs < month) {
    const w = Math.floor(diffMs / week);
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }
  if (diffMs < year) {
    const mo = Math.floor(diffMs / month);
    return `${mo} month${mo === 1 ? "" : "s"} ago`;
  }
  const y = Math.floor(diffMs / year);
  return `${y} year${y === 1 ? "" : "s"} ago`;
}
