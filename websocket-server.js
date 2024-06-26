const WebSocket = require('ws');

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
