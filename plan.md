# ShareChat APM Assignment — Complete Build Plan

## Overview
Build a production-grade Trending Tags system for ShareChat consisting of:
1. **Trending Engine** (Backend API): Automatically identifies, ranks, and serves trending topics relevant to Indian/Hindi-speaking audiences
2. **Mobile App Prototype** (Frontend): A mobile-native, clickable UI showing trending tags with detail views

---

## Phase 1: Project Setup & Architecture

### 1.1 Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React + TypeScript + Vite | Fast, modern, great mobile PWA support |
| Styling | Tailwind CSS | Utility-first, rapid mobile-responsive UI |
| Mobile Feel | Capacitor.js (or PWA) | Native mobile gestures, bottom sheets, swipe |
| Backend | Node.js + Express (or Next.js API routes) | Simple, fast to build, easy to deploy |
| Trending Data | SerpAPI (Google Trends) + NewsAPI + Twitter/X API v2 + Reddit | Real-time signals from multiple sources |
| AI Processing | OpenAI GPT-4o-mini API (or Groq for speed) | Tag ranking, description generation, Hindi translation, categorization |
| Caching | In-memory (Node cache) or Redis | Keep responses fast, respect API limits |
| Deployment | Vercel (frontend) + Vercel Serverless Functions (backend) | Free tier, instant deploy, custom domain |
| Video Recording | Loom desktop app | Final deliverable |

### 1.2 Project Structure

```
sharechat-trending/
├── README.md                          # Write-up (2 pages max)
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── .env.example                       # Template for API keys
│
├── src/
│   ├── main.tsx                       # Entry point
│   ├── App.tsx                        # Root router
│   ├── index.css                      # Global styles + custom animations
│   │
│   ├── types/                         # TypeScript interfaces
│   │   └── trending.ts
│   │
│   ├── components/                    # Reusable UI components
│   │   ├── Feed.tsx                   # Main feed with trending tags
│   │   ├── TrendCard.tsx              # Individual trending tag card
│   │   ├── TrendDetail.tsx            # Detail view (bottom sheet)
│   │   ├── HeatScore.tsx              # Visual heat indicator (flame/gradient)
│   │   ├── CategoryBadge.tsx          # Category pill (sports/news/etc)
│   │   ├── BottomSheet.tsx            # Mobile-native bottom sheet modal
│   │   ├── SkeletonLoader.tsx         # Loading shimmer effect
│   │   └── ErrorState.tsx             # Error/empty state
│   │
│   ├── hooks/
│   │   ├── useTrending.ts             # Fetch trending tags
│   │   ├── useTrendDetail.ts          # Fetch single trend detail
│   │   └── useBottomSheet.ts          # Bottom sheet gesture control
│   │
│   ├── api/
│   │   └── trending.ts                # API client functions
│   │
│   └── styles/
│       └── animations.css             # Custom keyframe animations
│
├── api/                               # Serverless API routes (Vercel)
│   ├── trending.ts                    # GET /api/trending — main endpoint
│   ├── trending-detail.ts             # GET /api/trending/:id — detail view
│   └── lib/
│       ├── trending-engine.ts         # Core ranking algorithm
│       ├── sources/
│       │   ├── google-trends.ts       # Google Trends via SerpAPI
│       │   ├── newsapi.ts             # News headlines
│       │   ├── twitter-scraper.ts     # X/Twitter trends (scraping or API)
│       │   └── reddit.ts              # Reddit India trends
│       ├── ranker.ts                  # Weighted scoring + deduplication
│       ├── translator.ts              # English → Hindi translation
│       ├── categorizer.ts             # Category classification
│       └── cache.ts                   # Simple caching layer
│
└── public/
    └── assets/                        # Static assets (icons, mock content)
```

---

## Phase 2: Backend — Trending Tags System

### 2.1 Core Data Model

