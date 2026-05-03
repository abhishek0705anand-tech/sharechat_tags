import axios from 'axios';

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_URL = 'https://api.moonshot.cn/v1/chat/completions';

/**
 * Generate Hindi content for ALL trends using Kimi AI in a single batched call.
 * @param {Array<{index:number, titleEn:string, category:string}>} items
 * @returns {Array<{index:number, titleHi:string, hashtag:string, descriptionHi:string}|null>}
 */
export async function generateHindiContentKimi(items) {
  if (!KIMI_API_KEY || items.length === 0) {
    return items.map(() => null);
  }

  const itemsText = items
    .map((it, i) => `${i + 1}. [${it.category}] "${it.titleEn}"`)
    .join('\n');

  try {
    const res = await axios.post(
      KIMI_URL,
      {
        model: 'kimi-latest',
        messages: [
          {
            role: 'system',
            content:
              'You are a Hindi content writer for ShareChat, India\'s largest Hindi social media app. ' +
              'Given a list of English news headlines, write NATURAL, MEANINGFUL Hindi content for EACH headline. ' +
              'Respond in JSON with an array "results" where each item has: index, titleHi, hashtag, descriptionHi.\n\n' +
              'CRITICAL RULES:\n' +
              '1. titleHi: Short catchy Hindi headline (max 45 chars). Must be REAL Hindi — NOT phonetic transliteration of English words.\n' +
              '2. hashtag: One short Devanagari hashtag (max 15 chars), no spaces.\n' +
              '3. descriptionHi: One line in natural spoken Hindi (max 70 chars).\n' +
              '4. NEVER output gibberish like "सउबवएरसइओन ओफ डएमओकरअटइक" — that is NOT Hindi.\n' +
              '5. Use proper Hindi vocabulary. If unsure, use common Indian terms.\n' +
              '6. Examples of GOOD titles: "पश्चिम बंगाल चुनाव: फिर से मतदान", "ईरान पर अमेरिकी चेतावनी", "दोस्तों के लिए 3 बेस्ट ETF"\n' +
              'Respond ONLY with valid JSON: {"results":[{"index":0,"titleHi":"...","hashtag":"#...","descriptionHi":"..."},...]}',
          },
          {
            role: 'user',
            content: `Generate Hindi content for these ${items.length} trending headlines:\n\n${itemsText}\n\nReturn JSON:`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${KIMI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const text = res.data?.choices?.[0]?.message?.content?.trim() || '';
    const parsed = JSON.parse(text);
    const results = parsed.results || [];

    const homoglyphs = {
      а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', і: 'i', ј: 'j', ԛ: 'q', ѕ: 's', ԝ: 'w', ƶ: 'z',
      А: 'A', Е: 'E', О: 'O', Р: 'P', С: 'C', Х: 'X', І: 'I', Ї: 'I', Ј: 'J', Ԛ: 'Q', Ѕ: 'S', Ԝ: 'W', ꓭ: 'B',
    };
    const clean = (s) =>
      (s || '')
        .split('')
        .map((ch) => homoglyphs[ch] || ch)
        .join('')
        .replace(/[\n\r]/g, ' ')
        .trim();

    return items.map((item) => {
      const r = results.find((x) => x.index === item.index) || results[item.index];
      if (!r) return null;

      const titleHi = clean(r.titleHi).slice(0, 50);
      const hashtag = clean(r.hashtag).replace(/#/g, '').replace(/\s/g, '').slice(0, 15);
      const descriptionHi = clean(r.descriptionHi).slice(0, 75);

      if (!/[\u0900-\u097F]/.test(titleHi) || !/[\u0900-\u097F]/.test(descriptionHi)) {
        return null;
      }
      return {
        index: item.index,
        titleHi,
        hashtag: hashtag ? '#' + hashtag : null,
        descriptionHi,
      };
    });
  } catch (err) {
    console.error('Kimi batch error:', err.response?.data?.error?.message || err.message);
    return items.map(() => null);
  }
}
