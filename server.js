const express = require('express');
const WebSocket = require('ws');
const http = require('http');

// Create HTTP server and Express app
const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store view counts in memory (for simplicity)
const viewCounts = {};

// WebSocket connection handler
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const { animeId, type } = JSON.parse(message);
    if (type === 'subscribe') {
      // Send current count when client subscribes
      ws.send(JSON.stringify({
        type: 'viewCount',
        animeId,
        count: viewCounts[animeId] || 0
      }));
    }
  });
});

// API endpoint to track views
app.post('/track-view', express.json(), (req, res) => {
  const { animeId } = req.body;
  
  // Increment view count
  viewCounts[animeId] = (viewCounts[animeId] || 0) + 1;
  
  // Broadcast to all connected clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'viewCount',
        animeId,
        count: viewCounts[animeId]
      }));
    }
  });
  
  res.json({ success: true, count: viewCounts[animeId] });
});

// Start server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});