```typescript
interface TrendingTag {
  id: string;                    // Unique slug: "india-vs-australia-2026-05-01"
  rank: number;                  // 1, 2, 3...
  titleEn: string;               // "India vs Australia"
  titleHi: string;               // "भारत बनाम ऑस्ट्रेलिया"
  hashtag: string;               // "#IndiaVsAustralia"
  descriptionEn: string;         // "Cricket match trending on sports news + social"
  descriptionHi: string;         // "स्पोर्ट्स न्यूज़ और सोशल मीडिया पर ट्रेंडिंग क्रिकेट मैच"
  category: Category;            // "sports" | "news" | "entertainment" | "politics" | "technology" | "lifestyle" | "devotional" | "finance"
  heatScore: number;             // 0-100 aggregated score
  sources: SignalSource[];       // Where the signals came from
  engagement: {
    postsCount?: number;         // Approximate post mentions
    searchVolume?: number;       // Relative search interest
    newsCount?: number;          // Number of news articles
  };
  location: string;              // "National" | "Maharashtra" | etc.
  timestamp: string;             // ISO 8601
  isFresh: boolean;              // True if < 4 hours old
}

interface SignalSource {
  name: string;                  // "google-trends", "newsapi", "twitter"
  confidence: number;            // 0-1
  rawSignal: string;             // Raw text from source
}

type Category = 
  | "sports" 
  | "news" 
  | "entertainment" 
  | "politics" 
  | "technology" 
  | "lifestyle" 
  | "devotional" 
  | "finance";
```

### 2.2 Trending Signal Sources (How to get real data without paid APIs)

#### Source A: Google Trends India (FREE — via trending-google-searches npm or RSS)
```
URL: https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN
Format: RSS feed with title, approximate_traffic, news_item
Extract: title (trending keyword), traffic volume, related news links
```
**Implementation:**
- Use `rss-parser` npm package to fetch and parse RSS
- Extract `<ht:approx_traffic>` for volume
- Extract `<ht:news_item>` for related news context
- Rate limit: Fetch every 15 minutes (cache)

#### Source B: NewsAPI (FREE tier: 100 requests/day)
```
API: https://newsapi.org/v2/top-headlines?country=in&apiKey=KEY
Extract: title, description, url, publishedAt
Use: Cross-reference with Google Trends to validate + enrich descriptions
```

#### Source C: Reddit India (FREE — via Reddit JSON API, no auth needed)
```
URL: https://www.reddit.com/r/india/hot.json?limit=25
URL: https://www.reddit.com/r/indiaspeaks/hot.json?limit=25
Extract: title, ups (votes), num_comments, subreddit
Use: Detect grassroots trends before they hit mainstream
```

#### Source D: SerpAPI — Google Trends Realtime (FREE tier: 100 searches/mo)
```
API: https://serpapi.com/search?engine=google_trends_trending_now&geo=IN
Extract: Realtime trending queries with timestamps
Use: Get genuinely fresh (< 1 hour) trends
```

#### Source E: Mock/Seed Data (Fallback)
- Maintain a curated list of ~20 evergreen Indian topics (IPL, festivals, politics)
- Used when APIs fail or for initial load
- Updated manually via a JSON file

### 2.3 The Ranking Algorithm (Weighted Scoring)

```typescript
function calculateHeatScore(signals: RawSignal[]): number {
  const weights = {
    googleTrends: 0.35,      // High — broad Indian internet behavior
    newsAPI: 0.25,             // Medium-high — validated mainstream news
    reddit: 0.20,              // Medium — early signal, grassroots
    serpapiRealtime: 0.20,     // Medium — freshness signal
  };

  let score = 0;
  
  for (const signal of signals) {
    const normalized = normalize(signal.rawValue, signal.source);
    score += normalized * weights[signal.source];
  }
  
  // Boost factors
  if (isBreakingNews(signals)) score *= 1.3;
  if (isIndianEvent(signals)) score *= 1.2;
  if (isFresh(signals, 2)) score *= 1.15;  // < 2 hours old
  
  // Penalty factors
  if (isRepeatFromYesterday(signals)) score *= 0.7;
  if (isTooBroad(signals)) score *= 0.6;   // e.g., "weather", "news"
  
  return Math.min(Math.round(score), 100);
}

function rankAndDeduplicate(allSignals: RawSignal[]): TrendingTag[] {
  // Step 1: Cluster similar signals (fuzzy matching on keywords)
  // e.g., "India vs Australia", "IND vs AUS", "India Australia Cricket" → same cluster
  
  // Step 2: Merge clusters, aggregate scores
  
  // Step 3: Sort by heatScore descending
  
  // Step 4: Take top 15, ensure at least 3 categories represented
  
  // Step 5: Assign ranks 1-15
}
```

