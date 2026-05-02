import { useState, useEffect } from 'react';
import { TrendingTagDetail } from '../types/trending';
import { fetchTrendDetail } from '../api/trending';

export function useTrendDetail(id: string | null) {
  const [detail, setDetail] = useState<TrendingTagDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchTrendDetail(id)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  return { detail, loading, error };
}
