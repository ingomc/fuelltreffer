/**
 * Read-only passthrough to the 3K frontend API for sibling apps (e.g. the
 * Dart Story Maker) whose servers cannot reach 3K directly. Only the
 * endpoints those apps need are allowed, so this is not an open proxy.
 */
const ALLOWED_PATHS = [
  /^participant\/\d+$/,
  /^event\/\d+$/,
  /^event\/\d+\/participant$/,
  /^event\/\d+\/match\/\d+\/report$/,
  /^event\/\d+\/performance\/match\/\d+$/,
];

// The per-match performance list is only filled with ?matchReport=1.
const ALLOWED_QUERY: [RegExp, string][] = [[/^event\/\d+\/performance\/match\/\d+$/, 'matchReport=1']];

export function isAllowedThreeKPath(path: string): boolean {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
}

/** Upstream query string for `path`; anything not explicitly allowed is dropped. */
export function allowedThreeKQuery(path: string, search: URLSearchParams): string {
  for (const [pattern, query] of ALLOWED_QUERY) {
    const [key, value] = query.split('=');
    if (pattern.test(path) && search.get(key) === value) return `?${query}`;
  }
  return '';
}
