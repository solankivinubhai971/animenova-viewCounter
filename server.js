require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:5173', // Development
    'https://your-anime-site.com' // Production
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Apply middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight requests
app.use(express.json());

// WebSocket Server
const wss = new WebSocket.Server({ server });
const viewCounts = {};

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const { animeId, type } = JSON.parse(message);
      
      if (type === 'subscribe' && animeId) {
        // Send current count immediately
        ws.send(JSON.stringify({
          type: 'viewCount',
          animeId,
          count: viewCounts[animeId] || 0
        }));
      }
    } catch (error) {
      console.error('Invalid WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected');
  });
});

// API Endpoints
app.post('/track-view', (req, res) => {
  try {
    const { animeId } = req.body;
    
    if (!animeId || typeof animeId !== 'string') {
      return res.status(400).json({ error: 'Valid animeId required' });
    }

    // Update view count
    viewCounts[animeId] = (viewCounts[animeId] || 0) + 1;
    
    // Broadcast to all subscribers
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
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/view-count/:animeId', (req, res) => {
  const { animeId } = req.params;
  res.json({ count: viewCounts[animeId] || 0 });
});

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    endpoints: {
      trackView: 'POST /track-view',
      getCount: 'GET /view-count/:animeId',
      websocket: 'ws://your-api-url.com'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
