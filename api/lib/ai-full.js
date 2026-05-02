import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateHindiContent(titleEn, category, retries = 2) {
  if (!GROQ_API_KEY) return null;

  try {
    const res = await axios.post(
      GROQ_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a Hindi content writer for ShareChat, India\'s largest Hindi social media app. ' +
              'Given an English news headline, write NATURAL, MEANINGFUL Hindi content — NOT phonetic transliteration of English words. ' +
              'Respond in JSON with keys: titleHi, hashtag, descriptionHi.\n\n' +
              'RULES:\n' +
              '1. titleHi: A short catchy Hindi headline (max 45 chars). Must be REAL Hindi that makes sense, not English words in Devanagari.\n' +
              '2. hashtag: One short hashtag in Devanagari (max 15 chars), no spaces.\n' +
              '3. descriptionHi: One line in natural spoken Hindi (max 70 chars).\n' +
              '4. NEVER output gibberish like "सउबवएरसइओन ओफ डएमओकरअटइक" — that is NOT Hindi.\n' +
              '5. Use proper Hindi vocabulary. If you don\'t know the exact Hindi word, use a common Indian term.\n' +
              '6. Examples of GOOD titles: "पश्चिम बंगाल चुनाव: फिर से मतदान", "ईरान पर अमेरिकी चेतावनी", "अकासा एयर CEO रेस में नए दावेदार", "दोस्तों के लिए 3 बेस्ट ETF"\n' +
              '7. Examples of BAD titles: "सउबवएरसइओन ओफ डएमओकरअटइक परओकएसस" (this is garbage)\n' +
              'Respond ONLY with valid JSON.',
          },
          {
            role: 'user',
            content: `Category: ${category}\nEnglish headline: "${titleEn}"\n\nReturn JSON:`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 120,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const text = res.data?.choices?.[0]?.message?.content?.trim() || '';
    const parsed = JSON.parse(text);
    const homoglyphs = {'а':'a','е':'e','о':'o','р':'p','с':'c','х':'x','і':'i','ј':'j','ԛ':'q','ѕ':'s','ԝ':'w','ƶ':'z','А':'A','Е':'E','О':'O','Р':'P','С':'C','Х':'X','І':'I','Ї':'I','Ј':'J','Ԛ':'Q','Ѕ':'S','Ԝ':'W','ꓭ':'B'};
    const clean = (s) => (s || '').split('').map((ch) => homoglyphs[ch] || ch).join('').replace(/[\n\r]/g, ' ').trim();

    const titleHi = clean(parsed.titleHi).slice(0, 50);
    const hashtag = clean(parsed.hashtag).replace(/#/g, '').replace(/\s/g, '').slice(0, 15);
    const descriptionHi = clean(parsed.descriptionHi).slice(0, 75);

    // Validate: must contain Devanagari
    if (!/[\u0900-\u097F]/.test(titleHi) || !/[\u0900-\u097F]/.test(descriptionHi)) {
      return null;
    }
    return { titleHi, hashtag: hashtag ? '#' + hashtag : null, descriptionHi };
  } catch (err) {
    if (err.response?.status === 429 && retries > 0) {
      const delay = (3 - retries) * 2000 + 1000;
      console.log(`Groq 429, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, delay));
      return generateHindiContent(titleEn, category, retries - 1);
    }
    console.error('Groq full content error:', err.message);
    return null;
  }
}