### 2.4 AI Processing Pipeline (OpenAI/Groq)

For each trend cluster, call GPT-4o-mini with this prompt:

```
You are a content curator for ShareChat, India's largest vernacular social media platform.
Given these raw trending signals about an Indian topic, produce:

1. A clean hashtag in English (camelCase, no spaces, max 20 chars)
2. A catchy title in Hindi (max 40 chars)
3. A one-line description in Hindi (max 80 chars)
4. A category from: sports, news, entertainment, politics, technology, lifestyle, devotional, finance
5. A "heat" score 0-100 based on urgency and popularity

Raw signals:
{{signals_json}}

Respond ONLY as valid JSON:
{
  "hashtag": "#...",
  "titleHi": "...",
  "descriptionHi": "...",
  "category": "...",
  "heatScore": 0-100
}
```

**Why this approach:**
- Raw signals are messy ("ind vs aus 3rd test day 2 highlights" → clean "#IndiaVsAustralia")
- Hindi translation needs cultural nuance, not literal translation
- Categorization needs Indian context (e.g., "Ayodhya" → devotional, not just news)
- Groq API is extremely fast (< 200ms) and cheap

### 2.5 API Endpoints

```
GET /api/trending
Response: { 
  data: TrendingTag[], 
  lastUpdated: string, 
  sourceCount: number 
}
Cache: 10 minutes (stale-while-revalidate)

GET /api/trending/:id
Response: { 
  data: TrendingTag & { 
    relatedContent: ContentSnippet[] 
  } 
}

// Health check
GET /api/health
Response: { status: "ok", uptime: number }
```

### 2.6 Caching Strategy

```typescript
// Two-layer cache:
// Layer 1: In-memory (Node cache) — 10 min TTL
// Layer 2: On-demand refresh — if cache expired, return stale + trigger background refresh

// Why: Freshness requirement says "reflect what's trending TODAY" 
// 10-min cache balances freshness with API rate limits
```

---

## Phase 3: Frontend — Mobile App Prototype

### 3.1 Design Principles (Critical for APM Assignment)

1. **Mobile-First**: Design for 375px width (iPhone SE) first, then scale up
2. **Native Feel**: Bottom sheets, swipe gestures, spring animations, haptic-like visual feedback
3. **ShareChat Brand**: Warm colors (saffron/orange accents), Hindi-primary, Bharat aesthetic
4. **Content Density**: Don't waste space — this is a feed, every pixel matters
5. **Instant Feedback**: Tap states, shimmer loaders, smooth transitions

### 3.2 Color Palette

```css
:root {
  /* Primary */
  --sc-orange: #FF6B35;           /* ShareChat saffron */
  --sc-orange-dark: #E55A2B;
  --sc-orange-light: #FFF0EB;
  
  /* Heat Score Gradient */
  --heat-low: #22C55E;            /* Green */
  --heat-medium: #EAB308;         /* Yellow */
  --heat-high: #EF4444;           /* Red */
  --heat-extreme: linear-gradient(90deg, #FF6B35, #EF4444);
  
  /* Background */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F9FA;        /* Card backgrounds */
  --bg-elevated: #FFFFFF;         /* Bottom sheets */
  
  /* Text */
  --text-primary: #1A1A2E;        /* Near-black with warmth */
  --text-secondary: #6B7280;
  --text-tertiary: #9CA3AF;
  
  /* Category Colors */
  --cat-sports: #3B82F6;
  --cat-news: #EF4444;
  --cat-entertainment: #A855F7;
  --cat-politics: #1E293B;
  --cat-technology: #06B6D4;
  --cat-lifestyle: #EC4899;
  --cat-devotional: #F97316;
  --cat-finance: #10B981;
}
```

