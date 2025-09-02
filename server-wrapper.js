// Wrapper to force Astro to bind to 0.0.0.0
import http from 'http';
import { createRequire } from 'module';

// Set environment variables
process.env.HOST = '0.0.0.0';
process.env.PORT = '4000';

// Monkey patch the http.createServer to force binding to 0.0.0.0
const originalCreateServer = http.createServer;
http.createServer = function(...args) {
  const server = originalCreateServer.apply(this, args);
  const originalListen = server.listen;
  
  server.listen = function(port, host, ...otherArgs) {
    // Force host to be 0.0.0.0
    const actualHost = '0.0.0.0';
    const actualPort = port || 4000;
    
    console.log(`[@astrojs/node] Server listening on http://${actualHost}:${actualPort}`);
    return originalListen.call(this, actualPort, actualHost, ...otherArgs);
  };
  
  return server;
};

// Now dynamically import the Astro server
import('./dist/server/entry.mjs').catch(console.error);
