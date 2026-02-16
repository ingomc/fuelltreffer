/**
 * API route to fetch match statistics from 2k software API
 * GET /api/match/:eventId/:matchId/statistics
 */
export async function GET({ params }) {
  const { eventId, matchId } = params;
  
  if (!eventId || !matchId) {
    return new Response(JSON.stringify({ error: 'Missing eventId or matchId' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const start = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const apiBaseUrl = process.env.TWOK_SOFTWARE_API_URL || 'https://backend4.2k-dart-software.com/2k-backend4/api/v1/frontend';
    const apiUrl = `${apiBaseUrl}/event/${eventId}/match/${matchId}/statistics`;
    console.info(`[proxy:match-statistics] requestId=${requestId} start eventId=${eventId} matchId=${matchId} upstream=${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    console.info(
      `[proxy:match-statistics] requestId=${requestId} upstream_status=${response.status} duration_ms=${Date.now() - start}`
    );

    if (!response.ok) {
      const upstreamBody = await response.text();
      console.error(
        `[proxy:match-statistics] requestId=${requestId} upstream_error_status=${response.status} body=${upstreamBody.slice(0, 500)}`
      );
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });
  } catch (error) {
    console.error('[proxy:match-statistics] fetch_error', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      cause: error?.cause ? String(error.cause) : undefined,
      stack: error?.stack,
    });
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch match statistics',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
