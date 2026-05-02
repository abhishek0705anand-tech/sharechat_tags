import axios from 'axios';

const API_KEY = process.env.SERPAPI_KEY;

export async function fetchSerpapiRealtime() {
  if (!API_KEY) {
    console.warn('SERPAPI_KEY not set');
    return [];
  }
  try {
    const res = await axios.get('https://serpapi.com/search', {
      params: { engine: 'google_trends_trending_now', geo: 'IN', api_key: API_KEY },
      timeout: 5000,
    });
    return (res.data.trending_searches || []).map((t) => ({
      query: t.query || '',
      timestamp: t.timestamp || '',
    }));
  } catch (err) {
    console.error('SerpAPI fetch error:', err.message);
    return [];
  }
}
