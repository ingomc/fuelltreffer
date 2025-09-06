import { AccessToken } from 'livekit-server-sdk';
import { config } from 'dotenv';

// Versuche .env zu laden (für Development und Docker)
try {
  config();
} catch (_e) {
  console.log('No .env file found, using system environment variables');
}

export async function GET({ url }) {
  const searchParams = new URLSearchParams(url.search);
  const participantName = searchParams.get('name');
  const roomName = searchParams.get('room') || process.env.LIVEKIT_ROOM || 'fuelldart';
  const isStreamer = searchParams.get('streamer') === 'true';

  if (!participantName) {
    return new Response(JSON.stringify({ error: 'Participant name is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    // Environment variables laden mit besserer Fehlerbehandlung
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;
    const participantPrefix = process.env.LIVEKIT_PARTICIPANT_PREFIX || 'ft-';

    // Debug-Information für Docker/Production
    console.log('Environment Debug:', {
      NODE_ENV: process.env.NODE_ENV,
      PWD: process.env.PWD,
      availableEnvs: Object.keys(process.env).filter(key => key.startsWith('LIVEKIT_')),
      apiKey: apiKey ? `${apiKey.substring(0, 6)}...` : 'MISSING',
      apiSecret: apiSecret ? `${apiSecret.substring(0, 6)}...` : 'MISSING',
      wsUrl: wsUrl || 'MISSING',
      roomName,
      participantName,
      isStreamer
    });

    if (!apiKey || !apiSecret || !wsUrl) {
      const missing = [];
      if (!apiKey) missing.push('LIVEKIT_API_KEY');
      if (!apiSecret) missing.push('LIVEKIT_API_SECRET');
      if (!wsUrl) missing.push('LIVEKIT_URL');
      
      console.error('Missing LiveKit credentials:', missing);
      console.error('All env vars:', Object.keys(process.env).sort());
      
      throw new Error(`Missing LiveKit credentials: ${missing.join(', ')}`);
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: `${participantPrefix}${participantName}`,
    });

    // Set room permissions based on role
    if (isStreamer) {
      at.addGrant({ 
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
      });
    } else {
      at.addGrant({ 
        room: roomName,
        roomJoin: true,
        canPublish: false,
        canPublishData: false,
        canSubscribe: true,
      });
    }

    const token = await at.toJwt();

    return new Response(JSON.stringify({ 
      token,
      wsUrl,
      room: roomName
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate token',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}