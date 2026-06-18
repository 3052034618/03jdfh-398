import { useState } from 'react';
import type { AudioNode, AudioAttachTarget } from '@/types';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import {
  Plus, Trash2, Edit2, Check, X, Volume2, Repeat, Ruler, Gauge,
  BookOpen, Gamepad2, Unlink, Link,
} from 'lucide-react';

interface AudioTabProps {
  roomId: string;
}

const AudioTab = ({ roomId }: AudioTabProps) => {
  const {
    audioNodes,
    storyNodes,
    gameplayMarkers,
    rooms,
    addAudioNode,
    updateAudioNode,
    removeAudioNode,
  } = useBlueprintStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDistance, setEditDistance] = useState(0);
  const [editVolume, setEditVolume] = useState(0.3);
  const [editLoop, setEditLoop] = useState(false);
  const [editAttachType, setEditAttachType] = useState<'none' | 'story' | 'gameplay'>('none');
  const [editAttachId, setEditAttachId] = useState<string>('');

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDistance, setNewDistance] = useState(3);
  const [newVolume, setNewVolume] = useState(0.3);
  const [newLoop, setNewLoop] = useState(false);
  const [newAttachType, setNewAttachType] = useState<'none' | 'story' | 'gameplay'>('none');
  const [newAttachId, setNewAttachId] = useState<string>('');

  const roomAudio = audioNodes.filter((a) => a.roomId === roomId);
  const roomStories = storyNodes.filter((s) => s.roomId === roomId);
  const roomGameplays = gameplayMarkers.filter((g) => g.roomId === roomId);

  const triggerTypeLabel = (type: string) => {
    const map: Record<string, string> = { enter: '进入时', investigate: '调查时', leave: '离开时' };
    return map[type] || type;
  };

  const gameplayTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      door_lock: '门锁', key: '钥匙', chase_trigger: '追逐触发', hiding_spot: '藏身点',
    };
    return map[type] || type;
  };

  const buildAttachTarget = (
    type: 'none' | 'story' | 'gameplay',
    id: string,
  ): AudioAttachTarget => {
    if (type === 'none' || !id) return null;
    return { type, id };
  };

  const parseAttachTarget = (
    attachedTo: AudioAttachTarget,
  ): { type: 'none' | 'story' | 'gameplay'; id: string } => {
    if (!attachedTo) return { type: 'none', id: '' };
    return { type: attachedTo.type, id: attachedTo.id };
  };

  const startEdit = (node: AudioNode) => {
    setEditingId(node.id);
    setEditName(node.name);
    setEditDesc(node.description);
    setEditDistance(node.triggerDistance);
    setEditVolume(node.volume);
    setEditLoop(node.loop);
    const parsed = parseAttachTarget(node.attachedTo || null);
    setEditAttachType(parsed.type);
    setEditAttachId(parsed.id);
  };

  const saveEdit = (nodeId: string) => {
    updateAudioNode(nodeId, {
      name: editName,
      description: editDesc,
      triggerDistance: editDistance,
      volume: editVolume,
      loop: editLoop,
      attachedTo: buildAttachTarget(editAttachType, editAttachId),
    });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addAudioNode(roomId, {
      name: newName.trim(),
      description: newDesc.trim(),
      triggerDistance: newDistance,
      volume: newVolume,
      loop: newLoop,
      attachedTo: buildAttachTarget(newAttachType, newAttachId),
    });
    setNewName('');
    setNewDesc('');
    setNewDistance(3);
    setNewVolume(0.3);
    setNewLoop(false);
    setNewAttachType('none');
    setNewAttachId('');
    setIsAdding(false);
  };

  const getAttachDisplay = (attachedTo: AudioAttachTarget) => {
    if (!attachedTo) return null;
    if (attachedTo.type === 'story') {
      const node = storyNodes.find((s) => s.id === attachedTo.id);
      if (!node) return { label: '（节点已删除）', type: 'story' as const, icon: <BookOpen size={10} /> };
      const preview = node.content.slice(0, 12) + (node.content.length > 12 ? '...' : '');
      return {
        label: `${triggerTypeLabel(node.triggerType)} · ${preview}`,
        type: 'story' as const,
        icon: <BookOpen size={10} />,
      };
    } else {
      const marker = gameplayMarkers.find((g) => g.id === attachedTo.id);
      if (!marker) return { label: '（标记已删除）', type: 'gameplay' as const, icon: <Gamepad2 size={10} /> };
      const room = rooms.find((r) => r.id === marker.roomId);
      return {
        label: `${gameplayTypeLabel(marker.type)} · ${marker.name}${room ? `（${room.name}）` : ''}`,
        type: 'gameplay' as const,
        icon: <Gamepad2 size={10} />,
      };
    }
  };

  const renderAttachInfo = (attachedTo: AudioAttachTarget) => {
    const info = getAttachDisplay(attachedTo);
    if (!info) return null;
    return (
      <div className={`mt-2 text-[11px] flex items-center gap-1 px-2 py-1 rounded border ${
        info.type === 'story'
          ? 'border-blue-500/20 bg-blue-500/5 text-blue-300'
          : 'border-cyan-500/20 bg-cyan-500/5 text-cyan-300'
      }`}>
        {info.icon}
        <span>挂载于: {info.label}</span>
      </div>
    );
  };

  const renderParams = (distance: number, volume: number, loop: boolean) => (
    <div className="flex items-center gap-3 text-xs text-horror-muted mt-2 flex-wrap">
      <div className="flex items-center gap-1">
        <Ruler size={10} className="text-purple-400" />
        <span>{distance}m 触发</span>
      </div>
      <div className="flex items-center gap-1">
        <Gauge size={10} className="text-blue-400" />
        <span>音量 {Math.round(volume * 100)}%</span>
      </div>
      <div className={`flex items-center gap-1 ${loop ? 'text-green-400' : ''}`}>
        <Repeat size={10} />
        <span>{loop ? '循环' : '单次'}</span>
      </div>
    </div>
  );

  const renderAttachSelector = (
    attachType: 'none' | 'story' | 'gameplay',
    setAttachType: (v: 'none' | 'story' | 'gameplay') => void,
    attachId: string,
    setAttachId: (v: string) => void,
  ) => (
    <div className="space-y-1.5 pt-1 border-t border-horror-border">
      <label className="text-xs text-horror-muted flex items-center gap-1">
        <Link size={10} /> 挂载目标
      </label>
      <div className="flex gap-1 flex-wrap">
        {[
          { value: 'none' as const, label: '无（全局房间）', icon: <Unlink size={10} /> },
          { value: 'story' as const, label: '剧情节点', icon: <BookOpen size={10} /> },
          { value: 'gameplay' as const, label: '玩法标记', icon: <Gamepad2 size={10} /> },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setAttachType(opt.value); setAttachId(''); }}
            className={`text-[11px] px-2 py-1 rounded border flex items-center gap-1 transition-all ${
              attachType === opt.value
                ? opt.value === 'story'
                  ? 'border-blue-500/40 text-blue-300 bg-blue-500/10'
                  : opt.value === 'gameplay'
                    ? 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10'
                    : 'border-horror-border text-white bg-horror-surface2'
                : 'border-horror-border text-horror-muted hover:border-horror-accent/40'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
      {attachType === 'story' && (
        <select
          className="horror-input text-xs py-1 w-full"
          value={attachId}
          onChange={(e) => setAttachId(e.target.value)}
        >
          <option value="">—— 请选择剧情节点 ——</option>
          {roomStories.map((s) => (
            <option key={s.id} value={s.id}>
              [{triggerTypeLabel(s.triggerType)}] {s.content.slice(0, 20)}
              {s.content.length > 20 ? '...' : ''}
            </option>
          ))}
        </select>
      )}
      {attachType === 'gameplay' && (
        <select
          className="horror-input text-xs py-1 w-full"
          value={attachId}
          onChange={(e) => setAttachId(e.target.value)}
        >
          <option value="">—— 请选择玩法标记 ——</option>
          {roomGameplays.map((g) => (
            <option key={g.id} value={g.id}>
              [{gameplayTypeLabel(g.type)}] {g.name}
            </option>
          ))}
        </select>
      )}
      {attachType !== 'none' && attachType === 'story' && roomStories.length === 0 && (
        <p className="text-[10px] text-horror-muted opacity-70">（请先在"剧情"标签页添加节点）</p>
      )}
      {attachType !== 'none' && attachType === 'gameplay' && roomGameplays.length === 0 && (
        <p className="text-[10px] text-horror-muted opacity-70">（请先在"玩法"标签页添加标记）</p>
      )}
    </div>
  );

  const renderEditor = (
    name: string, setName: (v: string) => void,
    desc: string, setDesc: (v: string) => void,
    distance: number, setDistance: (v: number) => void,
    volume: number, setVolume: (v: number) => void,
    loop: boolean, setLoop: (v: boolean) => void,
    attachType: 'none' | 'story' | 'gameplay',
    setAttachType: (v: 'none' | 'story' | 'gameplay') => void,
    attachId: string, setAttachId: (v: string) => void,
    onSave: () => void,
    onCancel: () => void,
  ) => (
    <div className="space-y-2 mt-1">
      <input
        className="horror-input text-sm"
        placeholder="音效名称（如：风声、低语、敲门声）"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        className="horror-textarea text-sm"
        rows={2}
        placeholder="音效描述与触发说明..."
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-horror-muted flex items-center gap-1 mb-1">
            <Ruler size={10} /> 触发距离 (m)
          </label>
          <input
            type="number"
            min={0}
            max={50}
            className="horror-input text-sm"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs text-horror-muted flex items-center gap-1 mb-1">
            <Gauge size={10} /> 音量 (0-1)
          </label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            className="horror-input text-sm"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-horror-muted cursor-pointer">
        <input
          type="checkbox"
          checked={loop}
          onChange={(e) => setLoop(e.target.checked)}
          className="accent-horror-accent"
        />
        <Repeat size={10} /> 循环播放
      </label>
      {renderAttachSelector(attachType, setAttachType, attachId, setAttachId)}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="horror-btn-ghost flex items-center gap-1">
          <X size={12} /> 取消
        </button>
        <button onClick={onSave} className="horror-btn-primary flex items-center gap-1">
          <Check size={12} /> 保存
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-horror-muted">音效节点 · 共 {roomAudio.length} 个</span>
        <button
          onClick={() => setIsAdding(true)}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded text-horror-accent hover:bg-horror-accent/10 transition-colors"
        >
          <Plus size={12} /> 添加音效
        </button>
      </div>

      {isAdding && (
        <div className="horror-card p-3 animate-fade-in">
          {renderEditor(
            newName, setNewName,
            newDesc, setNewDesc,
            newDistance, setNewDistance,
            newVolume, setNewVolume,
            newLoop, setNewLoop,
            newAttachType, setNewAttachType,
            newAttachId, setNewAttachId,
            handleAdd,
            () => { setIsAdding(false); setNewAttachType('none'); setNewAttachId(''); },
          )}
        </div>
      )}

      {roomAudio.map((node) => {
        const isEditing = editingId === node.id;

        return (
          <div key={node.id} className="horror-card p-3 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Volume2 size={14} className="text-purple-400" />
                <span className="text-sm text-white font-medium">{node.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {!isEditing && (
                  <button
                    onClick={() => startEdit(node)}
                    className="p-1 rounded text-horror-muted hover:text-white hover:bg-horror-surface2 transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
                <button
                  onClick={() => removeAudioNode(node.id)}
                  className="p-1 rounded text-horror-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="删除"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {isEditing ? (
              renderEditor(
                editName, setEditName,
                editDesc, setEditDesc,
                editDistance, setEditDistance,
                editVolume, setEditVolume,
                editLoop, setEditLoop,
                editAttachType, setEditAttachType,
                editAttachId, setEditAttachId,
                () => saveEdit(node.id),
                () => { setEditingId(null); setEditAttachType('none'); setEditAttachId(''); },
              )
            ) : (
              <>
                <p className="text-sm text-horror-text leading-relaxed">{node.description}</p>
                {renderParams(node.triggerDistance, node.volume, node.loop)}
                {renderAttachInfo(node.attachedTo || null)}
              </>
            )}
          </div>
        );
      })}

      {roomAudio.length === 0 && !isAdding && (
        <div className="text-center py-8 text-horror-muted text-sm">
          暂无音效节点，点击上方"添加音效"开始设计
        </div>
      )}
    </div>
  );
};

export default AudioTab;
