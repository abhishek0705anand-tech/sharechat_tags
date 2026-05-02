import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fallback if no API key or API fails
export async function generateAIHashtag(title, category) {
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
              'You are a hashtag generator for ShareChat, an Indian social media app where 100% of users speak Hindi. ' +
              'Given a news headline or trending topic, you MUST output ONLY a single short hashtag in HINDI (Devanagari script). ' +
              'CRITICAL RULES - BREAKING ANY RULE IS A FAILURE: ' +
              '1. 100% of the hashtag MUST be in Devanagari script (Hindi). ' +
              '2. Only exceptions: IPL, CEO, Q2, RBI, GDP, GST, ODI, T20, vs, IN, US, UK, UN - these short abbreviations may stay in English. ' +
              '3. NEVER output pure English hashtags like #DemocraticVote or #NewUpdate. ' +
              '4. If you do not know the Hindi word, transliterate the sound into Devanagari. ' +
              '5. Max 18 chars, no spaces. ' +
              'Examples: #भारतVsAus, #IPLFinal, #मुंबईबारिश, #दीवाली2026, #बंगालचुनाव, #मजदूरदिवस, #रBIरेपो, #चुनाव2026, #क्रिकेटमैच, #लोकतंत्रविजय, #प्राकृतिकसुंदरता. ' +
              'Respond with ONLY the hashtag, nothing else.',
          },
          {
            role: 'user',
            content: `Title: "${title}"\nCategory: ${category}\nHashtag:`,
          },
        ],
        temperature: 0.3,
        max_tokens: 20,
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
    // Clean up response: remove #, spaces, then normalize homoglyphs
    let clean = text
      .replace(/#/g, '')
      .replace(/\s/g, '');
    // Convert Cyrillic/Latin lookalikes to ASCII
    const homoglyphs = {'а':'a','е':'e','о':'o','р':'p','с':'c','х':'x','і':'i','ј':'j','ԛ':'q','ѕ':'s','ԝ':'w','ƶ':'z','А':'A','Е':'E','О':'O','Р':'P','С':'C','Х':'X','І':'I','Ї':'I','Ј':'J','Ԛ':'Q','Ѕ':'S','Ԝ':'W','ꓭ':'B'};
    clean = clean.split('').map((ch) => homoglyphs[ch] || ch).join('');
    // Strip anything that's not Devanagari, uppercase Latin abbreviations, or digits
    clean = clean.replace(/[^\u0900-\u097FA-Z0-9]/g, '');
    // Must contain at least some Devanagari
    if (!/[\u0900-\u097F]/.test(clean)) return null;
    clean = clean.slice(0, 15);
    return clean ? '#' + clean : null;
  } catch (err) {
    console.error('Groq hashtag error:', err.message);
    return null;
  }
}
