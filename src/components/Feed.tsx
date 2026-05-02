import { useTrending } from '../hooks/useTrending';
import { useBottomSheet } from '../hooks/useBottomSheet';
import TrendCard from './TrendCard';
import TrendDetail from './TrendDetail';
import BottomSheet from './BottomSheet';
import SkeletonLoader from './SkeletonLoader';
import ErrorState from './ErrorState';
import { MapPin, ChevronDown, RefreshCw, Home, Search, PlusCircle, Bell, User, Flame } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import '../styles/animations.css';

export default function Feed() {
  const { response, loading, error, refreshing, refresh } = useTrending();
  const { isOpen, selectedId, open, close } = useBottomSheet();
  const selectedTrend = response?.data.find((t) => t.id === selectedId);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/sharechat-logo.png" alt="ShareChat" className="w-10 h-10 rounded-xl shadow-md" />
            <div>
              <span className="font-bold text-gray-900 text-lg leading-none block">ShareChat</span>
              <span className="text-xs text-gray-500 font-semibold">Trending</span>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-bold text-gray-600 border border-gray-200">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            🇮🇳 भारत
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Pull to refresh */}
      {refreshing && (
        <div className="flex items-center justify-center py-3 bg-gray-100">
          <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
        </div>
      )}

      {/* Section Title */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">
              🔥 आज क्या ट्रेंड कर रहा है
            </h1>
            <p className="text-xs text-gray-500 font-semibold">
              {response?.isMockData ? 'डेमो डेटा दिखाया जा रहा है' : 'लाइव अपडेट्स · टॉप 15 ट्रेंड्स'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-28">
        {loading && !refreshing ? (
          <SkeletonLoader count={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : (
          <div className="space-y-4">
            {response?.data.map((trend, index) => (
              <div key={trend.id} style={{ animationDelay: `${index * 80}ms` }}>
                <TrendCard trend={trend} onClick={() => open(trend.id)} />
              </div>
            ))}
          </div>
        )}

        {response?.lastUpdated && (
          <p className="text-center text-xs text-gray-400 py-5 font-medium">
            आखिरी अपडेट: {new Date(response.lastUpdated).toLocaleTimeString('hi-IN')}
          </p>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 max-w-[420px] mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-orange-500">
            <Home className="w-6 h-6" strokeWidth={2.5} />
            <span className="text-[10px] font-bold">होम</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-400">
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-medium">खोजें</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-400 relative">
            <div className="w-12 h-12 -mt-6 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 border-4 border-white">
              <PlusCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-medium">पोस्ट</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-400">
            <Bell className="w-6 h-6" />
            <span className="text-[10px] font-medium">अलर्ट</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-400">
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium">प्रोफाइल</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <BottomSheet isOpen={isOpen} onClose={close}>
            {selectedTrend ? <TrendDetail trend={selectedTrend} /> : <SkeletonLoader count={3} />}
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}
