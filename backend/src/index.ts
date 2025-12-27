import express from 'express';
import cors from 'cors';
import path from 'path';
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

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Start server - bind to 0.0.0.0 for Railway/Docker
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚌 DBUS Visualizer API running on http://0.0.0.0:${PORT}`);
  console.log(`   - GET /api/lines - List all bus lines`);
  console.log(`   - GET /api/lines/:lineNum/stops - Get stops for a line`);
  console.log(`   - GET /api/lines/:lineNum/buses - Get bus positions`);
});

