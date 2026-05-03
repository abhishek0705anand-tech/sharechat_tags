# ShareChat Trending Tags System

A production-grade trending topics discovery system designed for Indian Hindi-speaking audiences. The system aggregates signals from multiple news and social sources, clusters related topics, ranks them by relevance, and serves them through a mobile-native web interface with all content rendered in Hindi (Devanagari script).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Flow](#system-flow)
3. [Signal Sources](#signal-sources)
4. [Scoring and Ranking](#scoring-and-ranking)
5. [Hindi Content Generation](#hindi-content-generation)
6. [Caching Strategy](#caching-strategy)
7. [Frontend Design](#frontend-design)
8. [Tech Stack](#tech-stack)
9. [Local Setup](#local-setup)
10. [API Reference](#api-reference)
11. [Deployment](#deployment)
12. [Future Roadmap](#future-roadmap)

---

## Architecture Overview

The system follows a modular pipeline architecture with clear separation between data ingestion, processing, and presentation layers.

```
+-------------------+     +-------------------+     +-------------------+
|  Signal Sources   | --> |  Backend Engine   | --> |  React Frontend   |
|  (4 sources)      |     |  (Node/Express)   |     |  (Mobile-first)   |
+-------------------+     +-------------------+     +-------------------+
                                |
                                v
                          +-------------+
                          | File Cache  |
                          | (6 hour TTL)|
                          +-------------+
```

---

## System Flow

### Step 1: Data Ingestion (Parallel Fetch)

On every API request (or cache miss), the backend fetches data from four external sources concurrently using `Promise.all`:

1. **Google News India RSS** - Parses the RSS feed for India-specific news headlines
2. **NewsAPI** - Fetches recent India-related articles using the `everything` endpoint
3. **Reddit** - Scrapes trending posts from r/india and r/indiaspeaks
4. **SerpAPI** - Retrieves real-time trending search queries from Google Trends for India

### Step 2: Signal Normalization

Each source returns raw data in different formats. The system normalizes all signals into a common structure:

```javascript
{
  source: 'newsapi',      // Identifier
  title: 'Headline text', // Normalized text
  rawValue: 10            // Engagement metric (varies by source)
}
```

### Step 3: Clustering and Deduplication

A fuzzy matching algorithm (`fuzzyMatch`) groups similar headlines into clusters. This prevents the same story from appearing multiple times under slightly different titles.

```
Input signals:
  "West Bengal Election: EC orders repoll"
  "WB polls: Election Commission orders fresh voting"
  "Bengal election commission announces repolling"

Cluster output:
  Cluster 1: [signal1, signal2, signal3] (matched by shared keywords)
```

### Step 4: Scoring

Each cluster receives a heat score (0-100) based on:

- Source reliability weights
- Number of signals in the cluster (more sources = higher confidence)
- Freshness boost (recent signals score higher)
- Engagement metrics (Reddit upvotes, search volume, etc.)

### Step 5: Hindi Content Generation

This is a two-tier system:

#### Tier 1: Batched AI (All 15 Trends)

All 15 ranked clusters are sent to Kimi AI (Moonshot, `kimi-k2.5`) in a **single batched API call**. This produces natural, grammatical Hindi sentences for every trend while minimizing API usage.

**Prompt structure:**
```
Generate Hindi content for these 15 trending headlines:
1. [category] "English headline 1"
2. [category] "English headline 2"
...
15. [category] "English headline 15"

Return JSON with titleHi, hashtag, descriptionHi for each.
```

**API Configuration:**
- **Endpoint:** `https://api.moonshot.ai/v1/chat/completions` (international)
- **Model:** `kimi-k2.5`
- **Temperature:** `0.6` (instant mode; thinking disabled for direct output)
- **Response format:** `json_object` (forces raw JSON without markdown)
- **Max tokens:** `4096`
- **Timeout:** `90` seconds
- **Fallback endpoint:** `https://api.moonshot.cn/v1/chat/completions` (China platform)

**Why batching works:**
- Reduces API calls from 15 to 1 per page load
- Token usage: ~400 prompt + ~350 completion per 5 trends (~1500 total for 15)
- Produces natural, contextual Hindi sentences with proper grammar
- Automatic endpoint fallback if key belongs to a different platform

#### Tier 2: Keyword Fallback

If the Kimi API call fails (network error, authentication issue, invalid response), the system falls back to a curated keyword mapping approach for all trends. This ensures 100% reliability.

**How it works:**
1. Scan the English headline for known Hindi keywords (200+ word map)
2. Replace each matched word with its Hindi equivalent
3. Join the first 2-3 keywords in their original order of appearance
4. Add category-specific description fallbacks

**Example:**
```
English:  "WB elections: ECI tells Supreme Court State nominee..."
Keywords: "wb" -> "पश्चिम बंगाल", "election" -> "चुनाव", 
          "supreme" -> "सुप्रीम", "court" -> "अदालत"
Output:   "पश्चिम बंगाल चुनाव सुप्रीम अदालत (ट्रेंडिंग)"
```

**Note on Phonetic Transliteration:** The system explicitly avoids phonetic transliteration (e.g., writing "democratic" as "डेमोक्रैटिक") because it produces gibberish that Hindi speakers cannot understand. All visible text uses real Hindi vocabulary.

### Step 6: Ranking and Deduplication

After scoring, clusters are sorted by heat score. The top 15 are selected for the response. If fewer than 3 categories are represented in the top 15, supplementary mock data is injected to ensure category diversity.

### Step 7: Caching

The final response is cached to a JSON file (`/tmp/sharechat-cache.json`) with a 6-hour TTL. Subsequent requests serve cached data instantly until expiry.

Cache headers prevent browser caching:
```javascript
res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
```

### Step 8: Frontend Rendering

The React frontend fetches data with a cache-busting timestamp (`?t=${Date.now()}`) and renders:
- Trend cards with rank, heat score, and category badge
- Hindi title and description
- Devanagari hashtag with copy-to-clipboard
- Mock reel carousel for visual engagement
- Bottom sheet detail view on card tap

---

## Signal Sources

| Source | Weight | Rationale |
|--------|--------|-----------|
| Google News India RSS | 35% | Broadest signal of Indian news trends. Replaced deprecated Google Trends RSS (returned 404). |
| NewsAPI (India headlines) | 25% | Validates mainstream importance through editorial coverage. |
| Reddit (r/india, r/indiaspeaks) | 20% | Early signal for grassroots trends before they hit mainstream media. |
| SerpAPI Realtime | 20% | Captures search behavior signals fresher than 1 hour old. |

---

## Scoring and Ranking

### Heat Score Formula

```
heatScore = weightedSum(sources) + freshnessBoost + breakingBoost - penalty
```

Where:
- `weightedSum`: Normalized engagement metrics multiplied by source reliability
- `freshnessBoost`: +15% for signals published within the last hour
- `breakingBoost`: +30% for topics containing breaking news keywords
- `penalty`: -30% for duplicate topics, -40% for overly generic keywords

### Final Ranking

1. Sort all clusters by `heatScore` descending
2. Select top 15 clusters
3. Assign ranks 1-15
4. Inject mock data if fewer than 3 categories are represented
5. Return as JSON array

---

## Hindi Content Generation

### Batched AI (Tier 1)

Used for: All 15 trends

**Input:** Array of 15 English headlines with categories  
**Output:** Array of `{index, titleHi, hashtag, descriptionHi}` in Devanagari script  
**API:** Kimi (Moonshot AI, `kimi-k2.5`) with JSON response format  
**Endpoints tried in order:** `api.moonshot.ai` (international) → `api.moonshot.cn` (China)  
**Timeout:** 90 seconds  
**Fallback:** If AI fails for any trend, use Tier 2 keyword system for that trend

### Keyword Mapping (Tier 2)

Used for: Any trend where AI returns null or fails

**Keyword map size:** 200+ words across 8 categories (sports, places, politics, technology, entertainment, finance, lifestyle, devotional, general)

**Title generation:**
```javascript
keywords = extractKeywords(englishTitle); // Order of appearance
if (keywords.length >= 3) return keywords.slice(0, 3).join(' ') + ' (ट्रेंडिंग)';
if (keywords.length >= 2) return keywords[0] + ' ' + keywords[1] + ' (ट्रेंडिंग)';
if (keywords.length === 1) return keywords[0] + ' (ट्रेंडिंग)';
```

**Description generation:**
Category-based templates:
```javascript
sports:     'यह खेल विषय सोशल मीडिया और न्यूज़ में तेज़ी से ट्रेंड कर रहा है।'
news:       'यह समाचार भारत में तेज़ी से ट्रेंड कर रहा है और लोग इस पर चर्चा कर रहे हैं।'
politics:   'यह राजनीतिक मुद्दा सोशल मीडिया और न्यूज़ चैनलों पर चर्चा में है।'
technology: 'यह टेक्नोलॉजी अपडेट भारतीय यूज़र्स में तेज़ी से ट्रेंड कर रहा है。'
// ... etc for each category
```

**Hashtag generation:**
```javascript
hashtag = '#' + keywords.slice(0, 2).join('').slice(0, 18);
```

### Comparison: AI vs Keyword Approach

| Dimension | Batched AI (Tier 1) | Keyword Fallback (Tier 2) |
|-----------|---------------------|---------------------------|
| Quality | Natural, grammatical Hindi sentences | Noun phrases (understandable but less polished) |
| Speed | 5-10 seconds for batch of 15 | Instant |
| API Cost | 1 call per page load (~1500 tokens) | Zero |
| Reliability | 99%+ with endpoint fallback | 100% reliable |
| Coverage | All 15 trends | Any trend where AI fails |

---

## Caching Strategy

### Backend Cache

- **Type:** File-based JSON cache (`/tmp/sharechat-cache.json`)
- **TTL:** 6 hours (configurable via `CACHE_TTL_SECONDS`)
- **Key:** Single key `trending_v1`
- **Invalidation:** Manual (delete cache file) or wait for TTL expiry

### Browser Cache Prevention

- Query parameter cache-busting: `/api/trending?t=${Date.now()}`
- Response headers: `Cache-Control: no-store, no-cache, must-revalidate`
- HTML meta tags: `Pragma: no-cache`, `Expires: 0`

---

## Frontend Design

### Design Principles

1. **Mobile-first:** All components optimized for 375px-420px viewport width
2. **Speed:** Skeleton loaders on initial load, instant cached refreshes
3. **Cultural fit:** Saffron/orange accent color (#FF6B35), Devanagari typography
4. **Scanability:** Card-based layout with visual hierarchy (rank badge, heat score, category)
5. **Depth:** Bottom sheet detail view preserves feed context without navigation

### Components

- **Feed:** Main screen with sticky header, scrollable trend list, bottom navigation
- **TrendCard:** Individual trend card with header, title, description, engagement stats, reel carousel
- **TrendDetail:** Bottom sheet with expanded details, copy hashtag button, related news mock
- **BottomSheet:** Draggable sheet with snap points and dismiss gesture
- **HeatScore:** Visual indicator combining numeric score and freshness badge
- **CategoryBadge:** Color-coded badge for trend category

### Rejected Alternatives

- **Horizontal carousel:** Poor discoverability, hidden content requires extra interaction
- **Tabbed categories:** Adds friction; users prefer mixed serendipity over filtered views
- **Desktop-first layout:** Assignment explicitly required mobile-native design
- **Phonetic transliteration:** Produces unreadable output (e.g., "सउबवएरसइओन" for "subversion")

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | React 18 + TypeScript | UI components and state management |
| Build Tool | Vite 5 | Fast development and production builds |
| Styling | Tailwind CSS 3 | Utility-first responsive styling |
| Animation | Framer Motion | Bottom sheet drag gestures and transitions |
| Icons | Lucide React | Consistent iconography |
| Backend Framework | Node.js + Express | REST API and static file serving |
| HTTP Client | Axios | External API requests |
| RSS Parsing | rss-parser | Google News RSS feed parsing |
| Caching | fs (file-based) | JSON cache with TTL |
| Deployment | Railway | GitHub-connected CI/CD |

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/abhishek0705anand-tech/sharechat_tags.git
cd sharechat_tags

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and add your API keys:
#   NEWSAPI_KEY=your_key
#   SERPAPI_KEY=your_key
#   KIMI_API_KEY=your_key
#   CACHE_TTL_SECONDS=21600
#   PORT=3001

# Start backend server
npm start

# In a separate terminal, start frontend dev server
npm run dev
```

### Development URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/api/health

---

## API Reference

### GET /api/health

Returns server status and uptime.

**Response:**
```json
{
  "status": "ok",
  "uptime": 123.45
}
```

### GET /api/trending

Returns the top 15 trending topics with Hindi content.

**Query Parameters:**
- `t` (number): Cache-busting timestamp

**Response:**
```json
{
  "data": [
    {
      "id": "topic-slug-2024-05-01",
      "rank": 1,
      "titleEn": "Original English headline",
      "titleHi": "Hindi headline in Devanagari",
      "hashtag": "#HindiHashtag",
      "descriptionEn": "English description",
      "descriptionHi": "Hindi description in Devanagari",
      "category": "news",
      "heatScore": 95,
      "sources": [...],
      "engagement": {
        "postsCount": 5400000,
        "searchVolume": 1200000,
        "newsCount": 45
      },
      "location": "National",
      "timestamp": "2024-05-01T12:00:00.000Z",
      "isFresh": true
    }
  ],
  "lastUpdated": "2024-05-01T12:00:00.000Z",
  "sourceStatus": {
    "googleTrends": "ok",
    "newsAPI": "ok",
    "reddit": "ok",
    "serpapi": "ok"
  },
  "isMockData": false
}
```

### GET /api/trending/:id

Returns detailed information for a single trend.

**Path Parameters:**
- `id` (string): Trend identifier

---

## Deployment

### Railway (Recommended)

1. Fork or connect the GitHub repository to Railway
2. Add environment variables in the Railway dashboard:
   - `NODE_ENV=production`
   - `NEWSAPI_KEY`
   - `SERPAPI_KEY`
   - `KIMI_API_KEY`
   - `CACHE_TTL_SECONDS=21600`
3. Railway auto-deploys on every push to the main branch

**Build Process:**
1. `npm install` - Installs dependencies
2. `npm run postinstall` - Builds React frontend to `dist/` (TypeScript compilation + Vite build)
3. `npm start` - Starts the Express server (`node api/server.js`)

**Production Behavior:**
- Server serves static files from `dist/` folder
- SPA routing fallback to `index.html`
- API routes prefixed with `/api/`

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEWSAPI_KEY` | Yes | - | NewsAPI API key |
| `SERPAPI_KEY` | Yes | - | SerpAPI API key |
| `KIMI_API_KEY` | Yes | - | Kimi (Moonshot AI) API key for Hindi content generation |
| `CACHE_TTL_SECONDS` | No | 21600 | Cache time-to-live in seconds (6 hours) |
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | No | development | Set to `production` for Railway |

---

## Future Roadmap

### Week 1: Personalization
- Location-based trending (state/city level filtering)
- User preference learning for category weights

### Week 2: Real-time Updates
- WebSocket push notifications when trend ranks change
- Live badge for breaking topics

### Week 3: Content Integration
- Integrate actual ShareChat posts for each trend
- Embed video thumbnails from trending reels

### Week 4: A/B Testing
- Test card layouts (compact vs expanded)
- Test ranking algorithm variants
- Measure engagement by layout

---

## Honest Disclosure

This project was built with assistance from AI-assisted development tools for rapid prototyping. All architectural decisions, system design, UX rationale, and implementation choices were manually reviewed, validated, and refined.
