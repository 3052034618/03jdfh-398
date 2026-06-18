import { useMemo } from 'react';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import { taskTypeConfig, roleConfig, statusConfig, nextStatus } from '@/config/collabConfig';
import type { CollabTask } from '@/types';
import { ClipboardList, Clock } from 'lucide-react';

interface CollabListProps {
  roomId: string | null;
}

const CollabList = ({ roomId }: CollabListProps) => {
  const { collabTasks, updateCollabTask } = useBlueprintStore();

  const roomTasks = useMemo(() => {
    if (!roomId) return [];
    return collabTasks
      .filter((t) => t.roomId === roomId)
      .sort((a, b) => {
        const order = { todo: 0, doing: 1, done: 2 } as const;
        return order[a.status] - order[b.status] || b.createdAt.localeCompare(a.createdAt);
      });
  }, [collabTasks, roomId]);

  const stats = useMemo(() => ({
    total: roomTasks.length,
    todo: roomTasks.filter((t) => t.status === 'todo').length,
    doing: roomTasks.filter((t) => t.status === 'doing').length,
    done: roomTasks.filter((t) => t.status === 'done').length,
  }), [roomTasks]);

  const handleToggleStatus = (task: CollabTask) => {
    const next = nextStatus(task.status);
    updateCollabTask(task.id, { status: next });
  };

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-horror-muted text-sm">
        <ClipboardList size={28} className="mb-2 opacity-30" />
        <p>请先选择一个房间区域</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-3 mb-2 pb-2 border-b border-horror-border shrink-0">
        <div className="text-xs text-horror-muted">
          共 <span className="text-white font-medium">{stats.total}</span> 项
        </div>
        <div className="text-xs flex items-center gap-1 text-horror-muted">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500" />
          待办 {stats.todo}
        </div>
        <div className="text-xs flex items-center gap-1 text-yellow-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400" />
          进行 {stats.doing}
        </div>
        <div className="text-xs flex items-center gap-1 text-green-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
          完成 {stats.done}
        </div>
        <div className="flex-1" />
        <div className="text-[10px] text-horror-muted">
          点击左侧图标切换状态
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {roomTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-horror-muted text-xs py-8">
            暂无协作任务
          </div>
        )}
        {roomTasks.map((task) => {
          const tc = taskTypeConfig[task.type];
          const rc = roleConfig[task.assigneeRole];
          const sc = statusConfig[task.status];
          const isDone = task.status === 'done';
          return (
            <div
              key={task.id}
              className={`
                flex items-center gap-2 p-2 rounded border text-xs transition-all
                ${isDone ? 'bg-horror-surface2/40 border-horror-border/50 opacity-60' : 'bg-horror-surface2 border-horror-border hover:border-horror-accent/30'}
              `}
            >
              <button
                onClick={() => handleToggleStatus(task)}
                className={`shrink-0 p-0.5 rounded transition-colors ${sc.color} hover:scale-110`}
                title={`切换为${nextStatus(task.status) === 'todo' ? '待办' : nextStatus(task.status) === 'doing' ? '进行中' : '已完成'}`}
              >
                {sc.icon}
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${tc.color}`}>
                  {tc.icon}
                  <span className="hidden sm:inline">{tc.label}</span>
                </span>
              </div>

              <div className={`flex-1 min-w-0 truncate ${isDone ? 'line-through' : ''}`}>
                <span className="text-white font-medium">{task.title}</span>
                {task.description && (
                  <span className="text-horror-muted ml-2 hidden md:inline">{task.description}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${rc.color}`}>
                  {rc.icon}
                  <span>{rc.label}</span>
                </span>
                {task.closedAt && (
                  <span className="text-[10px] text-horror-muted flex items-center gap-0.5">
                    <Clock size={10} />
                    {task.closedAt.slice(5, 16)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollabList;
