import { useState } from 'react';
import type { CollabTaskType, CollabRole, CollabTaskStatus, CollabTask } from '@/types';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import {
  Plus, Trash2, Edit2, Check, X,
  BookOpen, Volume2, Swords, Eye,
  UserPen, Music4, MapIcon, Crown,
  Circle, CircleDot, CircleCheck,
  Clock,
} from 'lucide-react';

interface CollabTabProps {
  roomId: string;
}

const taskTypeConfig: Record<CollabTaskType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  defaultRole: CollabRole;
}> = {
  story_pending: {
    label: '剧情待补',
    icon: <BookOpen size={14} />,
    color: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
    defaultRole: 'writer',
  },
  audio_pending: {
    label: '音效待配',
    icon: <Volume2 size={14} />,
    color: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
    defaultRole: 'sound_designer',
  },
  gameplay_conflict: {
    label: '玩法冲突待确认',
    icon: <Swords size={14} />,
    color: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    defaultRole: 'level_designer',
  },
  review_pending: {
    label: '评审待过',
    icon: <Eye size={14} />,
    color: 'text-green-400 border-green-500/40 bg-green-500/10',
    defaultRole: 'producer',
  },
};

const roleConfig: Record<CollabRole, { label: string; icon: React.ReactNode; color: string }> = {
  writer: { label: '编剧', icon: <UserPen size={10} />, color: 'text-blue-300 border-blue-500/30 bg-blue-500/10' },
  sound_designer: { label: '音效师', icon: <Music4 size={10} />, color: 'text-purple-300 border-purple-500/30 bg-purple-500/10' },
  level_designer: { label: '关卡策划', icon: <MapIcon size={10} />, color: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' },
  producer: { label: '项目负责', icon: <Crown size={10} />, color: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10' },
};

const statusConfig: Record<CollabTaskStatus, { label: string; icon: React.ReactNode; color: string }> = {
  todo: { label: '待办', icon: <Circle size={10} />, color: 'text-horror-muted' },
  doing: { label: '进行中', icon: <CircleDot size={10} />, color: 'text-yellow-400' },
  done: { label: '已完成', icon: <CircleCheck size={10} />, color: 'text-green-400' },
};

const CollabTab = ({ roomId }: CollabTabProps) => {
  const { collabTasks, addCollabTask, updateCollabTask, removeCollabTask } = useBlueprintStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<CollabTaskType>('story_pending');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRole, setNewRole] = useState<CollabRole>('writer');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRole, setEditRole] = useState<CollabRole>('writer');

  const roomTasks = collabTasks
    .filter((t) => t.roomId === roomId)
    .sort((a, b) => {
      const order = { todo: 0, doing: 1, done: 2 } as const;
      return order[a.status] - order[b.status] || b.createdAt.localeCompare(a.createdAt);
    });

  const counts = {
    total: roomTasks.length,
    todo: roomTasks.filter((t) => t.status === 'todo').length,
    doing: roomTasks.filter((t) => t.status === 'doing').length,
    done: roomTasks.filter((t) => t.status === 'done').length,
  };

  const startEdit = (t: CollabTask) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDesc(t.description);
    setEditRole(t.assigneeRole);
  };

  const saveEdit = (taskId: string) => {
    if (!editTitle.trim()) return;
    updateCollabTask(taskId, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      assigneeRole: editRole,
    });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addCollabTask(roomId, {
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim(),
      assigneeRole: newRole,
      status: 'todo',
      createdBy: '当前用户',
    });
    setNewTitle('');
    setNewDesc('');
    setNewType('story_pending');
    setNewRole('writer');
    setIsAdding(false);
  };

  const cycleStatus = (task: CollabTask) => {
    const next: Record<CollabTaskStatus, CollabTaskStatus> = {
      todo: 'doing',
      doing: 'done',
      done: 'todo',
    };
    updateCollabTask(task.id, { status: next[task.status] });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-horror-muted">
          <span>协作任务</span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-horror-surface2 text-horror-text">
              {counts.total}
            </span>
            <span className="text-blue-400">{counts.todo}待办</span>
            <span className="text-yellow-400">{counts.doing}进行</span>
            <span className="text-green-400">{counts.done}完成</span>
          </span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded text-horror-accent hover:bg-horror-accent/10 transition-colors"
        >
          <Plus size={12} /> 添加任务
        </button>
      </div>

      {isAdding && (
        <div className="horror-card p-3 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-horror-muted">类型:</span>
            <div className="flex gap-1 flex-wrap">
              {(Object.keys(taskTypeConfig) as CollabTaskType[]).map((t) => {
                const cfg = taskTypeConfig[t];
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setNewType(t);
                      setNewRole(cfg.defaultRole);
                    }}
                    className={`text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 transition-all ${
                      newType === t ? cfg.color : 'border-horror-border text-horror-muted hover:border-horror-accent/40'
                    }`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <input
            className="horror-input text-sm"
            placeholder="任务标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            className="horror-textarea text-sm"
            rows={2}
            placeholder="补充说明..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div>
            <span className="text-xs text-horror-muted mb-1 block">分配角色:</span>
            <div className="flex gap-1 flex-wrap">
              {(Object.keys(roleConfig) as CollabRole[]).map((r) => {
                const rc = roleConfig[r];
                return (
                  <button
                    key={r}
                    onClick={() => setNewRole(r)}
                    className={`text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 transition-all ${
                      newRole === r ? rc.color : 'border-horror-border text-horror-muted hover:border-horror-accent/40'
                    }`}
                  >
                    {rc.icon}
                    {rc.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="horror-btn-ghost flex items-center gap-1">
              <X size={12} /> 取消
            </button>
            <button onClick={handleAdd} className="horror-btn-primary flex items-center gap-1">
              <Check size={12} /> 创建
            </button>
          </div>
        </div>
      )}

      {roomTasks.map((task) => {
        const typeCfg = taskTypeConfig[task.type];
        const roleCfg = roleConfig[task.assigneeRole];
        const statusCfg = statusConfig[task.status];
        const isEditing = editingId === task.id;

        return (
          <div
            key={task.id}
            className={`horror-card p-3 animate-fade-in ${task.status === 'done' ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => cycleStatus(task)}
                  className={`transition-colors hover:scale-110 ${statusCfg.color}`}
                  title={`点击切换状态: ${statusCfg.label}`}
                >
                  {statusCfg.icon}
                </button>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${typeCfg.color}`}>
                  {typeCfg.icon}
                  {typeCfg.label}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${roleCfg.color}`}>
                  {roleCfg.icon}
                  {roleCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {!isEditing && (
                  <button
                    onClick={() => startEdit(task)}
                    className="p-1 rounded text-horror-muted hover:text-white hover:bg-horror-surface2 transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
                <button
                  onClick={() => removeCollabTask(task.id)}
                  className="p-1 rounded text-horror-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="删除"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <input
                  className="horror-input text-sm"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                />
                <textarea
                  className="horror-textarea text-sm"
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
                <div className="flex gap-1 flex-wrap">
                  {(Object.keys(roleConfig) as CollabRole[]).map((r) => {
                    const rc = roleConfig[r];
                    return (
                      <button
                        key={r}
                        onClick={() => setEditRole(r)}
                        className={`text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 transition-all ${
                          editRole === r ? rc.color : 'border-horror-border text-horror-muted hover:border-horror-accent/40'
                        }`}
                      >
                        {rc.icon}
                        {rc.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="horror-btn-ghost flex items-center gap-1">
                    <X size={12} /> 取消
                  </button>
                  <button onClick={() => saveEdit(task.id)} className="horror-btn-primary flex items-center gap-1">
                    <Check size={12} /> 保存
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className={`text-sm text-white font-medium ${task.status === 'done' ? 'line-through decoration-horror-muted/50' : ''}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-horror-text leading-relaxed mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-horror-muted mt-1.5">
                  <span className="flex items-center gap-0.5">
                    <Clock size={9} /> {task.createdAt.slice(5)}创建
                  </span>
                  {task.status === 'done' && task.closedAt && (
                    <span className="flex items-center gap-0.5 text-green-400">
                      <Check size={9} /> {task.closedAt.slice(5)}完成
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {roomTasks.length === 0 && !isAdding && (
        <div className="text-center py-8 text-horror-muted text-sm space-y-1">
          <p>暂无协作任务</p>
          <p className="text-[11px] opacity-70">
            点击上方"添加任务"，分配剧情/音效/玩法工作给对应角色
          </p>
        </div>
      )}
    </div>
  );
};

export default CollabTab;
