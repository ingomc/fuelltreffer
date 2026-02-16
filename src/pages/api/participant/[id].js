export async function GET({ params }) {
  const { id } = params;
  
  if (!id) {
    return new Response(JSON.stringify({ error: 'Participant ID is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const start = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    // Get the 2k software API URL from environment or use default
    const apiUrl = process.env.TWOK_SOFTWARE_API_URL || 'https://backend4.2k-dart-software.com/2k-backend4/api/v1/frontend';
    const upstreamUrl = `${apiUrl}/participant/${id}`;
    console.info(`[proxy:participant] requestId=${requestId} start participantId=${id} upstream=${upstreamUrl}`);

    const apiResponse = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Fuelltreffer-SSR/1.0'
      }
    });

    console.info(
      `[proxy:participant] requestId=${requestId} upstream_status=${apiResponse.status} duration_ms=${Date.now() - start}`
    );
    
    if (!apiResponse.ok) {
      const upstreamBody = await apiResponse.text();
      console.error(
        `[proxy:participant] requestId=${requestId} upstream_error_status=${apiResponse.status} body=${upstreamBody.slice(0, 500)}`
      );
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
    console.error('[proxy:participant] fetch_error', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      cause: error?.cause ? String(error.cause) : undefined,
      stack: error?.stack,
    });
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch participant data',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
