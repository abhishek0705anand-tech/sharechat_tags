import { TrendingTag } from '../types/trending';
import { formatPostCount } from '../api/trending';
import HeatScore from './HeatScore';
import CategoryBadge from './CategoryBadge';
import { MapPin, FileText, Radio, Copy, Check, Newspaper } from 'lucide-react';
import { useState } from 'react';

interface TrendDetailProps {
  trend: TrendingTag;
}

export default function TrendDetail({ trend }: TrendDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(trend.hashtag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-5 pt-2">
      {/* Heat Score */}
      <div className="flex items-center justify-between mb-4">
        <HeatScore score={trend.heatScore} isFresh={trend.isFresh} />
        {trend.isFresh && (
          <span className="flex items-center gap-1 text-xs font-bold text-red-500">
            <Radio className="w-3 h-3 animate-pulse" />
            लाइव
          </span>
        )}
      </div>

      {/* Hashtag & Title */}
      <div className="mb-4">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-orange-500 font-bold text-lg mb-1"
        >
          {trend.hashtag}
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <h2 className="text-2xl font-black text-gray-900 leading-tight">{trend.titleHi}</h2>
      </div>

      {/* Meta Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <CategoryBadge category={trend.category} />
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          {trend.location === 'National' ? 'राष्ट्रीय' : trend.location}
        </span>
        {trend.engagement.postsCount && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <FileText className="w-3 h-3" />
            {formatPostCount(trend.engagement.postsCount)} पोस्ट
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 my-4" />

      {/* Description */}
      <div className="mb-5">
        <p className="text-sm font-bold text-gray-500 mb-1">विवरण:</p>
        <p className="text-sm text-gray-800 leading-relaxed">{trend.descriptionHi}</p>
      </div>

      {/* Related News */}
      <div className="bg-gray-50 rounded-xl p-3 mb-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Newspaper className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold text-gray-500">संबंधित समाचार</span>
        </div>
        <p className="text-sm text-gray-800">{trend.titleHi} — यह विषय भारतीय न्यूज़ और सोशल मीडिया पर तेज़ी से ट्रेंड कर रहा है।</p>
      </div>

      {/* Mock Reels Grid */}
      <div className="mb-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">🔥 टॉप पोस्ट</p>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => {
            return (
              <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-200">
                <img
                  src={`https://picsum.photos/seed/${trend.id.slice(0, 8)}-${i}/300/400`}
                  alt="post"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <button className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-transform mb-5 shadow-md shadow-orange-500/20">
        🎥 इस ट्रेंड पर पोस्ट करें
      </button>

      {/* Timestamp */}
      <p className="text-xs text-gray-400 text-center pb-2">
        अपडेटेड: {new Date(trend.timestamp).toLocaleString('hi-IN')}
      </p>
    </div>
  );
}
