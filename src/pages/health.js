// Health check endpoint for Dokploy
export async function GET() {
  return new Response(JSON.stringify({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'fuelltreffer'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
