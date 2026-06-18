import { useState } from 'react';
import type { AudioNode } from '@/types';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import { Plus, Trash2, Edit2, Check, X, Volume2, Repeat, Ruler, Gauge } from 'lucide-react';

interface AudioTabProps {
  roomId: string;
}

const AudioTab = ({ roomId }: AudioTabProps) => {
  const { audioNodes, addAudioNode, updateAudioNode, removeAudioNode } = useBlueprintStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDistance, setEditDistance] = useState(0);
  const [editVolume, setEditVolume] = useState(0.3);
  const [editLoop, setEditLoop] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDistance, setNewDistance] = useState(3);
  const [newVolume, setNewVolume] = useState(0.3);
  const [newLoop, setNewLoop] = useState(false);

  const roomAudio = audioNodes.filter((a) => a.roomId === roomId);

  const startEdit = (node: AudioNode) => {
    setEditingId(node.id);
    setEditName(node.name);
    setEditDesc(node.description);
    setEditDistance(node.triggerDistance);
    setEditVolume(node.volume);
    setEditLoop(node.loop);
  };

  const saveEdit = (nodeId: string) => {
    updateAudioNode(nodeId, {
      name: editName,
      description: editDesc,
      triggerDistance: editDistance,
      volume: editVolume,
      loop: editLoop,
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
    });
    setNewName('');
    setNewDesc('');
    setNewDistance(3);
    setNewVolume(0.3);
    setNewLoop(false);
    setIsAdding(false);
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

  const renderEditor = (
    name: string, setName: (v: string) => void,
    desc: string, setDesc: (v: string) => void,
    distance: number, setDistance: (v: number) => void,
    volume: number, setVolume: (v: number) => void,
    loop: boolean, setLoop: (v: boolean) => void,
    onSave: () => void,
    onCancel: () => void,
  ) => (
    <div className="space-y-2 mt-2">
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
            handleAdd,
            () => setIsAdding(false),
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
                () => saveEdit(node.id),
                () => setEditingId(null),
              )
            ) : (
              <>
                <p className="text-sm text-horror-text leading-relaxed">{node.description}</p>
                {renderParams(node.triggerDistance, node.volume, node.loop)}
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
