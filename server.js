const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');

// Initialize app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://www.animenova.xyz']
}));
app.use(express.json());

// Hardcoded MongoDB Connection (⚠️ Only for development)
const MONGODB_URI = 'mongodb+srv://solankivinubhai971:rk3NzXFgcE0kn2l7@viewcount.duvwdit.mongodb.net/viewCounterDB?retryWrites=true&w=majority&appName=viewCount';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Schema and Model
const viewCountSchema = new mongoose.Schema({
  animeId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  count: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

const ViewCount = mongoose.model('ViewCount', viewCountSchema);

// WebSocket Server
const wss = new WebSocket.Server({ server });
const activeSubscriptions = new Map();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', async (message) => {
    try {
      const { animeId, type } = JSON.parse(message);
      
      if (type === 'subscribe' && animeId) {
        // Add to subscriptions
        if (!activeSubscriptions.has(animeId)) {
          activeSubscriptions.set(animeId, new Set());
        }
        activeSubscriptions.get(animeId).add(ws);
        
        // Send current count
        const doc = await ViewCount.findOne({ animeId }) || 
                   await ViewCount.create({ animeId });
        ws.send(JSON.stringify({
          type: 'viewCount',
          animeId,
          count: doc.count
        }));
      }
    } catch (err) {
      console.error('WS message error:', err);
    }
  });

  ws.on('close', () => {
    activeSubscriptions.forEach((sockets, animeId) => {
      sockets.delete(ws);
      if (sockets.size === 0) {
        activeSubscriptions.delete(animeId);
      }
    });
  });
});

// API Endpoints
app.post('/track-view', async (req, res) => {
  try {
    const { animeId } = req.body;
    
    if (!animeId || typeof animeId !== 'string') {
      return res.status(400).json({ error: 'Valid animeId required' });
    }

    const result = await ViewCount.findOneAndUpdate(
      { animeId },
      { $inc: { count: 1 }, $set: { lastUpdated: new Date() } },
      { new: true, upsert: true }
    );

    // Broadcast update
    if (activeSubscriptions.has(animeId)) {
      const message = JSON.stringify({
        type: 'viewCount',
        animeId,
        count: result.count
      });
      activeSubscriptions.get(animeId).forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }

    res.json({ success: true, count: result.count });
  } catch (err) {
    console.error('Tracking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/view-count/:animeId', async (req, res) => {
  try {
    const doc = await ViewCount.findOne({ animeId: req.params.animeId });
    res.json({ count: doc?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    message: 'Anime View Counter API',
    stats: {
      activeConnections: wss.clients.size,
      subscribedAnime: activeSubscriptions.size
    }
  });
});

// Start server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket running on ws://localhost:${PORT}`);
});

// Create indexes on startup
ViewCount.createIndexes()
  .then(() => console.log('Database indexes created'))
  .catch(err => console.error('Index creation error:', err));