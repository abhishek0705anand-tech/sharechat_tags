import axios from 'axios';
import { APIResponse, TrendingTagDetail } from '../types/trending';

const API_BASE = '/api';

export async function fetchTrending(): Promise<APIResponse> {
  // Timeout after 15s — if Railway app is asleep, mobile browsers give up earlier
  const res = await axios.get<APIResponse>(`${API_BASE}/trending?t=${Date.now()}`, {
    timeout: 15000,
    timeoutErrorMessage: 'सर्वर जाग रहा है, कृपया कुछ सेकंड में फिर से कोशिश करें',
  });
  return res.data;
}

export async function fetchTrendDetail(id: string): Promise<TrendingTagDetail> {
  const res = await axios.get<{ data: TrendingTagDetail }>(`${API_BASE}/trending/${id}`);
  return res.data.data;
}

export function formatPostCount(count?: number): string {
  if (!count) return '';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return `${count}`;
}

export const categoryLabels: Record<string, string> = {
  sports: 'खेल',
  news: 'समाचार',
  entertainment: 'मनोरंजन',
  politics: 'राजनीति',
  technology: 'टेक्नोलॉजी',
  lifestyle: 'लाइफस्टाइल',
  devotional: 'धार्मिक',
  finance: 'फाइनेंस',
};
