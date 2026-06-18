import { memo, useMemo } from 'react';
import type { Room } from '@/types';
import { X } from 'lucide-react';

interface ConnectionLineProps {
  fromRoom: Room;
  toRoom: Room;
  onRemove: () => void;
}

const ConnectionLine = memo(function ConnectionLine({ fromRoom, toRoom, onRemove }: ConnectionLineProps) {
  const { path, midpoint } = useMemo(() => {
    const x1 = fromRoom.x + fromRoom.width / 2;
    const y1 = fromRoom.y + fromRoom.height / 2;
    const x2 = toRoom.x + toRoom.width / 2;
    const y2 = toRoom.y + toRoom.height / 2;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const offset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.2;
    const cpX = midX + (Math.abs(dy) > Math.abs(dx) ? (dx > 0 ? offset : -offset) : 0);
    const cpY = midY + (Math.abs(dx) >= Math.abs(dy) ? (dy > 0 ? offset : -offset) : 0);

    return {
      path: `M ${x1} ${y1} C ${cpX} ${y1}, ${cpX} ${y2}, ${x2} ${y2}`,
      midpoint: { x: midX, y: midY },
    };
  }, [fromRoom, toRoom]);

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="rgba(139, 26, 26, 0.15)"
        strokeWidth="10"
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(139, 26, 26, 0.35)"
        strokeWidth="2"
        strokeDasharray="8 4"
        className="animate-flicker"
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(176, 48, 48, 0.8)"
        strokeWidth="1"
        strokeDasharray="8 4"
      />
      <foreignObject
        x={midpoint.x - 12}
        y={midpoint.y - 12}
        width={24}
        height={24}
        className="overflow-visible"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="w-6 h-6 rounded-full bg-horror-surface/90 border border-horror-accent/60 text-horror-accent hover:bg-horror-accent hover:text-white opacity-0 hover:opacity-100 transition-all flex items-center justify-center group-hover:opacity-100 pointer-events-auto"
          style={{ pointerEvents: 'auto' }}
          title="移除连线"
        >
          <X size={12} />
        </button>
      </foreignObject>
    </g>
  );
});

export default ConnectionLine;
