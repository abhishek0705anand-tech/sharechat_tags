import { buildTrendingTags } from './lib/trending-engine.js';
import { getCache, setCache } from './lib/cache.js';

const CACHE_KEY = 'trending_v1';
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '21600', 10);

// Track if a background build is already running to prevent duplicate work
let backgroundBuildRunning = false;

export async function runBackgroundBuild() {
  if (backgroundBuildRunning) return;
  backgroundBuildRunning = true;
  console.log('[Background] Starting cache warm-up...');
  try {
    const result = await buildTrendingTags();
    const response = {
      data: result.tags,
      lastUpdated: new Date().toISOString(),
      sourceStatus: result.sourceStatus,
      isMockData: result.isMockData,
    };
    setCache(CACHE_KEY, response, CACHE_TTL);
    console.log('[Background] Cache warm-up complete. Tags:', result.tags.length);
  } catch (err) {
    console.error('[Background] Cache warm-up failed:', err.message);
  } finally {
    backgroundBuildRunning = false;
  }
}

export async function handler(req, res) {
  try {
    const cached = getCache(CACHE_KEY);
    if (cached) {
      return res.json({
        data: cached.data,
        lastUpdated: cached.lastUpdated,
        sourceStatus: cached.sourceStatus,
        isMockData: cached.isMockData,
      });
    }

    // No cache — return mock data INSTANTLY so mobile users never wait.
    // Trigger real data build in background. Next request gets AI-powered cache.
    console.log('[API] No cache. Returning mock data + background build...');

    const { getMockData } = await import('./lib/trending-engine.js');
    const mockData = getMockData();
    const response = {
      data: mockData,
      lastUpdated: new Date().toISOString(),
      sourceStatus: {
        googleTrends: 'warming',
        newsAPI: 'warming',
        reddit: 'warming',
        serpapi: 'warming',
      },
      isMockData: true,
    };

    // Send response immediately — don't wait for build
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(response);

    // Start background build after response is sent
    runBackgroundBuild();
    return;
  } catch (err) {
    console.error('Trending API error:', err);
    const { getMockData } = await import('./lib/trending-engine.js');
    res.json({
      data: getMockData(),
      lastUpdated: new Date().toISOString(),
      sourceStatus: { googleTrends: 'error', newsAPI: 'error', reddit: 'error' },
      isMockData: true,
    });
  }
}
