import { useState } from 'react';
import type { GameplayMarker, GameplayMarkerType } from '@/types';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import { Plus, Trash2, Edit2, Check, X, Lock, Key, Zap, Shield, Link, Volume2, Ruler, Gauge, Repeat } from 'lucide-react';

interface GameplayTabProps {
  roomId: string;
}

const markerConfig: Record<GameplayMarkerType, { label: string; icon: React.ReactNode; color: string; linkArrow: string }> = {
  door_lock: { label: '门锁', icon: <Lock size={14} />, color: 'text-red-400 border-red-500/40 bg-red-500/10', linkArrow: '←' },
  key: { label: '钥匙', icon: <Key size={14} />, color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10', linkArrow: '→' },
  chase_trigger: { label: '追逐触发', icon: <Zap size={14} />, color: 'text-orange-400 border-orange-500/40 bg-orange-500/10', linkArrow: '→' },
  hiding_spot: { label: '藏身点', icon: <Shield size={14} />, color: 'text-green-400 border-green-500/40 bg-green-500/10', linkArrow: '→' },
};

const GameplayTab = ({ roomId }: GameplayTabProps) => {
  const {
    gameplayMarkers,
    rooms,
    audioNodes,
    storyNodes,
    addGameplayMarker,
    updateGameplayMarker,
    removeGameplayMarker,
  } = useBlueprintStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editLinkedTo, setEditLinkedTo] = useState<string | undefined>(undefined);

  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<GameplayMarkerType>('door_lock');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLinkedTo, setNewLinkedTo] = useState<string | undefined>(undefined);

  const roomMarkers = gameplayMarkers.filter((m) => m.roomId === roomId);

  const getMarkersForLinking = (currentType: GameplayMarkerType, excludeId?: string) => {
    const targetType = currentType === 'key' ? 'door_lock' : currentType === 'door_lock' ? 'key' : null;
    if (!targetType) return [];
    return gameplayMarkers
      .filter((m) => m.type === targetType && m.id !== excludeId)
      .map((m) => {
        const room = rooms.find((r) => r.id === m.roomId);
        return {
          id: m.id,
          label: `${room?.name || '未知房间'} · ${m.name}`,
        };
      });
  };

  const getLinkedMarkerInfo = (linkedId: string | undefined) => {
    if (!linkedId) return null;
    const linkedMarker = gameplayMarkers.find((m) => m.id === linkedId);
    if (!linkedMarker) return null;
    const room = rooms.find((r) => r.id === linkedMarker.roomId);
    const cfg = markerConfig[linkedMarker.type];
    return {
      marker: linkedMarker,
      roomName: room?.name || '未知房间',
      cfg,
    };
  };

  const attachedAudiosFor = (markerId: string) =>
    audioNodes.filter((a) => a.attachedTo?.type === 'gameplay' && a.attachedTo.id === markerId);

  const triggerTypeLabel = (type: string) => {
    const map: Record<string, string> = { enter: '进入时', investigate: '调查时', leave: '离开时' };
    return map[type] || type;
  };

  const startEdit = (marker: GameplayMarker) => {
    setEditingId(marker.id);
    setEditDesc(marker.description);
    setEditLinkedTo(marker.linkedTo);
  };

  const saveEdit = (markerId: string) => {
    updateGameplayMarker(markerId, {
      description: editDesc,
      linkedTo: editLinkedTo,
    });
    setEditingId(null);
    setEditLinkedTo(undefined);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addGameplayMarker(roomId, {
      type: newType,
      name: newName.trim(),
      description: newDesc.trim(),
      linkedTo: newLinkedTo,
    });
    setNewName('');
    setNewDesc('');
    setNewType('door_lock');
    setNewLinkedTo(undefined);
    setIsAdding(false);
  };

  const renderAudiosBlock = (audios: ReturnType<typeof attachedAudiosFor>) => {
    if (audios.length === 0) return null;
    return (
      <div className="mt-2 rounded border border-purple-500/20 bg-purple-500/5 p-2 space-y-1.5">
        <div className="text-[10px] text-purple-400 font-medium flex items-center gap-1">
          <Volume2 size={10} /> 挂载音效 ({audios.length})
        </div>
        {audios.map((a) => (
          <div key={a.id} className="text-[11px] text-horror-text bg-horror-surface/60 rounded px-2 py-1.5 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-purple-300 font-medium">{a.name}</span>
              <span className="text-horror-muted">{Math.round(a.volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-horror-muted flex-wrap">
              <span className="flex items-center gap-0.5">
                <Ruler size={9} /> {a.triggerDistance}m
              </span>
              {a.loop && (
                <span className="flex items-center gap-0.5 text-green-400">
                  <Repeat size={9} /> 循环
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLinkSection = (
    type: GameplayMarkerType,
    value: string | undefined,
    onChange: (v: string | undefined) => void,
    markerId?: string,
  ) => {
    const options = getMarkersForLinking(type, markerId);
    const showLinker = type === 'key' || type === 'door_lock';
    if (!showLinker) return null;
    return (
      <div>
        <label className="text-xs text-horror-muted flex items-center gap-1 mb-1">
          <Link size={10} className="text-cyan-400" />
          {type === 'key' ? '关联的门锁' : '关联的钥匙'}
        </label>
        <select
          className="horror-input text-xs py-1 w-full"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">—— 暂不关联 ——</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        {options.length === 0 && (
          <p className="text-[10px] text-horror-muted mt-1 opacity-70">
            （请先在其他房间创建{type === 'key' ? '门锁' : '钥匙'}标记）
          </p>
        )}
      </div>
    );
  };

  const renderPuzzleChain = (marker: GameplayMarker) => {
    const info = getLinkedMarkerInfo(marker.linkedTo);
    if (!info) return null;
    const curCfg = markerConfig[marker.type];
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[11px] rounded border border-cyan-500/20 bg-cyan-500/5 px-2 py-1.5 flex-wrap">
        <span className={`flex items-center gap-1 ${curCfg.color} rounded px-1.5 py-0.5`}>
          {curCfg.icon} {marker.name}
        </span>
        <Link size={10} className="text-cyan-400 shrink-0" />
        <span className={`flex items-center gap-1 ${info.cfg.color} rounded px-1.5 py-0.5`}>
          {info.cfg.icon} {info.marker.name}
        </span>
        <span className="text-horror-muted text-[10px]">（{info.roomName}）</span>
      </div>
    );
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
        <div className="horror-card p-3 space-y-2.5 animate-fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-horror-muted">类型:</span>
            <div className="flex gap-1 flex-wrap">
              {(Object.keys(markerConfig) as GameplayMarkerType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setNewType(t); setNewLinkedTo(undefined); }}
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
          {renderLinkSection(newType, newLinkedTo, setNewLinkedTo)}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setIsAdding(false); setNewLinkedTo(undefined); }} className="horror-btn-ghost flex items-center gap-1">
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
        const attachedAudios = attachedAudiosFor(marker.id);

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
                {renderLinkSection(marker.type, editLinkedTo, setEditLinkedTo, marker.id)}
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setEditingId(null); setEditLinkedTo(undefined); }} className="horror-btn-ghost flex items-center gap-1">
                    <X size={12} /> 取消
                  </button>
                  <button onClick={() => saveEdit(marker.id)} className="horror-btn-primary flex items-center gap-1">
                    <Check size={12} /> 保存
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-horror-text leading-relaxed">{marker.description}</p>
                {renderPuzzleChain(marker)}
                {renderAudiosBlock(attachedAudios)}
              </>
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
