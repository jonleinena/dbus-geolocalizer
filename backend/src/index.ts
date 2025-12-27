import express from 'express';
import cors from 'cors';
import linesRouter from './routes/lines.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/lines', linesRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚌 DBUS Visualizer API running on http://localhost:${PORT}`);
  console.log(`   - GET /api/lines - List all bus lines`);
  console.log(`   - GET /api/lines/:lineNum/stops - Get stops for a line`);
  console.log(`   - GET /api/lines/:lineNum/buses - Get bus positions`);
});

