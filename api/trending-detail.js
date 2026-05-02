import { getCache } from './lib/cache.js';

export function handler(req, res) {
  try {
    const id = req.params.id;
    const cached = getCache('trending_v1');
    const trend = cached?.data?.find((t) => t.id === id);

    if (!trend) {
      return res.status(404).json({ error: 'Trend not found' });
    }

    const detail = {
      ...trend,
      relatedContent: [
        {
          title: `${trend.titleEn} — Latest updates`,
          url: 'https://news.google.com/search?q=' + encodeURIComponent(trend.titleEn),
          source: 'Google News',
        },
      ],
    };

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json({ data: detail });
  } catch (err) {
    console.error('Trending detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
