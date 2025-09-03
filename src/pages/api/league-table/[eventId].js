export async function GET({ params }) {
  const { eventId } = params;
  
  if (!eventId) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Event ID ist erforderlich'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // API Basis-URL aus Umgebungsvariablen
    const baseUrl = import.meta.env.API_BASE_URL || 'http://localhost:3001';
    
    // Proxy request to the backend
    const response = await fetch(`${baseUrl}/api/league-table/${eventId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 Minuten Cache
      }
    });

  } catch (error) {
    console.error('Error fetching league table:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Fehler beim Laden der Liga-Tabelle',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
