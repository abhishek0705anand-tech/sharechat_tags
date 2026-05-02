import { Category } from '../types/trending';

interface CategoryBadgeProps {
  category: Category;
}

const categoryConfig: Record<Category, { label: string; bg: string; text: string; emoji: string }> = {
  sports: { label: 'खेल', bg: 'bg-blue-50', text: 'text-blue-600', emoji: '🏏' },
  news: { label: 'समाचार', bg: 'bg-red-50', text: 'text-red-600', emoji: '📰' },
  entertainment: { label: 'मनोरंजन', bg: 'bg-purple-50', text: 'text-purple-600', emoji: '🎬' },
  politics: { label: 'राजनीति', bg: 'bg-slate-100', text: 'text-slate-700', emoji: '🏛️' },
  technology: { label: 'टेक', bg: 'bg-cyan-50', text: 'text-cyan-600', emoji: '📱' },
  lifestyle: { label: 'लाइफस्टाइल', bg: 'bg-pink-50', text: 'text-pink-600', emoji: '✨' },
  devotional: { label: 'धार्मिक', bg: 'bg-orange-50', text: 'text-orange-600', emoji: '🙏' },
  finance: { label: 'फाइनेंस', bg: 'bg-emerald-50', text: 'text-emerald-600', emoji: '💰' },
};

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${config.bg} ${config.text}`}>
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
}
