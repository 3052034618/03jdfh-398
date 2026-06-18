import { useMemo, useRef, useCallback, useEffect } from 'react';
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
    updateRoom,
    connectingFromRoomId,
    setConnectingFrom,
    addConnection,
    removeConnection,
  } = useBlueprintStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    roomId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const currentRooms = useMemo(
    () => rooms.filter((r) => r.floorId === currentFloorId),
    [rooms, currentFloorId]
  );

  const isConnectMode = connectingFromRoomId !== null;
  const actualFromRoomId = connectingFromRoomId === 'pending-select' ? null : connectingFromRoomId;

  const connections = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ key: string; from: (typeof rooms)[0]; to: (typeof rooms)[0] }> = [];

    currentRooms.forEach((room) => {
      room.connections.forEach((connId) => {
        const key = [room.id, connId].sort().join('-');
        if (seen.has(key)) return;
        seen.add(key);
        const target = currentRooms.find((r) => r.id === connId);
        if (target) {
          result.push({ key, from: room, to: target });
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
      width: Math.max(maxX + 200, 1000),
      height: Math.max(maxY + 200, 700),
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

  const handleDragStart = useCallback(
    (roomId: string, e: React.MouseEvent) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;
      const scrollContainer = canvasRef.current;
      const scrollLeft = scrollContainer?.scrollLeft || 0;
      const scrollTop = scrollContainer?.scrollTop || 0;

      dragStateRef.current = {
        roomId,
        startX: e.clientX + scrollLeft / zoom,
        startY: e.clientY + scrollTop / zoom,
        origX: room.x,
        origY: room.y,
      };
      e.preventDefault();
    },
    [rooms, zoom]
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragStateRef.current) return;
      const scrollContainer = canvasRef.current;
      const scrollLeft = scrollContainer?.scrollLeft || 0;
      const scrollTop = scrollContainer?.scrollTop || 0;
      const { roomId, startX, startY, origX, origY } = dragStateRef.current;
      const dx = (e.clientX + scrollLeft / zoom - startX) / zoom;
      const dy = (e.clientY + scrollTop / zoom - startY) / zoom;
      const newX = Math.max(20, Math.round((origX + dx) / 20) * 20);
      const newY = Math.max(20, Math.round((origY + dy) / 20) * 20);
      updateRoom(roomId, { x: newX, y: newY });
    };

    const handleUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [zoom, updateRoom]);

  const handleRoomClick = useCallback(
    (roomId: string) => {
      if (isConnectMode) {
        if (!actualFromRoomId) {
          setConnectingFrom(roomId);
          return;
        }
        if (actualFromRoomId === roomId) {
          setConnectingFrom(null);
          return;
        }
        const existing = connections.find((c) =>
          (c.from.id === actualFromRoomId && c.to.id === roomId) ||
          (c.from.id === roomId && c.to.id === actualFromRoomId)
        );
        if (existing) {
          setConnectingFrom(null);
          return;
        }
        addConnection(actualFromRoomId, roomId);
        setConnectingFrom(null);
        return;
      }
      selectRoom(roomId);
    },
    [isConnectMode, actualFromRoomId, setConnectingFrom, addConnection, connections, selectRoom]
  );

  const emptyHint = currentRooms.length === 0;

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full overflow-auto bg-horror-bg ${isConnectMode ? 'cursor-crosshair' : ''}`}
      onClick={() => {
        if (isConnectMode && actualFromRoomId === null && connectingFromRoomId === 'pending-select') {
          setConnectingFrom(null);
        }
      }}
    >
      {isConnectMode && (
        <div className="sticky top-0 left-0 z-30 bg-cyan-500/10 backdrop-blur-sm border-b border-cyan-500/30 px-4 py-2 flex items-center justify-between">
          <div className="text-xs text-cyan-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            {connectingFromRoomId === 'pending-select'
              ? '连线模式：点击第一个房间作为起点'
              : '连线模式：点击第二个房间完成通路（再次点击起点可取消）'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConnectingFrom(null);
            }}
            className="text-xs px-3 py-1 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 transition-all"
          >
            退出连线模式
          </button>
        </div>
      )}

      <div
        className="relative origin-top-left transition-transform duration-200 group"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      >
        <div className="absolute inset-0 bg-grid-pattern grid-overlay opacity-60" />
        <div className="absolute inset-0 bg-noise opacity-[0.025] pointer-events-none" />

        {emptyHint && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="font-cinzel text-horror-muted text-lg mb-2">当前楼层暂无区域</p>
              <p className="text-xs text-horror-muted">点击左侧工具栏的「新增区域」按钮添加房间</p>
            </div>
          </div>
        )}

        <svg
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
          width={canvasSize.width}
          height={canvasSize.height}
        >
          <g style={{ pointerEvents: 'auto' }}>
            {connections.map(({ key, from, to }) => (
              <ConnectionLine
                key={key}
                fromRoom={from}
                toRoom={to}
                onRemove={() => removeConnection(from.id, to.id)}
              />
            ))}
          </g>
        </svg>

        {currentRooms.map((room, idx) => {
          const counts = countsMap[room.id] || { story: 0, gameplay: 0, audio: 0 };
          const alreadyConnected = actualFromRoomId
            ? !!connections.find((c) =>
                (c.from.id === actualFromRoomId && c.to.id === room.id) ||
                (c.from.id === room.id && c.to.id === actualFromRoomId)
              )
            : false;

          return (
            <div
              key={room.id}
              style={{
                animationDelay: `${idx * 60}ms`,
              }}
              className="animate-fade-in"
            >
              <RoomCard
                room={room}
                isSelected={selectedRoomId === room.id}
                isConnectingFrom={actualFromRoomId === room.id}
                isConnectMode={isConnectMode}
                canConnectTarget={
                  isConnectMode && actualFromRoomId !== null && actualFromRoomId !== room.id && !alreadyConnected
                }
                storyCount={counts.story}
                gameplayCount={counts.gameplay}
                audioCount={counts.audio}
                onClick={() => handleRoomClick(room.id)}
                onDragStart={(e) => handleDragStart(room.id, e)}
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