### 3.3 Screen Designs

#### Screen 1: Feed (Home)

```
┌─────────────────────────────┐
│ ○  ShareChat  ▼  🇮🇳        │  ← Header: Logo, location dropdown, India flag
├─────────────────────────────┤
│ 🔥 आज क्या ट्रेंड कर रहा है │  ← Section title: "What's trending today"
│                             │
│ ┌─────────────────────────┐ │
│ │ 🔥 95  #IndiaVsAustralia│ │  ← Card 1: Rank 1, heat score, hashtag (Hindi)
│ │ 🏏 भारत बनाम ऑस्ट्रेलिया │ │  ← Title in Hindi
│ │ क्रिकेट मैच ट्रेंडिंग    │ │  ← Description in Hindi
│ │ 🔴 LIVE · खेल · 2.4M posts│ │ ← Badge: Fresh/Live + Category + Post count
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⚡ 82  #MumbaiRains     │ │  ← Card 2: Rank 2, weather event
│ │ 🌧️ मुंबई में भारी बारिश  │ │
│ │ मौसम अपडेट, लाइव तस्वीरें │ │
│ │ 🟡 Trending · मौसम · 890K│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🔥 78  #Diwali2026      │ │  ← Card 3: Festival
│ │ 🪔 दीवाली 2026 तैयारियाँ │ │
│ │ ...                     │ │
│ └─────────────────────────┘ │
│                             │
│ ... (10-15 cards total)     │
│                             │
│ ┌─────────────────────────┐ │
│ │   ↓  और ट्रेंड देखें     │ │  ← "See more trends" button
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🏠    🔍    ➕    🔔    👤  │  ← Bottom Nav (fixed)
└─────────────────────────────┘
```

**Card Interaction:**
- Tap card → Opens bottom sheet with detail view
- Long press → Quick preview (optional)
- Swipe card left → Share (optional)
- Pull down → Refresh trending list

#### Screen 2: Trend Detail (Bottom Sheet)

```
┌─────────────────────────────┐
│ ━━━━━  Drag handle   ━━━━━  │  ← Pull-down to dismiss
├─────────────────────────────┤
│ 🔥 95  HEAT SCORE           │
│                             │
│ #IndiaVsAustralia           │  ← English hashtag (copyable)
│ भारत बनाम ऑस्ट्रेलिया        │  ← Hindi title (large)
│                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ 🔴 LIVE                     │  ← Freshness badge
│ 🏏 खेल (Sports)             │  ← Category badge  
│ 📍 राष्ट्रीय (National)      │  ← Geography
│ 📝 2.4M पोस्ट               │  ← Engagement
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                             │
│ विवरण:                      │
│ स्पोर्ट्स न्यूज़ और सोशल    │  ← Description
│ मीडिया पर ट्रेंडिंग क्रिकेट │
│ मैच। भारत और ऑस्ट्रेलिया    │
│ के बीच 3rd Test मैच चल रहा  │
│ है।                         │
│                             │
│ ┌─────────────────────────┐ │
│ │ [📰] संबंधित समाचार      │ │  ← Related news snippet
│ │ India 312/4 at Stumps...│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  🎥  इस ट्रेंड पर पोस्ट  │ │  ← CTA: "Post about this trend"
│ └─────────────────────────┘ │
│                             │
│ 📊 स्रोत:                   │  ← "Sources" section
│ • Google Trends (35%)       │
│ • NewsAPI (25%)             │
│ • Reddit India (20%)        │
│ • Realtime (20%)            │
└─────────────────────────────┘
```

**Bottom Sheet Behavior:**
- Covers 85% of screen height
- Drag down on handle to dismiss (spring animation)
- Swipe up to expand full screen
- Back button dismisses sheet
- Sheet has backdrop blur on feed behind it

### 3.4 Animations & Micro-interactions

```css
/* Card entrance — staggered fade up */
@keyframes cardEnter {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Stagger: card 1 = 0ms, card 2 = 80ms, card 3 = 160ms... */

/* Heat score pulse for LIVE trends */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}

/* Bottom sheet slide up */
@keyframes sheetEnter {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

/* Skeleton shimmer */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Tap feedback */
.card:active {
  transform: scale(0.98);
  transition: transform 0.1s;
}
```

