/**
 * Read-only passthrough to the 3K frontend API for sibling apps (e.g. the
 * Dart Story Maker) whose servers cannot reach 3K directly. Only the
 * endpoints those apps need are allowed, so this is not an open proxy.
 */
const ALLOWED_PATHS = [
  /^participant\/\d+$/,
  /^event\/\d+$/,
  /^event\/\d+\/participant$/,
];

export function isAllowedThreeKPath(path: string): boolean {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
}
