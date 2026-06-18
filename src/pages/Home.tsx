import { useState } from 'react';
import Header from '@/components/Header';
import Toolbar from '@/components/Toolbar';
import BlueprintCanvas from '@/components/BlueprintCanvas';
import DetailPanel from '@/components/DetailPanel';
import ReviewPanel from '@/components/ReviewPanel';
import PuzzleInspector from '@/components/PuzzleInspector';
import Modal from '@/components/ui/Modal';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import type { RoomStatus } from '@/types';
import { Check, X } from 'lucide-react';

const statusOptions: { value: RoomStatus; label: string; desc: string }[] = [
  { value: 'normal', label: '普通', desc: '常规区域' },
  { value: 'explorable', label: '可探索', desc: '初始即可进入' },
  { value: 'locked', label: '封锁', desc: '需要条件解锁' },
  { value: 'second_run', label: '二周目变化', desc: '二周目才解锁或改变' },
];

const Home = () => {
  const {
    showAddFloorModal,
    setShowAddFloorModal,
    showAddRoomModal,
    setShowAddRoomModal,
    addFloor,
    addRoom,
    currentFloorId,
    floors,
    rooms,
  } = useBlueprintStore();

  const [floorName, setFloorName] = useState('');
  const [floorLevel, setFloorLevel] = useState(3);

  const [roomName, setRoomName] = useState('');
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('explorable');
  const [roomDesc, setRoomDesc] = useState('');

  const nextFloorLevel = (() => {
    if (floors.length === 0) return 1;
    const maxF = Math.max(...floors.map((f) => f.floorLevel));
    return maxF + 1;
  })();

  const resetFloorForm = () => {
    setFloorName('');
    setFloorLevel(nextFloorLevel);
  };

  const resetRoomForm = () => {
    setRoomName('');
    setRoomStatus('explorable');
    setRoomDesc('');
  };

  const currentFloorRooms = rooms.filter((r) => r.floorId === currentFloorId);
  const suggestedX = currentFloorRooms.length > 0
    ? Math.max(...currentFloorRooms.map((r) => r.x + r.width)) + 80
    : 100;
  const suggestedY = currentFloorRooms.length > 0
    ? 100 + (currentFloorRooms.length % 3) * 40
    : 100;

  const handleCreateFloor = () => {
    if (!floorName.trim()) return;
    addFloor(floorName.trim(), floorLevel);
    resetFloorForm();
    setShowAddFloorModal(false);
  };

  const handleCreateRoom = () => {
    if (!roomName.trim() || !currentFloorId) return;
    addRoom({
      name: roomName.trim(),
      status: roomStatus,
      description: roomDesc.trim() || `这是「${roomName.trim()}」。`,
      floorId: currentFloorId,
      x: suggestedX,
      y: suggestedY,
      width: 200,
      height: 140,
    });
    resetRoomForm();
    setShowAddRoomModal(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-horror-bg overflow-hidden">
      <Header />
      <div className="flex-1 flex min-h-0">
        <Toolbar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <BlueprintCanvas />
          <ReviewPanel />
        </div>
        <DetailPanel />
      </div>

      <Modal
        open={showAddFloorModal}
        onClose={() => {
          setShowAddFloorModal(false);
          resetFloorForm();
        }}
        title="新增楼层"
        footer={
          <>
            <button
              onClick={() => {
                setShowAddFloorModal(false);
                resetFloorForm();
              }}
              className="horror-btn-ghost flex items-center gap-1"
            >
              <X size={12} /> 取消
            </button>
            <button
              onClick={handleCreateFloor}
              disabled={!floorName.trim()}
              className="horror-btn-primary flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={12} /> 创建楼层
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-horror-muted mb-1">楼层名称</label>
            <input
              className="horror-input text-sm"
              placeholder="如：三楼、阁楼、地下二层..."
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-horror-muted mb-1">楼层编号（1=一楼，2=二楼，-1=地下室）</label>
            <input
              type="number"
              className="horror-input text-sm"
              value={floorLevel}
              onChange={(e) => setFloorLevel(Number(e.target.value))}
            />
            <p className="text-[10px] text-horror-muted mt-1">
              建议按真实建筑填写，便于区分地上/地下层级
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={showAddRoomModal}
        onClose={() => {
          setShowAddRoomModal(false);
          resetRoomForm();
        }}
        title="新增房间区域"
        footer={
          <>
            <button
              onClick={() => {
                setShowAddRoomModal(false);
                resetRoomForm();
              }}
              className="horror-btn-ghost flex items-center gap-1"
            >
              <X size={12} /> 取消
            </button>
            <button
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || !currentFloorId}
              className="horror-btn-primary flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={12} /> 创建并放置
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-horror-muted mb-1">房间名称</label>
            <input
              className="horror-input text-sm"
              placeholder="如：客厅、儿童房、祭坛室..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-horror-muted mb-2">区域状态</label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRoomStatus(opt.value)}
                  className={`text-left p-2 rounded border text-sm transition-all ${
                    roomStatus === opt.value
                      ? 'border-horror-accent bg-horror-accent/10 text-white'
                      : 'border-horror-border bg-horror-surface2 text-horror-muted hover:border-horror-accent/40'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-horror-muted mb-1">区域描述（可选）</label>
            <textarea
              rows={3}
              className="horror-textarea text-sm"
              placeholder="描述这个房间给人的第一印象、关键视觉元素..."
              value={roomDesc}
              onChange={(e) => setRoomDesc(e.target.value)}
            />
          </div>
          {currentFloorId && (
            <p className="text-[10px] text-horror-muted text-right">
              创建后将出现在当前楼层画布上，可拖拽调整位置
            </p>
          )}
        </div>
      </Modal>

      <PuzzleInspector />
    </div>
  );
};

export default Home;
