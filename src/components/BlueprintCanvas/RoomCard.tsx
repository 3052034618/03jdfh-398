import { memo } from 'react';
import type { Room, RoomStatus } from '@/types';
import { Lock, Eye, RefreshCw, Home } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  storyCount: number;
  gameplayCount: number;
  audioCount: number;
  onClick: () => void;
  style: React.CSSProperties;
}

const statusConfig: Record<RoomStatus, { label: string; icon: React.ReactNode; className: string }> = {
  locked: { label: '封锁', icon: <Lock size={12} />, className: 'status-locked' },
  explorable: { label: '可探索', icon: <Eye size={12} />, className: 'status-explorable' },
  second_run: { label: '二周目', icon: <RefreshCw size={12} />, className: 'status-secondrun' },
  normal: { label: '普通', icon: <Home size={12} />, className: 'status-normal' },
};

const RoomCard = memo(function RoomCard({
  room,
  isSelected,
  storyCount,
  gameplayCount,
  audioCount,
  onClick,
  style,
}: RoomCardProps) {
  const cfg = statusConfig[room.status];

  return (
    <div
      onClick={onClick}
      style={style}
      className={`
        absolute cursor-pointer rounded-lg border-2 transition-all duration-300
        ${cfg.className}
        ${isSelected ? 'animate-pulse-red ring-2 ring-horror-accent scale-105 z-20' : 'hover:scale-[1.02] hover:z-10'}
        burned-edge overflow-hidden group
      `}
    >
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />

      <div className="relative h-full flex flex-col p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-cinzel text-sm font-semibold text-white tracking-wide truncate">
            {room.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-white/80 px-2 py-0.5 rounded bg-black/30">
            {cfg.icon}
            <span>{cfg.label}</span>
          </div>
        </div>

        <p className="text-xs text-horror-muted line-clamp-2 mb-auto leading-relaxed">
          {room.description}
        </p>

        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1 text-xs text-horror-muted group-hover:text-red-400 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>剧情 {storyCount}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-horror-muted group-hover:text-green-400 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>玩法 {gameplayCount}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-horror-muted group-hover:text-purple-400 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>音效 {audioCount}</span>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-horror-glow" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-horror-glow" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-horror-glow" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-horror-glow" />
        </div>
      )}
    </div>
  );
});

export default RoomCard;
