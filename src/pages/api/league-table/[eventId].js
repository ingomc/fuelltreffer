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
    const start = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    // API Basis-URL aus Umgebungsvariablen
    const baseUrl = import.meta.env.API_BASE_URL || 'http://localhost:3001';
    const upstreamUrl = `${baseUrl}/api/league-table/${eventId}`;
    console.info(`[proxy:league-table] requestId=${requestId} start eventId=${eventId} upstream=${upstreamUrl}`);
    
    // Proxy request to the backend
    const response = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.info(
      `[proxy:league-table] requestId=${requestId} upstream_status=${response.status} duration_ms=${Date.now() - start}`
    );

    if (!response.ok) {
      const upstreamBody = await response.text();
      console.error(
        `[proxy:league-table] requestId=${requestId} upstream_error_status=${response.status} body=${upstreamBody.slice(0, 500)}`
      );
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
    console.error('[proxy:league-table] fetch_error', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      cause: error?.cause ? String(error.cause) : undefined,
      stack: error?.stack,
    });
    
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
