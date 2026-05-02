const categoryKeywords = {
  sports: ['cricket', 'ipl', 'football', 'match', 'team', 'player', 'score', 'trophy', 'wc', 'world cup', 'india vs', 'vs'],
  news: ['rain', 'weather', 'accident', 'crash', 'train', 'bus', 'delhi', 'mumbai', 'bangalore', 'flood', 'earthquake', 'cyclone'],
  entertainment: ['movie', 'film', 'actor', 'actress', 'song', 'album', 'trailer', 'release', 'bollywood', 'tollywood', 'teaser', 'pushpa', 'kgf', 'rrr'],
  politics: ['pm', 'minister', 'election', 'vote', 'party', 'bjp', 'congress', 'modi', 'rahul', 'parliament', 'bill', 'govt'],
  technology: ['phone', 'iphone', 'android', 'app', 'ai', 'launch', '5g', 'tech', 'software', 'crypto', 'bitcoin'],
  lifestyle: ['fashion', 'food', 'recipe', 'health', 'fitness', 'yoga', 'travel', 'diet', 'skin', 'beauty'],
  devotional: ['temple', 'god', 'puja', 'festival', 'diwali', 'holi', 'ram', 'krishna', 'ayodhya', 'yatra', 'dham', 'badrinath', 'kedarnath', 'amarnath'],
  finance: ['stock', 'market', 'rbi', 'interest', 'loan', 'tax', 'budget', 'price', 'gold', 'rupee', 'nifty', 'sensex', 'ipo'],
};

export function categorize(title) {
  const lower = title.toLowerCase();
  const scores = {};

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    scores[cat] = keywords.filter((kw) => lower.includes(kw)).length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : 'news';
}
