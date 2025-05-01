const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://www.animenova.xyz']
}));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://solankivinubhai971:rk3NzXFgcE0kn2l7@viewcount.duvwdit.mongodb.net/viewCounterDB?retryWrites=true&w=majority&appName=viewCount';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000 // handle slow wake-ups
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Schema + Model
const viewCountSchema = new mongoose.Schema({
  animeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  count: {
    type: Number,
    default: 1,
    min: 1
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const ViewCount = mongoose.model('ViewCount', viewCountSchema);

<<<<<<< HEAD
// API: Track View
app.post('/track-view', async (req, res) => {
  const { animeId } = req.body;
=======
app.post('/track-view', async (req, res) => {
  try {
    const { animeId } = req.body;

    // Validate input
    if (!animeId || typeof animeId !== 'string' || animeId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid animeId' });
    }
>>>>>>> 2ed82396d810a00c09a2c12f8d940d1f74d70cc2

  if (!animeId || typeof animeId !== 'string' || animeId.trim().length === 0) {
    return res.status(400).json({ error: 'animeId is required and must be a non-empty string' });
  }

  try {
    const result = await ViewCount.findOneAndUpdate(
      { animeId },
      {
        $inc: { count: 1 },
        $set: { lastUpdated: new Date() }
      },
      { new: true, upsert: true }
    );

<<<<<<< HEAD
    res.status(200).json({ success: true, count: result.count });
  } catch (err) {
    console.error('Error tracking view:', err); // log full error
=======
    // Broadcast WebSocket update if subscribed
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
    console.error('Tracking error:', err); // See the real error here in your Render logs
>>>>>>> 2ed82396d810a00c09a2c12f8d940d1f74d70cc2
    res.status(500).json({ error: 'Internal server error' });
  }
});

<<<<<<< HEAD

=======
>>>>>>> 2ed82396d810a00c09a2c12f8d940d1f74d70cc2
// API: Get View Count
app.get('/view-count/:animeId', async (req, res) => {
  try {
    const doc = await ViewCount.findOne({ animeId: req.params.animeId });

    if (!doc) {
      return res.status(404).json({ count: 0 }); // Not found yet
    }

    res.json({ count: doc.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Anime View Counter API'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
