const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Middleware to parse JSON bodies
app.use(express.json()); // <-- This must come before your routes

const wss = new WebSocket.Server({ server });
const viewCounts = {};

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const { animeId, type } = JSON.parse(message);
      if (type === 'subscribe') {
        ws.send(JSON.stringify({
          type: 'viewCount',
          animeId,
          count: viewCounts[animeId] || 0
        }));
      }
    } catch (e) {
      console.error('Invalid WebSocket message:', e);
    }
  });
});

// Track view endpoint with proper error handling
app.post('/track-view', (req, res) => {
  try {
    // Validate request body
    if (!req.body || !req.body.animeId) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing animeId in request body" 
      });
    }

    const { animeId } = req.body;
    
    // Initialize if doesn't exist
    if (!viewCounts[animeId]) {
      viewCounts[animeId] = 0;
    }
    
    // Increment count
    viewCounts[animeId] += 1;
    
    // Broadcast update
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
    
  } catch (error) {
    console.error('Error in track-view:', error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
