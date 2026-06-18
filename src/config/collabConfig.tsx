import type { CollabTaskType, CollabRole, CollabTaskStatus } from '@/types';
import {
  BookOpen, Volume2, Swords, Eye,
  UserPen, Music4, MapIcon, Crown,
  Circle, CircleDot, CircleCheck,
} from 'lucide-react';

export const taskTypeConfig: Record<CollabTaskType, {
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

export const roleConfig: Record<CollabRole, { label: string; icon: React.ReactNode; color: string }> = {
  writer: { label: '编剧', icon: <UserPen size={10} />, color: 'text-blue-300 border-blue-500/30 bg-blue-500/10' },
  sound_designer: { label: '音效师', icon: <Music4 size={10} />, color: 'text-purple-300 border-purple-500/30 bg-purple-500/10' },
  level_designer: { label: '关卡策划', icon: <MapIcon size={10} />, color: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' },
  producer: { label: '项目负责', icon: <Crown size={10} />, color: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10' },
};

export const statusConfig: Record<CollabTaskStatus, { label: string; icon: React.ReactNode; color: string }> = {
  todo: { label: '待办', icon: <Circle size={12} />, color: 'text-horror-muted' },
  doing: { label: '进行中', icon: <CircleDot size={12} />, color: 'text-yellow-400' },
  done: { label: '已完成', icon: <CircleCheck size={12} />, color: 'text-green-400' },
};

export const statusFlow: CollabTaskStatus[] = ['todo', 'doing', 'done'];

export function nextStatus(current: CollabTaskStatus): CollabTaskStatus {
  const idx = statusFlow.indexOf(current);
  return statusFlow[(idx + 1) % statusFlow.length];
}
