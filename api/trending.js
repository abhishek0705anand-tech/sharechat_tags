import { buildTrendingTags } from './lib/trending-engine.js';
import { getCache, setCache } from './lib/cache.js';

const CACHE_KEY = 'trending_v1';
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '21600', 10);

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

    // Server-side timeout: if building takes >12s, return mock data
    // This prevents mobile users from waiting when Railway is waking up or sources are slow
    const BUILD_TIMEOUT_MS = 12000;
    const result = await Promise.race([
      buildTrendingTags(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('BUILD_TIMEOUT')), BUILD_TIMEOUT_MS)
      ),
    ]);
    const response = {
      data: result.tags,
      lastUpdated: new Date().toISOString(),
      sourceStatus: result.sourceStatus,
      isMockData: result.isMockData,
    };

    setCache(CACHE_KEY, response, CACHE_TTL);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(response);
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
