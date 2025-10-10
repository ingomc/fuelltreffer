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
    const apiUrl = `https://backend4.2k-dart-software.com/2k-backend4/api/v1/frontend/event/${eventId}/match/${matchId}/statistics`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
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
    console.error('Error fetching match statistics:', error);
    
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