### 3.5 Responsive Breakpoints

```
Mobile (default):     < 640px  — Single column, full-width cards
Tablet (sm):          640px+   — Max-width container, centered
Desktop (md):         768px+   — Slight padding, mobile frame wrapper
Desktop (lg):         1024px+  — Show phone mockup frame on desk background
```

**Important:** Even on desktop, the UI should LOOK like a phone app — centered mobile viewport, not a stretched web page.

---

## Phase 4: Data Flow & Integration

### 4.1 Request Flow

```
User opens app
    ↓
Frontend shows skeleton loader immediately
    ↓
GET /api/trending
    ↓
Backend checks cache (10 min TTL)
    ├── Cache HIT → Return cached data (sub-100ms)
    └── Cache MISS → Trigger pipeline:
        1. Fetch ALL sources in parallel (Promise.all):
           - Google Trends RSS
           - NewsAPI headlines
           - Reddit r/india + r/indiaspeaks
           - SerpAPI realtime
        2. Deduplicate & cluster signals
        3. For each cluster, call AI (Groq) for enrichment
        4. Calculate heat scores
        5. Rank & slice top 15
        6. Store in cache
        7. Return response
    ↓
Frontend renders cards with staggered animation
```

### 4.2 Error Handling

```typescript
// Graceful degradation strategy:
// If any source fails, continue with available sources
// If ALL sources fail, return mock data with clear indication

interface APIResponse {
  data: TrendingTag[];
  lastUpdated: string;
  sourceStatus: {
    googleTrends: 'ok' | 'error';
    newsAPI: 'ok' | 'error';
    reddit: 'ok' | 'error';
  };
  isMockData: boolean;  // True if using fallback
}
```

---

## Phase 5: Implementation Order (Step-by-Step)

### Step 1: Project Bootstrap (30 min)
1. `npm create vite@latest sharechat-trending -- --template react-ts`
2. Install dependencies: `tailwindcss`, `framer-motion` (animations), `rss-parser`, `axios`, `lucide-react` (icons)
3. Setup Tailwind config with custom colors
4. Create folder structure
5. Create `.env` file with API keys (add to `.gitignore`)

### Step 2: TypeScript Types & Mock Data (30 min)
1. Define all interfaces in `src/types/trending.ts`
2. Create realistic mock data (10-15 Indian trending topics in Hindi)
3. Mock data should cover all categories: sports, news, entertainment, politics, devotional, finance
4. Use mock data for frontend development before backend is ready

### Step 3: Backend API Routes (2 hours)
1. Create `/api/trending.ts` — main endpoint
2. Implement each source adapter (Google Trends, NewsAPI, Reddit)
3. Build deduplication & clustering logic
4. Implement scoring algorithm
5. Add caching layer
6. Connect to AI enrichment (Groq/OpenAI)
7. Test endpoint locally

### Step 4: Frontend Components (3 hours)
1. `BottomSheet` component (most complex — use framer-motion)
2. `TrendCard` component with all states
3. `Feed` screen with list
4. `TrendDetail` content
5. `HeatScore` visual component
6. `CategoryBadge` with colors
7. Loading & error states
8. Pull-to-refresh

### Step 5: Integration & Polish (2 hours)
1. Connect frontend to backend API
2. Add error boundaries
3. Polish animations and transitions
4. Test on mobile viewport (Chrome DevTools)
5. Add PWA manifest for native feel

### Step 6: README Write-Up (1 hour)
1. How the system works (sources, logic, weights)
2. Workflow diagram (ASCII art or embedded image)
3. Model/API choices with reasoning
4. UX rationale
5. "What I'd build next" section
6. Honest disclosure of AI tools used

### Step 7: Deploy & Record (1 hour)
1. Deploy to Vercel (both frontend + API routes)
2. Verify `/api/trending` returns live data
3. Take screenshot of trending list
4. Record 2-minute Loom walkthrough

---

## Phase 6: README Write-Up Template

### Structure (Max 2 pages):

