import { config } from 'dotenv';

// Lade .env explizit
try {
  config();
} catch (e) {
  console.log('No .env file found, using system environment variables');
}

export async function POST({ request, cookies }) {
  try {
    const { email, password } = await request.json();
    
    const validEmail = process.env.STREAMER_EMAIL;
    const validPassword = process.env.STREAMER_PASSWORD;
    
    console.log('Auth attempt:', {
      email,
      validEmail: validEmail ? 'SET' : 'MISSING',
      validPassword: validPassword ? 'SET' : 'MISSING'
    });

    if (!validEmail || !validPassword) {
      return new Response(JSON.stringify({ 
        error: 'Server configuration error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (email === validEmail && password === validPassword) {
      // Set auth cookie (expires in 24 hours)
      cookies.set('streamer_auth', 'authenticated', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      });

      return new Response(JSON.stringify({ 
        success: true 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        error: 'Invalid credentials' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ 
      error: 'Authentication failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ cookies }) {
  // Logout - remove auth cookie
  cookies.delete('streamer_auth', { path: '/' });
  
  return new Response(JSON.stringify({ 
    success: true 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}