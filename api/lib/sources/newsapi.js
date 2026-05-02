import axios from 'axios';

const API_KEY = process.env.NEWSAPI_KEY;

export async function fetchNewsAPI() {
  if (!API_KEY) {
    console.warn('NEWSAPI_KEY not set');
    return [];
  }
  try {
    // Free tier keys sometimes return 0 results for top-headlines?country=in
    // Using everything?q=india as fallback for better coverage
    const res = await axios.get('https://newsapi.org/v2/everything', {
      params: { q: 'india', apiKey: API_KEY, pageSize: 20, sortBy: 'publishedAt', language: 'en' },
      timeout: 5000,
    });
    return (res.data.articles || []).map((a) => ({
      title: a.title || '',
      description: a.description || '',
      url: a.url || '',
      publishedAt: a.publishedAt || '',
      source: a.source?.name || 'News',
    }));
  } catch (err) {
    console.error('NewsAPI fetch error:', err.message);
    return [];
  }
}
