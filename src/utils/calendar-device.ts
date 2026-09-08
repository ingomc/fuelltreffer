/** Browser-only hint for presentation; never persisted or sent to the server. */
export function getCalendarDevice(userAgent = '', platform = '', maxTouchPoints = 0): 'apple' | 'android' | 'unknown' {
  if (/Android/i.test(userAgent)) return 'android';
  const desktopIPad = platform === 'MacIntel' && maxTouchPoints > 1;
  if (/iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(userAgent) || desktopIPad) return 'apple';
  return 'unknown';
}
