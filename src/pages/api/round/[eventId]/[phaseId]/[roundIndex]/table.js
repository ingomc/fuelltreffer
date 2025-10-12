export async function GET({ params }) {
  const { eventId, phaseId, roundIndex } = params;
  
  if (!eventId || phaseId === undefined || roundIndex === undefined) {
    return new Response(JSON.stringify({ error: 'Event ID, Phase ID and Round Index are required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    // Get the 2k software API URL from environment or use default
    const apiUrl = process.env.TWOK_SOFTWARE_API_URL || 'https://backend4.2k-dart-software.com/2k-backend4/api/v1/frontend';
    const apiResponse = await fetch(`${apiUrl}/event/${eventId}/phase/${phaseId}/round/${roundIndex}/table`, {
      headers: {
        'User-Agent': 'Fuelltreffer-SSR/1.0'
      }
    });
    
    if (!apiResponse.ok) {
      throw new Error(`2k software API responded with status: ${apiResponse.status}`);
    }
    
    const data = await apiResponse.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error fetching table:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch table',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
