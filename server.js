const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== Middleware =====
// Step 1: Handle preflight OPTIONS requests first
app.options('*', cors());

// Step 2: Proper CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'https://www.animenova.xyz'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Step 3: JSON parser
app.use(express.json());

// ===== MongoDB Connection =====
const MONGODB_URI = 'mongodb+srv://solankivinubhai971:rk3NzXFgcE0kn2l7@viewcount.duvwdit.mongodb.net/viewCounterDB?retryWrites=true&w=majority&appName=viewCount';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ===== Schema + Model =====
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

// ===== Routes =====

// Track View
app.post('/track-view', async (req, res) => {
  const { animeId } = req.body;
  console.log('📥 Incoming request with animeId:', animeId);

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
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log('✅ View updated for:', animeId, 'New count:', result.count);
    res.status(200).json({ success: true, count: result.count });
  } catch (err) {
    console.error('❌ Error tracking view:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get View Count
app.get('/view-count/:animeId', async (req, res) => {
  try {
    const doc = await ViewCount.findOne({ animeId: req.params.animeId });

    if (!doc) {
      return res.status(404).json({ count: 0 });
    }

    res.status(200).json({ count: doc.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'running',
    message: 'Anime View Counter API'
  });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
