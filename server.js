const express = require('express');
const WebSocket = require('ws');
const http = require('http');

// 1. Create server
const app = express();
const server = http.createServer(app);

// 2. Add middleware FIRST
app.use(express.json());

// 3. Create WebSocket server
const wss = new WebSocket.Server({ server });
const viewCounts = {};

// 4. WebSocket connection
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
      console.log('Invalid message format');
    }
  });
});

// 5. Track view endpoint
app.post('/track-view', (req, res) => {
  try {
    // Validate input
    if (!req.body || typeof req.body.animeId !== 'string') {
      return res.status(400).send('Missing animeId');
    }

    const { animeId } = req.body;
    
    // Update count
    viewCounts[animeId] = (viewCounts[animeId] || 0) + 1;
    
    // Broadcast to all clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'viewCount',
          animeId,
          count: viewCounts[animeId]
        }));
      }
    });
    
    res.json({ count: viewCounts[animeId] });
  } catch (error) {
    console.log('Server error:', error);
    res.status(500).send('Server error');
  }
});

// 6. Root endpoint
app.get('/', (req, res) => {
  res.send('View Counter API is running');
});

// 7. Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
