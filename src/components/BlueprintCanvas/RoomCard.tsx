import { memo, useRef } from 'react';
import type { Room, RoomStatus } from '@/types';
import { Lock, Eye, RefreshCw, Home, Move, Link2 } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  isConnectingFrom: boolean;
  isConnectMode: boolean;
  canConnectTarget: boolean;
  storyCount: number;
  gameplayCount: number;
  audioCount: number;
  onClick: () => void;
  onDragStart: (e: React.MouseEvent) => void;
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
  isConnectingFrom,
  isConnectMode,
  canConnectTarget,
  storyCount,
  gameplayCount,
  audioCount,
  onClick,
  onDragStart,
  style,
}: RoomCardProps) {
  const cfg = statusConfig[room.status];
  const dragHandleRef = useRef<HTMLDivElement>(null);

  return (
    <div
      onClick={onClick}
      onMouseDown={(e) => {
        if (isConnectMode) return;
        const target = e.target as HTMLElement;
        if (target.closest('[data-drag-handle]')) {
          onDragStart(e);
        }
      }}
      style={style}
      className={`
        absolute cursor-pointer rounded-lg border-2 transition-all duration-200 select-none
        ${cfg.className}
        ${isSelected ? 'animate-pulse-red ring-2 ring-horror-accent scale-[1.03] z-20' : ''}
        ${!isConnectMode && !isSelected ? 'hover:scale-[1.015] hover:z-10' : ''}
        ${isConnectingFrom ? 'ring-2 ring-cyan-400 box-shadow-glow z-20 scale-[1.03]' : ''}
        ${canConnectTarget ? 'ring-2 ring-cyan-400/60 z-10 hover:ring-cyan-300' : ''}
        burned-edge overflow-hidden group
      `}
    >
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />

      <div className="relative h-full flex flex-col p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div
              data-drag-handle
              ref={dragHandleRef}
              className={`
                p-1 rounded shrink-0 cursor-grab active:cursor-grabbing transition-colors
                ${isConnectMode ? 'opacity-30 pointer-events-none' : 'text-horror-muted hover:text-white hover:bg-black/20'}
              `}
              title="拖动调整位置"
            >
              <Move size={12} />
            </div>
            <h3 className="font-cinzel text-sm font-semibold text-white tracking-wide truncate min-w-0">
              {room.name}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/80 px-2 py-0.5 rounded bg-black/30 shrink-0">
            {cfg.icon}
            <span>{cfg.label}</span>
          </div>
        </div>

        <p className="text-xs text-horror-muted line-clamp-2 mb-auto leading-relaxed pl-6">
          {room.description}
        </p>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-3 pl-6">
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
          {isConnectMode && (
            <div className="flex items-center gap-1 text-cyan-400 text-xs animate-pulse">
              <Link2 size={12} />
              <span>点击连线</span>
            </div>
          )}
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
      {isConnectingFrom && (
        <div className="absolute inset-0 pointer-events-none ring-2 ring-cyan-400 rounded-lg">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
        </div>
      )}
    </div>
  );
});

export default RoomCard;
