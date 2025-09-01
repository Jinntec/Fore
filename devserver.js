import WebSocket from 'ws';

import express from 'express';
import { createServer as createViteServer } from 'vite';

import { readFile } from 'node:fs/promises';
import path from 'path';

async function createServer() {
  const app = express();

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    // don't include Vite's default HTML handling middlewares
    appType: 'custom',
  });
  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  app.use('*all', async (req, res, next) => {
    const url = req.originalUrl === '/' ? 'index.html' : req.originalUrl;

    try {
      // 1. Read the resource
      let template = await readFile(path.join(import.meta.dirname, url), 'utf-8');

      // Some files contain HTML that strictly contains parse errors because of inline JavaScript code. Do not add HMR to that
      if (!url.includes('css-functions')) {
        // 2. Apply Vite HTML transforms. This injects the Vite HMR client,
        //    and also applies HTML transforms from Vite plugins, e.g. global
        //    preambles from @vitejs/plugin-react
        template = await vite.transformIndexHtml(url, template);
      }
      // 6. Send the rendered HTML back.
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      // If an error is caught, let Vite fix the stack trace so it maps back
      // to your actual source code.
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(8090);
}

await createServer();

console.log('Fore Devserver listening on http://localhost:8090/');

// Create a WebSocket server
const server = new WebSocket.Server({ port: 8088 });

// Maintain a list of connected sockets
const sockets = new Set();

// Handle WebSocket connection
server.on('connection', socket => {
  console.log('WebSocket connection opened');

  // Add the socket to the list of connected sockets
  sockets.add(socket);

  // Send initial message to the client
  // socket.send('Hello from WebSocket server!');

  // Listen for WebSocket messages
  socket.on('message', message => {
    console.log('WebSocket message received:', message);

    // Echo the message back to the client
    // socket.send(`You said: ${message}`);

    // Push the message to all connected sockets except the sender
    sockets.forEach(clientSocket => {
      if (clientSocket !== socket) {
        clientSocket.send(`${message}`);
      }
    });
  });

  // Listen for WebSocket close event
  socket.on('close', () => {
    console.log('WebSocket connection closed');

    // Remove the socket from the list of connected sockets
    sockets.delete(socket);
  });

  // Listen for WebSocket error event
  socket.on('error', error => {
    console.error('WebSocket error occurred:', error);
  });
});
