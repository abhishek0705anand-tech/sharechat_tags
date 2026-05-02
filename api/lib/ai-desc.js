import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateHindiDescription(titleEn, titleHi, category) {
  if (!GROQ_API_KEY) {
    return null;
  }

  try {
    const res = await axios.post(
      GROQ_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a Hindi content writer for ShareChat, an Indian social media app. ' +
              'Given an English news headline, write a ONE-LINE description in Hindi (Devanagari script). ' +
              'Rules: max 80 characters, natural spoken Hindi, catchy, no English words unless necessary (IPL, CEO, RBI etc.). ' +
              'Respond with ONLY the Hindi description, nothing else.',
          },
          {
            role: 'user',
            content: `English headline: "${titleEn}"\nHindi title: "${titleHi}"\nCategory: ${category}\nHindi description (one line, max 80 chars):`,
          },
        ],
        temperature: 0.4,
        max_tokens: 60,
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
    // Clean up
    const homoglyphs = {'а':'a','е':'e','о':'o','р':'p','с':'c','х':'x','і':'i','ј':'j','ԛ':'q','ѕ':'s','ԝ':'w','ƶ':'z','А':'A','Е':'E','О':'O','Р':'P','С':'C','Х':'X','І':'I','Ї':'I','Ј':'J','Ԛ':'Q','Ѕ':'S','Ԝ':'W','ꓭ':'B'};
    let clean = text
      .replace(/^["']|["']$/g, '')
      .replace(/\n/g, ' ');
    clean = clean.split('').map((ch) => homoglyphs[ch] || ch).join('');
    // Must contain at least some Devanagari, otherwise fallback will be used
    if (!/[\u0900-\u097F]/.test(clean)) return null;
    clean = clean.trim().slice(0, 85);
    return clean || null;
  } catch (err) {
    console.error('Groq description error:', err.message);
    return null;
  }
}
