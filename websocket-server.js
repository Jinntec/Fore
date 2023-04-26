const WebSocket = require('ws');

// Create a WebSocket server
const server = new WebSocket.Server({ port: 8088 });

// Handle WebSocket connection
server.on('connection', (socket) => {
    console.log('WebSocket connection opened');

    // Send initial message to the client
    socket.send('Hello from WebSocket server!');

    // Listen for WebSocket messages
    socket.on('message', (message) => {
        console.log('WebSocket message received:', message);
        // Echo the message back to the client
        socket.send(`You said: ${message}`);
    });

    // Listen for WebSocket close event
    socket.on('close', () => {
        console.log('WebSocket connection closed');
    });

    // Listen for WebSocket error event
    socket.on('error', (error) => {
        console.error('WebSocket error occurred:', error);
    });
});
