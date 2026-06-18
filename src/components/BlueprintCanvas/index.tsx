import { useMemo } from 'react';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import RoomCard from './RoomCard';
import ConnectionLine from './ConnectionLine';

const BlueprintCanvas = () => {
  const {
    rooms,
    currentFloorId,
    selectedRoomId,
    selectRoom,
    storyNodes,
    gameplayMarkers,
    audioNodes,
    zoom,
  } = useBlueprintStore();

  const currentRooms = useMemo(
    () => rooms.filter((r) => r.floorId === currentFloorId),
    [rooms, currentFloorId]
  );

  const connections = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ from: typeof rooms[0]; to: typeof rooms[0] }> = [];

    currentRooms.forEach((room) => {
      room.connections.forEach((connId) => {
        const key = [room.id, connId].sort().join('-');
        if (seen.has(key)) return;
        seen.add(key);
        const target = currentRooms.find((r) => r.id === connId);
        if (target) {
          result.push({ from: room, to: target });
        }
      });
    });

    return result;
  }, [currentRooms]);

  const canvasSize = useMemo(() => {
    if (currentRooms.length === 0) return { width: 1000, height: 700 };
    const maxX = Math.max(...currentRooms.map((r) => r.x + r.width));
    const maxY = Math.max(...currentRooms.map((r) => r.y + r.height));
    return {
      width: Math.max(maxX + 120, 1000),
      height: Math.max(maxY + 120, 700),
    };
  }, [currentRooms]);

  const countsMap = useMemo(() => {
    const map: Record<string, { story: number; gameplay: number; audio: number }> = {};
    currentRooms.forEach((r) => {
      map[r.id] = {
        story: storyNodes.filter((n) => n.roomId === r.id).length,
        gameplay: gameplayMarkers.filter((m) => m.roomId === r.id).length,
        audio: audioNodes.filter((a) => a.roomId === r.id).length,
      };
    });
    return map;
  }, [currentRooms, storyNodes, gameplayMarkers, audioNodes]);

  return (
    <div className="relative w-full h-full overflow-auto bg-horror-bg">
      <div
        className="relative origin-top-left transition-transform duration-200"
        style={{
          transform: `scale(${zoom})`,
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      >
        <div
          className="absolute inset-0 bg-grid-pattern grid-overlay opacity-60"
        />
        <div className="absolute inset-0 bg-noise opacity-[0.025] pointer-events-none" />

        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasSize.width}
          height={canvasSize.height}
        >
          {connections.map(({ from, to }, idx) => (
            <ConnectionLine key={`conn-${idx}`} fromRoom={from} toRoom={to} />
          ))}
        </svg>

        {currentRooms.map((room, idx) => {
          const counts = countsMap[room.id] || { story: 0, gameplay: 0, audio: 0 };
          return (
            <div
              key={room.id}
              style={{
                animationDelay: `${idx * 80}ms`,
              }}
              className="animate-fade-in opacity-0"
            >
              <RoomCard
                room={room}
                isSelected={selectedRoomId === room.id}
                storyCount={counts.story}
                gameplayCount={counts.gameplay}
                audioCount={counts.audio}
                onClick={() => selectRoom(room.id)}
                style={{
                  left: room.x,
                  top: room.y,
                  width: room.width,
                  height: room.height,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BlueprintCanvas;
