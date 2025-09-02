// Debug endpoint to see what requests arrive
export async function GET({ request }) {
  const headers = {};
  for (const [key, value] of request.headers.entries()) {
    headers[key] = value;
  }
  
  return new Response(JSON.stringify({
    status: 'debug',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: headers,
    service: 'fuelltreffer'
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
