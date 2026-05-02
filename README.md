# ShareChat Trending Tags System

A production-grade Trending Tags system built for ShareChat. Automatically identifies, ranks, and serves trending topics relevant to Indian/Hindi-speaking audiences with a mobile-native UI. All visible content (titles, descriptions, hashtags) is rendered in **native Hindi (Devanagari script)**.

## How the System Works

### Signal Sources & Weights

| Source | Weight | Why |
|--------|--------|-----|
| Google News India (RSS) | 35% | Broadest signal of Indian news trends |
| NewsAPI (India headlines) | 25% | Validates mainstream importance |
| Reddit r/india + r/indiaspeaks | 20% | Early signal, grassroots trends |
| SerpAPI Realtime | 20% | Freshness, <1 hour old signals |

> **Note**: Google Trends RSS was deprecated (404) and replaced with Google News India RSS.

### Scoring Logic

1. Normalize each source's raw signal to 0-100
2. Apply weighted sum based on source reliability
3. Boost: breaking news (+30%), Indian events (+20%), freshness (+15%)
4. Penalty: repeat topics (-30%), too-broad keywords (-40%)
5. Cap at 100

### Pipeline

```
Raw Sources → Fetch (parallel) → Cluster/Dedupe → Score → Rank → 
Hindi Translation (keyword map) → Cache (6 hours) → API Response
```

### Hindi Content Generation

The system uses a **200+ word Hindi keyword mapping** to generate native Hindi content. Titles and descriptions are composed of real Hindi vocabulary (e.g., "पश्चिम बंगाल चुनाव", "सुप्रीम अदालत") rather than phonetic transliteration of English words.

- **Titles**: Extract known Hindi keywords from English headlines, ordered by appearance
- **Descriptions**: Category-based proper Hindi sentences (e.g., "यह समाचार भारत में तेज़ी से ट्रेंड कर रहा है")
- **Hashtags**: Keyword-based Devanagari hashtags (e.g., `#बंगालचुनाव`, `#सुप्रीमअदालत`)
- **Groq AI**: Previously used for AI-generated Hindi, disabled due to free-tier rate limits

### Categorization

Keyword-based categorization into: `sports`, `news`, `entertainment`, `politics`, `technology`, `lifestyle`, `devotional`, `finance`

## UX Rationale

### What I Optimized For

1. **Speed**: Skeleton loaders + 6-hour cache = feels instant
2. **Cultural Fit**: Hindi-primary content, saffron accents, Indian categorization
3. **Scanability**: Cards not lists, visual heat scores, category colors
4. **Depth**: Bottom sheet keeps context of feed, not jarring navigation
5. **100% Devanagari**: No visible English text in titles/descriptions

### What I Considered and Rejected

- **Horizontal carousel for trends**: Poor discoverability, hidden content
- **Tabbed categories**: Adds friction, users want mixed serendipity
- **Desktop-first layout**: Explicitly mobile-native design
- **Phonetic transliteration**: Produces gibberish like "सउबवएरसइओन" — rejected in favor of real Hindi keywords

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Backend | Node.js + Express |
| Caching | File-based JSON cache |
| Deployment | Railway (connected to GitHub) |

## Running Locally

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your API keys in .env

# Start backend
npm start

# In another terminal, start frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

## API Endpoints

- `GET /api/health` — Health check
- `GET /api/trending?t=timestamp` — List trending tags (cache-busted, 6-hour cache)
- `GET /api/trending/:id` — Detail view for a single tag

## Environment Variables

```
NEWSAPI_KEY=your_newsapi_key
SERPAPI_KEY=your_serpapi_key
GROQ_API_KEY=your_groq_key
CACHE_TTL_SECONDS=21600
PORT=3001
```

## Deployment (Railway)

1. Connect GitHub repo to Railway
2. Add environment variables in Railway dashboard
3. Set `NODE_ENV=production`
4. Railway auto-deploys on every `git push`

Build process:
- `npm install` → installs dependencies
- `npm run postinstall` → builds React frontend to `dist/`
- `npm start` → runs `node api/server.js`

## What I'd Build Next (4 Weeks)

- **Week 1**: User personalization — location-based trends (state/city level)
- **Week 2**: Real-time updates — WebSocket push when trends change rank
- **Week 3**: Related content — integrate actual ShareChat posts for each trend
- **Week 4**: A/B testing framework — test card layouts, ranking algorithms

## Honest Disclosure

This project was built with assistance from AI tools for rapid prototyping. All architectural decisions, UX rationale, and system design were manually reviewed and validated.
