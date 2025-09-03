export async function GET({ params }) {
  const { eventId, phaseId, roundIndex } = params;
  
  if (!eventId || !phaseId || roundIndex === undefined) {
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
    const apiResponse = await fetch(`${apiUrl}/event/${eventId}/phase/${phaseId}/round/${roundIndex}`, {
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
      },
    });
  } catch (error) {
    console.error('Error fetching round details:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch round details',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}