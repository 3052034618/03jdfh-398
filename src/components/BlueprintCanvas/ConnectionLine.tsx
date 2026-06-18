import { memo, useMemo } from 'react';
import type { Room } from '@/types';

interface ConnectionLineProps {
  fromRoom: Room;
  toRoom: Room;
}

const ConnectionLine = memo(function ConnectionLine({ fromRoom, toRoom }: ConnectionLineProps) {
  const path = useMemo(() => {
    const x1 = fromRoom.x + fromRoom.width / 2;
    const y1 = fromRoom.y + fromRoom.height / 2;
    const x2 = toRoom.x + toRoom.width / 2;
    const y2 = toRoom.y + toRoom.height / 2;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    return `M ${x1} ${y1} Q ${midX} ${y1} ${midX} ${midY} T ${x2} ${y2}`;
  }, [fromRoom, toRoom]);

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="rgba(139, 26, 26, 0.3)"
        strokeWidth="2"
        strokeDasharray="8 4"
        className="animate-flicker"
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(139, 26, 26, 0.6)"
        strokeWidth="1"
        strokeDasharray="8 4"
      />
    </g>
  );
});

export default ConnectionLine;
