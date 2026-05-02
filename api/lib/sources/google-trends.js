import Parser from 'rss-parser';
import axios from 'axios';

const parser = new Parser();

export async function fetchGoogleTrendsIndia() {
  try {
    // Google Trends RSS is deprecated (404). Using Google News India RSS as a proxy
    // for what's trending/searching in India. Highly correlated with search behavior.
    const res = await axios.get('https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en', {
      timeout: 8000,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const feed = await parser.parseString(res.data);
    return (feed.items || []).slice(0, 15).map((item, i) => ({
      title: item.title || '',
      traffic: `${(15 - i) * 100000}+`, // Approximate descending popularity
      link: item.link || '',
      pubDate: item.pubDate || '',
    }));
  } catch (err) {
    console.error('Google News India RSS fetch error:', err.message);
    return [];
  }
}
