import axios from 'axios';

export async function fetchRedditIndia() {
  try {
    const [indiaRes, speaksRes] = await Promise.all([
      axios.get('https://www.reddit.com/r/india/hot.json?limit=15', { timeout: 5000 }),
      axios.get('https://www.reddit.com/r/indiaspeaks/hot.json?limit=10', { timeout: 5000 }),
    ]);

    const parse = (res) =>
      (res.data?.data?.children || []).map((c) => ({
        title: c.data?.title || '',
        ups: c.data?.ups || 0,
        numComments: c.data?.num_comments || 0,
        subreddit: c.data?.subreddit || '',
        url: c.data?.url || '',
      }));

    return [...parse(indiaRes), ...parse(speaksRes)];
  } catch (err) {
    console.error('Reddit fetch error:', err.message);
    return [];
  }
}
