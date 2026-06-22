/**
 * Format an ISO-8601 timestamp as a short relative string
 * ("3 minutes ago", "yesterday", "2 weeks ago").
 *
 * Uses `Intl.RelativeTimeFormat` for i18n-correct output. The
 * `numeric: 'auto'` option yields friendlier strings like
 * "yesterday" / "tomorrow" instead of "1 day ago" / "in 1 day".
 */
import { useEffect, useState } from 'react';

const RTF = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** Pick a unit + value that keeps the formatted delta under ~1.5 units. */
function pickUnit(diffMs: number): { value: number; unit: Intl.RelativeTimeFormatUnit } {
  const seconds = Math.round(diffMs / 1000);
  if (Math.abs(seconds) < 60) return { value: seconds, unit: 'second' };
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return { value: minutes, unit: 'minute' };
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return { value: hours, unit: 'hour' };
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return { value: days, unit: 'day' };
  const weeks = Math.round(days / 7);
  if (Math.abs(weeks) < 5) return { value: weeks, unit: 'week' };
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return { value: months, unit: 'month' };
  const years = Math.round(days / 365);
  return { value: years, unit: 'year' };
}

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const { value, unit } = pickUnit(now.getTime() - then.getTime());
  return RTF.format(value, unit);
}

/**
 * Hook that returns a relative-time string and re-renders every
 * `intervalMs` (default 60 s) so the display stays fresh.
 *
 * Cleans up on unmount. Returns '' for invalid timestamps.
 */
export function useRelativeTime(iso: string | null | undefined, intervalMs = 60_000): string {
  const [text, setText] = useState<string>(() => (iso ? formatRelativeTime(iso) : ''));

  useEffect(() => {
    if (!iso) {
      setText('');
      return;
    }
    setText(formatRelativeTime(iso));
    const id = window.setInterval(() => {
      setText(formatRelativeTime(iso));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [iso, intervalMs]);

  return text;
}
