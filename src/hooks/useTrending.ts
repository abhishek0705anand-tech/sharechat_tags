import { useState, useEffect, useCallback } from 'react';
import { APIResponse } from '../types/trending';
import { fetchTrending } from '../api/trending';

export function useTrending() {
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchTrending();
      setResponse(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load trending';
      // Show a friendly message when Railway app is waking up from sleep
      if (msg.includes('timeout') || msg.includes('Network Error') || msg.includes('ECONNREFUSED')) {
        setError('सर्वर जाग रहा है, कृपया 30 सेकंड में फिर से कोशिश करें');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { response, loading, error, refreshing, refresh: () => load(true) };
}
