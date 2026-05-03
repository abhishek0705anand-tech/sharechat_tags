import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { handler as trendingHandler } from './trending.js';
import { handler as detailHandler } from './trending-detail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Health + cache warm trigger
app.get('/api/health', (_req, res) => {
  // Trigger background cache warm if empty — UptimeRobot pings this every 5 min
  import('./trending.js').then((m) => {
    if (m.runBackgroundBuild) m.runBackgroundBuild();
  }).catch(() => {});
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Trending endpoints
app.get('/api/trending', trendingHandler);
app.get('/api/trending/:id', detailHandler);

// Serve static in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
