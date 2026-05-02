export type Category =
  | "sports"
  | "news"
  | "entertainment"
  | "politics"
  | "technology"
  | "lifestyle"
  | "devotional"
  | "finance";

export interface SignalSource {
  name: string;
  confidence: number;
  rawSignal: string;
}

export interface TrendingTag {
  id: string;
  rank: number;
  titleEn: string;
  titleHi: string;
  hashtag: string;
  descriptionEn: string;
  descriptionHi: string;
  category: Category;
  heatScore: number;
  sources: SignalSource[];
  engagement: {
    postsCount?: number;
    searchVolume?: number;
    newsCount?: number;
  };
  location: string;
  timestamp: string;
  isFresh: boolean;
}

export interface ContentSnippet {
  title: string;
  url: string;
  source: string;
}

export interface TrendingTagDetail extends TrendingTag {
  relatedContent: ContentSnippet[];
}

export interface APIResponse {
  data: TrendingTag[];
  lastUpdated: string;
  sourceStatus: {
    googleTrends: "ok" | "error";
    newsAPI: "ok" | "error";
    reddit: "ok" | "error";
  };
  isMockData: boolean;
}
