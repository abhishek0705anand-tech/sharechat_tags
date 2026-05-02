export function normalize(value, source) {
  switch (source) {
    case 'google-trends':
      return Math.min(value / 1000000, 100);
    case 'newsapi':
      return Math.min(value * 5, 100);
    case 'reddit':
      return Math.min(value / 100, 100);
    case 'serpapi-realtime':
      return Math.min(value * 20, 100);
    default:
      return Math.min(value, 100);
  }
}

export function calculateHeatScore(signals) {
  const weights = {
    'google-trends': 0.35,
    newsapi: 0.25,
    reddit: 0.20,
    'serpapi-realtime': 0.20,
  };

  let score = 0;
  for (const signal of signals) {
    const normalized = normalize(signal.rawValue, signal.source);
    score += normalized * (weights[signal.source] || 0.1);
  }

  const titles = signals.map((s) => s.title.toLowerCase());
  const isBreaking = titles.some((t) =>
    ['breaking', 'live', 'alert', 'urgent', 'update'].some((w) => t.includes(w))
  );
  const isIndian = titles.some((t) =>
    ['india', 'bharat', 'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad'].some((w) => t.includes(w))
  );

  if (isBreaking) score *= 1.3;
  if (isIndian) score *= 1.2;

  const isTooBroad = titles.some((t) =>
    ['weather', 'news today', 'headlines', 'google'].some((w) => t.includes(w))
  );
  if (isTooBroad) score *= 0.6;

  return Math.min(Math.round(score), 100);
}

export function fuzzyMatch(a, b) {
  const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const wa = clean(a).split(/\s+/).filter((w) => w.length > 2);
  const wb = clean(b).split(/\s+/).filter((w) => w.length > 2);
  const common = wa.filter((w) => wb.includes(w));
  return common.length >= 2 || (wa.length === 1 && wb.length === 1 && wa[0] === wb[0]);
}
