// Match dates are shown in the league's local time. The parts are read with a
// fixed time zone and assembled by hand, so the server (UTC in the container)
// and every browser produce exactly the same text. Pass instants that carry an
// offset, such as 3K's `datePlanned`.
export const TIME_ZONE = 'Europe/Berlin';

const WEEKDAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const partsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

/** Calendar fields of a date in league time, or null for a missing or invalid date. */
function getLeagueParts(value) {
  const date = value instanceof Date ? value : new Date(value ?? NaN);
  if (Number.isNaN(date.getTime())) return null;

  const parts = Object.fromEntries(partsFormat.formatToParts(date).map(part => [part.type, part.value]));
  return {
    weekday: WEEKDAY_KEYS.indexOf(parts.weekday),
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: parts.hour,
    minute: parts.minute
  };
}

const pad = (value) => String(value).padStart(2, '0');

/** Compact date for list rows, e.g. { weekday: 'Fr', date: '13.11.', time: '18:00' }. */
export function formatShortDate(dateString) {
  const parts = getLeagueParts(dateString);
  if (!parts) return { weekday: '', date: '–', time: '–' };
  return {
    weekday: WEEKDAYS_SHORT[parts.weekday],
    date: `${pad(parts.day)}.${pad(parts.month)}.`,
    time: `${parts.hour}:${parts.minute}`
  };
}

/** Long date without the year, e.g. "Freitag, 13. November". */
export function formatLongDate(dateString) {
  const parts = getLeagueParts(dateString);
  if (!parts) return 'Termin offen';
  return `${WEEKDAYS_LONG[parts.weekday]}, ${parts.day}. ${MONTHS[parts.month - 1]}`;
}

/** Human readable distance in days, e.g. "Heute", "Morgen", "in 4 Tagen". */
export function formatRelativeDay(dateString, now = new Date()) {
  const target = getLeagueParts(dateString);
  const today = getLeagueParts(now);
  if (!target || !today) return '';

  const dayNumber = (parts) => Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000;
  const days = dayNumber(target) - dayNumber(today);
  if (days === 0) return 'Heute';
  if (days === 1) return 'Morgen';
  if (days === -1) return 'Gestern';
  return days > 0 ? `in ${days} Tagen` : `vor ${-days} Tagen`;
}
