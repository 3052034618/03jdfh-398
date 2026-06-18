import { useState } from 'react';
import type { StoryNode, StoryTriggerType, AudioNode } from '@/types';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import { Plus, Trash2, Edit2, Check, X, LogIn, Search, LogOut, GitBranch, Volume2 } from 'lucide-react';

interface StoryTabProps {
  roomId: string;
}

const triggerConfig: Record<StoryTriggerType, { label: string; icon: React.ReactNode; color: string }> = {
  enter: { label: '进入时', icon: <LogIn size={14} />, color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
  investigate: { label: '调查时', icon: <Search size={14} />, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  leave: { label: '离开时', icon: <LogOut size={14} />, color: 'text-gray-400 border-gray-500/40 bg-gray-500/10' },
};

const StoryTab = ({ roomId }: StoryTabProps) => {
  const { storyNodes, audioNodes, addStoryNode, updateStoryNode, removeStoryNode } = useBlueprintStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTrigger, setNewTrigger] = useState<StoryTriggerType>('enter');
  const [newContent, setNewContent] = useState('');

  const roomStories = storyNodes.filter((n) => n.roomId === roomId);

  const attachedAudiosFor = (nodeId: string): AudioNode[] =>
    audioNodes.filter((a) => a.attachedTo?.type === 'story' && a.attachedTo.id === nodeId);

  const startEdit = (node: StoryNode) => {
    setEditingId(node.id);
    setEditContent(node.content);
  };

  const saveEdit = (nodeId: string) => {
    updateStoryNode(nodeId, { content: editContent });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newContent.trim()) return;
    addStoryNode(roomId, { triggerType: newTrigger, content: newContent.trim() });
    setNewContent('');
    setNewTrigger('enter');
    setIsAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-horror-muted">剧情节点 · 共 {roomStories.length} 个</span>
        <button
          onClick={() => setIsAdding(true)}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded text-horror-accent hover:bg-horror-accent/10 transition-colors"
        >
          <Plus size={12} /> 添加节点
        </button>
      </div>

      {isAdding && (
        <div className="horror-card p-3 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-horror-muted">触发时机:</span>
            <div className="flex gap-1 flex-wrap">
              {(Object.keys(triggerConfig) as StoryTriggerType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewTrigger(t)}
                  className={`text-xs px-2 py-1 rounded border flex items-center gap-1 transition-all ${
                    newTrigger === t ? triggerConfig[t].color : 'border-horror-border text-horror-muted hover:border-horror-accent/40'
                  }`}
                >
                  {triggerConfig[t].icon}
                  {triggerConfig[t].label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            className="horror-textarea text-sm"
            rows={3}
            placeholder="输入剧情内容..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            autoFocus
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

      {roomStories.map((node) => {
        const cfg = triggerConfig[node.triggerType];
        const isEditing = editingId === node.id;
        const attached = attachedAudiosFor(node.id);

        return (
          <div key={node.id} className="horror-card p-3 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${cfg.color}`}>
                {cfg.icon}
                {cfg.label}
              </span>
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
                  onClick={() => removeStoryNode(node.id)}
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
                  rows={3}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="horror-btn-ghost flex items-center gap-1">
                    <X size={12} /> 取消
                  </button>
                  <button onClick={() => saveEdit(node.id)} className="horror-btn-primary flex items-center gap-1">
                    <Check size={12} /> 保存
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-horror-text leading-relaxed">{node.content}</p>
            )}

            {node.branches && node.branches.length > 0 && (
              <div className="mt-3 pt-3 border-t border-horror-border space-y-2">
                {node.branches.map((branch) => (
                  <div key={branch.id} className="pl-3 border-l-2 border-purple-500/40">
                    <div className="flex items-center gap-1 text-xs text-purple-400 mb-1">
                      <GitBranch size={10} />
                      <span>条件分支: {branch.condition}</span>
                    </div>
                    <p className="text-xs text-horror-muted leading-relaxed">{branch.content}</p>
                  </div>
                ))}
              </div>
            )}

            {attached.length > 0 && (
              <div className="mt-3 pt-3 border-t border-horror-border">
                <div className="text-[10px] text-purple-400 flex items-center gap-1 mb-1.5">
                  <Volume2 size={10} /> 挂载音效 ({attached.length})
                </div>
                <div className="space-y-1.5">
                  {attached.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 bg-purple-500/5 border border-purple-500/20 rounded px-2 py-1.5">
                      <Volume2 size={11} className="text-purple-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white font-medium truncate">{a.name}</div>
                        <div className="text-[10px] text-horror-muted">
                          触发距离 {a.triggerDistance}m · 音量 {Math.round(a.volume * 100)}%{a.loop ? ' · 循环' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {roomStories.length === 0 && !isAdding && (
        <div className="text-center py-8 text-horror-muted text-sm">
          暂无剧情节点，点击上方"添加节点"开始编写
        </div>
      )}
    </div>
  );
};

export default StoryTab;
