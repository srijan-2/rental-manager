import { parseISODate } from './date';

export function daysSince(isoTimestamp: string, todayIso: string) {
  const date = parseISODate(isoTimestamp.slice(0, 10));
  const today = parseISODate(todayIso);
  return Math.max(0, Math.round((today.getTime() - date.getTime()) / 86400000));
}
