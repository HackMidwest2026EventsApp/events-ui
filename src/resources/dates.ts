/** Event times are UTC instants plus the venue's timezone, so they are
 *  formatted in *that* zone: 7pm in Kansas City reads as 7pm everywhere. */

export const formatEventTime = (iso: string, timeZone?: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(date);
  } catch {
    // An unknown IANA zone throws rather than falling back on its own.
    return date.toLocaleString();
  }
};

export const hasEnded = (iso: string): boolean => {
  const end = new Date(iso).getTime();
  return !Number.isNaN(end) && end < Date.now();
};
