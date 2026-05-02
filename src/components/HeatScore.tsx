import { Flame } from 'lucide-react';

interface HeatScoreProps {
  score: number;
  isFresh?: boolean;
}

export default function HeatScore({ score, isFresh }: HeatScoreProps) {
  const getColor = () => {
    if (score >= 85) return 'text-red-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className={`flex items-center gap-1 font-bold text-sm ${getColor()} ${isFresh ? 'animate-pulse' : ''}`}>
      <Flame className="w-4 h-4" fill="currentColor" />
      <span>{score}</span>
    </div>
  );
}
