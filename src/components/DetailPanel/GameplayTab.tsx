import { useState } from 'react';
import type { GameplayMarker, GameplayMarkerType } from '@/types';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import { Plus, Trash2, Edit2, Check, X, Lock, Key, Zap, Shield, Link } from 'lucide-react';

interface GameplayTabProps {
  roomId: string;
}

const markerConfig: Record<GameplayMarkerType, { label: string; icon: React.ReactNode; color: string }> = {
  door_lock: { label: '门锁', icon: <Lock size={14} />, color: 'text-red-400 border-red-500/40 bg-red-500/10' },
  key: { label: '钥匙', icon: <Key size={14} />, color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' },
  chase_trigger: { label: '追逐触发', icon: <Zap size={14} />, color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' },
  hiding_spot: { label: '藏身点', icon: <Shield size={14} />, color: 'text-green-400 border-green-500/40 bg-green-500/10' },
};

const GameplayTab = ({ roomId }: GameplayTabProps) => {
  const { gameplayMarkers, rooms, addGameplayMarker, updateGameplayMarker, removeGameplayMarker } = useBlueprintStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<GameplayMarkerType>('door_lock');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const roomMarkers = gameplayMarkers.filter((m) => m.roomId === roomId);

  const startEdit = (marker: GameplayMarker) => {
    setEditingId(marker.id);
    setEditDesc(marker.description);
  };

  const saveEdit = (markerId: string) => {
    updateGameplayMarker(markerId, { description: editDesc });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addGameplayMarker(roomId, {
      type: newType,
      name: newName.trim(),
      description: newDesc.trim(),
    });
    setNewName('');
    setNewDesc('');
    setNewType('door_lock');
    setIsAdding(false);
  };

  const getLinkedRoomName = (linkedId: string | undefined) => {
    if (!linkedId) return null;
    const linkedMarker = gameplayMarkers.find((m) => m.id === linkedId);
    if (linkedMarker) {
      const room = rooms.find((r) => r.id === linkedMarker.roomId);
      return room ? `${room.name} - ${linkedMarker.name}` : null;
    }
    const room = rooms.find((r) => r.id === linkedId);
    return room?.name || null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-horror-muted">玩法标记 · 共 {roomMarkers.length} 个</span>
        <button
          onClick={() => setIsAdding(true)}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded text-horror-accent hover:bg-horror-accent/10 transition-colors"
        >
          <Plus size={12} /> 添加标记
        </button>
      </div>

      {isAdding && (
        <div className="horror-card p-3 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-horror-muted">类型:</span>
            <div className="flex gap-1 flex-wrap">
              {(Object.keys(markerConfig) as GameplayMarkerType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`text-xs px-2 py-1 rounded border flex items-center gap-1 transition-all ${
                    newType === t ? markerConfig[t].color : 'border-horror-border text-horror-muted hover:border-horror-accent/40'
                  }`}
                >
                  {markerConfig[t].icon}
                  {markerConfig[t].label}
                </button>
              ))}
            </div>
          </div>
          <input
            className="horror-input text-sm"
            placeholder="标记名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <textarea
            className="horror-textarea text-sm"
            rows={2}
            placeholder="描述与玩法说明..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="horror-btn-ghost flex items-center gap-1">
              <X size={12} /> 取消
            </button>
            <button onClick={handleAdd} className="horror-btn-primary flex items-center gap-1">
              <Check size={12} /> 添加
            </button>
          </div>
        </div>
      )}

      {roomMarkers.map((marker) => {
        const cfg = markerConfig[marker.type];
        const isEditing = editingId === marker.id;
        const linkedName = getLinkedRoomName(marker.linkedTo);

        return (
          <div key={marker.id} className="horror-card p-3 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${cfg.color}`}>
                  {cfg.icon}
                  {cfg.label}
                </span>
                <span className="text-sm text-white font-medium">{marker.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {!isEditing && (
                  <button
                    onClick={() => startEdit(marker)}
                    className="p-1 rounded text-horror-muted hover:text-white hover:bg-horror-surface2 transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
                <button
                  onClick={() => removeGameplayMarker(marker.id)}
                  className="p-1 rounded text-horror-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="删除"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  className="horror-textarea text-sm"
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="horror-btn-ghost flex items-center gap-1">
                    <X size={12} /> 取消
                  </button>
                  <button onClick={() => saveEdit(marker.id)} className="horror-btn-primary flex items-center gap-1">
                    <Check size={12} /> 保存
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-horror-text leading-relaxed">{marker.description}</p>
            )}

            {linkedName && (
              <div className="mt-2 flex items-center gap-1 text-xs text-cyan-400">
                <Link size={10} />
                <span>关联: {linkedName}</span>
              </div>
            )}
          </div>
        );
      })}

      {roomMarkers.length === 0 && !isAdding && (
        <div className="text-center py-8 text-horror-muted text-sm">
          暂无玩法标记，点击上方"添加标记"开始设计
        </div>
      )}
    </div>
  );
};

export default GameplayTab;
