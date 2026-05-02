# ShareChat Trending Tags System

A production-grade Trending Tags system built for ShareChat APM Assignment. Automatically identifies, ranks, and serves trending topics relevant to Indian/Hindi-speaking audiences with a mobile-native UI.

## How the System Works

### Signal Sources & Weights

| Source | Weight | Why |
|--------|--------|-----|
| Google Trends India (RSS) | 35% | Broadest signal of Indian search behavior |
| NewsAPI (IN headlines) | 25% | Validates mainstream importance |
| Reddit r/india + r/indiaspeaks | 20% | Early signal, grassroots trends |
| SerpAPI Realtime | 20% | Freshness, <1 hour old signals |

### Scoring Logic

1. Normalize each source's raw signal to 0-100
2. Apply weighted sum based on source reliability
3. Boost: breaking news (+30%), Indian events (+20%), freshness (+15%)
4. Penalty: repeat topics (-30%), too-broad keywords (-40%)
5. Cap at 100

### Pipeline

```
Raw Sources → Fetch (parallel) → Cluster/Dedupe → Score → Rank → Cache (10 min) → API Response
```

### AI / Enrichment

- Keyword-based categorization (sports, news, entertainment, politics, technology, lifestyle, devotional, finance)
- Transliteration-style Hindi title/description generation
- Hashtag generation from raw signals

## UX Rationale

### What I Optimized For

1. **Speed**: Skeleton loaders + 10-min cache = feels instant
2. **Cultural Fit**: Hindi-primary, saffron accents, Indian categorization
3. **Scanability**: Cards not lists, visual heat scores, category colors
4. **Depth**: Bottom sheet keeps context of feed, not jarring navigation

### What I Considered and Rejected

- **Horizontal carousel for trends**: Poor discoverability, hidden content
- **Tabbed categories**: Adds friction, users want mixed serendipity
- **Desktop-first layout**: Assignment explicitly asks for mobile-native

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Backend | Node.js + Express |
| Caching | In-memory (node-cache) |

## Running Locally

```bash
# Install dependencies
npm install

# Start backend
npm start

# In another terminal, start frontend
npm run dev
```

## API Endpoints

- `GET /api/health` — Health check
- `GET /api/trending` — List trending tags (cached 10 min)
- `GET /api/trending/:id` — Detail view for a single tag

## Environment Variables

```
NEWSAPI_KEY=your_key
SERPAPI_KEY=your_key
CACHE_TTL_SECONDS=600
PORT=3001
```

## What I'd Build Next (4 Weeks)

- **Week 1**: User personalization — location-based trends (state/city level)
- **Week 2**: Real-time updates — WebSocket push when trends change rank
- **Week 3**: Related content — integrate actual ShareChat posts for each trend
- **Week 4**: A/B testing framework — test card layouts, ranking algorithms

## Honest Disclosure

This project was built with assistance from AI tools (Claude/GPT) for rapid prototyping. All architectural decisions, UX rationale, and system design were manually reviewed and validated.