```markdown
# ShareChat Trending Tags System

## 1. How the System Works

### Signal Sources & Weights
| Source | Weight | Why |
|--------|--------|-----|
| Google Trends India | 35% | Broadest signal of Indian search behavior |
| NewsAPI (IN headlines) | 25% | Validates mainstream importance |
| Reddit r/india | 20% | Early signal, grassroots trends |
| SerpAPI Realtime | 20% | Freshness, <1 hour old signals |

### Scoring Logic
- Normalize each source's raw signal to 0-100
- Apply weighted sum
- Boost: breaking news (+30%), Indian events (+20%), freshness (+15%)
- Penalty: repeat topics (-30%), too-broad keywords (-40%)

### Pipeline
[ASCII workflow diagram]
Raw Sources → Fetch → Cluster/Dedupe → AI Enrichment → Score → Rank → Cache → API Response

### AI Usage
- Groq API (LLaMA 3) for: Hindi translation, description generation, categorization
- Why Groq: 200ms latency, 10x cheaper than GPT-4, sufficient quality

## 2. UX Rationale

### What I Optimized For
1. **Speed**: Skeleton loaders + 10-min cache = feels instant
2. **Cultural Fit**: Hindi-first, saffron accents, Indian categorization
3. **Scanability**: Cards not lists, visual heat scores, category colors
4. **Depth**: Bottom sheet keeps context of feed, not jarring navigation

### What I Considered and Rejected
- **Horizontal carousel for trends**: Poor discoverability, hidden content
- **Tabbed categories**: Adds friction, users want mixed serendipity
- **Desktop-first layout**: Assignment explicitly asks for mobile-native

## 3. What I'd Build Next (4 Weeks)

Week 1: User personalization — location-based trends (state/city level)
Week 2: Real-time updates — WebSocket push when trends change rank
Week 3: Related content — integrate actual ShareChat posts for each trend
Week 4: A/B testing framework — test card layouts, ranking algorithms
```

---

## Phase 7: Workflow Diagram (For README + Loom)

```
                    ┌─────────────────────────────────────────┐
                    │         TRENDING TAGS PIPELINE          │
                    └─────────────────────────────────────────┘

  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │ Google Trends│   │   NewsAPI    │   │    Reddit    │   │  SerpAPI     │
  │    RSS       │   │  Headlines   │   │  r/india     │   │  Realtime    │
  │   (35%)      │   │    (25%)     │   │    (20%)     │   │   (20%)      │
  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
         │                   │                   │                   │
         └───────────────────┴───────────────────┴───────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  FETCH & PARSE (parallel)│
                    │  ~500ms total            │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  CLUSTER & DEDUPLICATE   │
                    │  Fuzzy match similar     │
                    │  topics                  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  AI ENRICHMENT (Groq)    │
                    │  Hindi title/desc        │
                    │  Category classification │
                    │  ~200ms per batch        │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  SCORE & RANK            │
                    │  Weighted aggregation    │
                    │  Boost/penalty rules     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  CACHE (10 min TTL)      │
                    │  Stale-while-revalidate  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  API RESPONSE            │
                    │  15 ranked trending tags │
                    │  with full metadata      │
                    └─────────────────────────┘
```

---

## Phase 8: Mock Data (10 Seed Topics for Development)

