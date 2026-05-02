import { TrendingTag } from '../types/trending';
import { formatPostCount } from '../api/trending';
import HeatScore from './HeatScore';
import CategoryBadge from './CategoryBadge';
import { Radio, FileText, Play, Heart, MessageCircle, Share2 } from 'lucide-react';

interface TrendCardProps {
  trend: TrendingTag;
  onClick: () => void;
}

function MockReel({ seed, likes }: { seed: string; likes: string }) {
  return (
    <div className="flex-shrink-0 w-28 rounded-xl overflow-hidden relative bg-gray-200">
      <img
        src={`https://picsum.photos/seed/${seed}/280/420`}
        alt="reel"
        className="w-full h-full object-cover aspect-[2/3]"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const fallback = document.createElement('div');
            fallback.className = 'w-full h-full aspect-[2/3] flex items-center justify-center bg-gradient-to-br from-orange-400 to-pink-500';
            fallback.innerHTML = '<svg class="w-8 h-8 text-white/80" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
            parent.appendChild(fallback);
          }
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <div className="flex items-center gap-1 text-white text-[10px]">
          <Heart className="w-3 h-3 fill-white" />
          <span>{likes}</span>
        </div>
      </div>
    </div>
  );
}

export default function TrendCard({ trend, onClick }: TrendCardProps) {
  const reelCount = 3 + (trend.rank % 2);
  const reels = Array.from({ length: reelCount }).map((_, i) => ({
    seed: `${trend.id.slice(0, 8)}${i}`,
    likes: `${(Math.random() * 90 + 10).toFixed(1)}K`,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Main Card Header */}
      <div onClick={onClick} className="p-4 cursor-pointer active:scale-[0.99] transition-transform">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold shadow-sm">
              {trend.rank}
            </span>
            <HeatScore score={trend.heatScore} isFresh={trend.isFresh} />
          </div>
          {trend.isFresh && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-[10px] font-bold text-red-500 uppercase tracking-wide">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              लाइव
            </span>
          )}
        </div>

        {/* Hashtag */}
        <p className="text-orange-500 font-bold text-sm mb-1 tracking-wide">{trend.hashtag}</p>

        {/* Hindi Title */}
        <h3 className="text-gray-900 font-bold text-[17px] leading-snug mb-1.5">
          {trend.titleHi}
        </h3>

        {/* Hindi Description */}
        <p className="text-gray-500 text-[13px] leading-relaxed mb-3 line-clamp-2">
          {trend.descriptionHi}
        </p>

        {/* Bottom Row */}
        <div className="flex items-center justify-between">
          <CategoryBadge category={trend.category} />
          <div className="flex items-center gap-3">
            {trend.engagement.postsCount && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <FileText className="w-3 h-3" />
                {formatPostCount(trend.engagement.postsCount)}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <MessageCircle className="w-3 h-3" />
              {formatPostCount(Math.floor((trend.engagement.postsCount || 0) * 0.15))}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Share2 className="w-3 h-3" />
              {formatPostCount(Math.floor((trend.engagement.postsCount || 0) * 0.05))}
            </span>
          </div>
        </div>
      </div>

      {/* Reels Carousel */}
      <div className="px-4 pb-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          🔥 इस ट्रेंड पर पोस्ट
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {reels.map((reel, i) => (
            <MockReel key={i} seed={reel.seed} likes={reel.likes} />
          ))}
          <div className="flex-shrink-0 w-28 rounded-xl border-2 border-dashed border-gray-200 aspect-[2/3] flex flex-col items-center justify-center gap-1 bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Play className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-orange-500">+ अपना पोस्ट</span>
          </div>
        </div>
      </div>
    </div>
  );
}
