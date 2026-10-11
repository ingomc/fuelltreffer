/* global AbortSignal */
import { CURRENT_LEAGUE } from '@/config/league';
import { allowedThreeKQuery, isAllowedThreeKPath } from '@/lib/threek-proxy';

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function GET({ params, url }) {
  const path = params.path ?? '';
  if (!isAllowedThreeKPath(path)) {
    return json({ error: 'Path not allowed' }, 404);
  }

  const apiUrl = process.env.TWOK_SOFTWARE_API_URL || CURRENT_LEAGUE.api.twokSoftwareBaseUrl;
  const upstreamUrl = `${apiUrl}/${path}${allowedThreeKQuery(path, url.searchParams)}`;
  const start = Date.now();

  try {
    const apiResponse = await fetch(upstreamUrl, {
      headers: { 'User-Agent': 'Fuelltreffer-SSR/1.0' },
      signal: AbortSignal.timeout(15_000),
    });
    console.info(`[proxy:3k] path=${path} upstream_status=${apiResponse.status} duration_ms=${Date.now() - start}`);

    if (!apiResponse.ok) {
      return json({ error: `3K API responded with status: ${apiResponse.status}` }, 502);
    }

    return new Response(await apiResponse.text(), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('[proxy:3k] fetch_error', {
      path,
      message: error?.message,
      cause: error?.cause ? String(error.cause) : undefined,
    });
    return json({ error: 'Failed to fetch 3K data', details: error.message }, 502);
  }
}