```json
[
  {
    "rank": 1,
    "hashtag": "#IPL2026Final",
    "titleHi": "आईपीएल 2026 फाइनल",
    "descriptionHi": "चेन्नई और मुंबई के बीच रोमांचक फाइनल मुकाबला",
    "category": "sports",
    "heatScore": 98,
    "isFresh": true
  },
  {
    "rank": 2,
    "hashtag": "#MumbaiLocalTrain",
    "titleHi": "मुंबई लोकल ट्रेन अपडेट",
    "descriptionHi": "मानसून के चलते पश्चिमी रेलवे में delays",
    "category": "news",
    "heatScore": 85,
    "isFresh": true
  },
  {
    "rank": 3,
    "hashtag": "#Pushpa2",
    "titleHi": "पुष्पा 2 टीज़र रिलीज़",
    "descriptionHi": "अल्लू अर्जुन की मोस्ट अवेटेड फिल्म का टीज़र आउट",
    "category": "entertainment",
    "heatScore": 82,
    "isFresh": false
  },
  {
    "rank": 4,
    "hashtag": "#RBIInterestRate",
    "titleHi": "RBI repo rate cut",
    "descriptionHi": "ब्याज दरों में 25 bps की कटौती का ऐलान",
    "category": "finance",
    "heatScore": 78,
    "isFresh": true
  },
  {
    "rank": 5,
    "hashtag": "#BadrinathYatra",
    "titleHi": "बद्रीनाथ यात्रा 2026",
    "descriptionHi": "चारधाम यात्रा शुरू, भक्तों की भारी भीड़",
    "category": "devotional",
    "heatScore": 72,
    "isFresh": false
  }
]
```

---

## Phase 9: API Keys Required

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| NewsAPI | Indian headlines | 100 req/day |
| SerpAPI | Google Trends realtime | 100 searches/mo |
| Groq | AI enrichment (Hindi translation) | Free tier generous |
| Reddit JSON | r/india hot posts | Unlimited (no auth) |
| Google Trends RSS | Daily trending | Unlimited (RSS) |

**Environment variables (.env):**
```
NEWSAPI_KEY=your_key
SERPAPI_KEY=your_key
GROQ_API_KEY=your_key
CACHE_TTL_SECONDS=600
```

---

## Phase 10: Deployment Checklist

- [ ] All API keys configured in Vercel dashboard
- [ ] `vercel.json` routes API correctly
- [ ] CORS enabled for production domain
- [ ] Cache headers set correctly
- [ ] PWA manifest configured
- [ ] Mobile viewport meta tag present
- [ ] Touch targets minimum 44px
- [ ] No horizontal scroll on mobile
- [ ] Bottom sheet dismisses on back button
- [ ] Screenshot taken of live trending list
- [ ] README complete with workflow diagram
- [ ] GitHub repo is public
- [ ] Loom video recorded (2 min max)

---

## Files to Create (Complete File List)

### Config Files
- `package.json`
- `vite.config.ts`
- `tailwind.config.js`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `.env.example`
- `.gitignore`
- `vercel.json`
- `index.html`

### Source Files
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/vite-env.d.ts`
- `src/types/trending.ts`
- `src/components/Feed.tsx`
- `src/components/TrendCard.tsx`
- `src/components/TrendDetail.tsx`
- `src/components/BottomSheet.tsx`
- `src/components/HeatScore.tsx`
- `src/components/CategoryBadge.tsx`
- `src/components/SkeletonLoader.tsx`
- `src/components/ErrorState.tsx`
- `src/hooks/useTrending.ts`
- `src/hooks/useTrendDetail.ts`
- `src/hooks/useBottomSheet.ts`
- `src/api/trending.ts`
- `src/styles/animations.css`
- `api/trending.ts`
- `api/trending-detail.ts`
- `api/lib/trending-engine.ts`
- `api/lib/sources/google-trends.ts`
- `api/lib/sources/newsapi.ts`
- `api/lib/sources/reddit.ts`
- `api/lib/sources/serpapi.ts`
- `api/lib/ranker.ts`
- `api/lib/categorizer.ts`
- `api/lib/cache.ts`
- `README.md`
- `public/manifest.json`

**Total: ~40 files to build a complete, production-quality submission.**

---

## Key Success Criteria

| Criterion | How We Meet It |
|-----------|---------------|
| 10+ ranked tags per call | API returns 15, frontend shows all |
| Hindi language | AI-translated titles + descriptions |
| Metadata (desc, category, heat, source) | Complete data model + UI display |
| Freshness (not cached from build) | 10-min cache + live API calls |
| Indian/Hindi audience | India-specific sources + cultural categorization |
| Mobile-native UX | Bottom sheets, gestures, PWA, 375px-first design |
| Clickable prototype | React SPA with client-side routing |
| Detail view | Bottom sheet with full metadata |
| Hosted & shareable | Vercel deployment |
| GitHub repo | Public with README write-up |
