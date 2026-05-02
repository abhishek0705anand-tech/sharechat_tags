export default function SkeletonLoader({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 shimmer-bg rounded-full" />
              <div className="h-4 w-12 shimmer-bg rounded" />
            </div>
            <div className="h-5 w-10 shimmer-bg rounded-full" />
          </div>
          <div className="h-5 w-3/4 shimmer-bg rounded mb-2" />
          <div className="h-4 w-full shimmer-bg rounded mb-2" />
          <div className="h-4 w-2/3 shimmer-bg rounded mb-4" />
          <div className="flex gap-2 mb-1">
            <div className="h-24 w-20 shimmer-bg rounded-xl" />
            <div className="h-24 w-20 shimmer-bg rounded-xl" />
            <div className="h-24 w-20 shimmer-bg rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
