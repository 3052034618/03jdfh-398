import type { DiffLine, RoomSnapshot, StoryNode, GameplayMarker, AudioNode, CollabTask } from '@/types';

const triggerTypeMap: Record<string, string> = {
  enter: '进入时',
  investigate: '调查时',
  leave: '离开时',
};

const markerTypeMap: Record<string, string> = {
  door_lock: '门锁',
  key: '钥匙',
  chase_trigger: '追逐触发点',
  hiding_spot: '藏身点',
};

const statusMap: Record<string, string> = {
  locked: '封锁',
  explorable: '可探索',
  second_run: '二周目变化',
  normal: '普通',
};

const collabTypeMap: Record<string, string> = {
  story_pending: '剧情待补',
  audio_pending: '音效待配',
  gameplay_conflict: '玩法冲突待确认',
  review_pending: '评审待过',
};

const collabRoleMap: Record<string, string> = {
  writer: '编剧',
  sound_designer: '音效师',
  level_designer: '关卡策划',
  producer: '项目负责',
};

const collabStatusMap: Record<string, string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
};

function formatStoryNode(node: StoryNode): string {
  let result = `  [${triggerTypeMap[node.triggerType]}] ${node.content}`;
  if (node.branches && node.branches.length > 0) {
    node.branches.forEach((b) => {
      result += `\n    └─ 条件「${b.condition}」: ${b.content}`;
    });
  }
  return result;
}

function formatGameplayMarker(marker: GameplayMarker): string {
  let result = `  [${markerTypeMap[marker.type]}] ${marker.name}: ${marker.description}`;
  if (marker.linkedTo) {
    result += ` → 关联: ${marker.linkedTo}`;
  }
  return result;
}

function formatAudioNode(node: AudioNode): string {
  return `  [${node.triggerDistance}m触发, 音量${node.volume}, ${node.loop ? '循环' : '单次'}] ${node.name}: ${node.description}`;
}

function formatCollabTask(task: CollabTask): string {
  let result = `  [${collabTypeMap[task.type]} | ${collabRoleMap[task.assigneeRole]} | ${collabStatusMap[task.status]}] ${task.title}`;
  if (task.description) {
    result += ` — ${task.description}`;
  }
  if (task.closedAt) {
    result += ` (完成于 ${task.closedAt})`;
  }
  return result;
}

export function snapshotToText(snap: RoomSnapshot): string {
  const lines: string[] = [];
  lines.push(`房间名称: ${snap.name}`);
  lines.push(`状态: ${statusMap[snap.status]}`);
  lines.push(`描述: ${snap.description}`);
  lines.push('');
  lines.push('【剧情节点】');
  if (snap.storyNodes.length === 0) {
    lines.push('  (无)');
  } else {
    snap.storyNodes.forEach((n) => lines.push(formatStoryNode(n)));
  }
  lines.push('');
  lines.push('【玩法标记】');
  if (snap.gameplayMarkers.length === 0) {
    lines.push('  (无)');
  } else {
    snap.gameplayMarkers.forEach((m) => lines.push(formatGameplayMarker(m)));
  }
  lines.push('');
  lines.push('【音效节点】');
  if (snap.audioNodes.length === 0) {
    lines.push('  (无)');
  } else {
    snap.audioNodes.forEach((a) => lines.push(formatAudioNode(a)));
  }
  lines.push('');
  lines.push('【协作任务】');
  const tasks = snap.collabTasks ?? [];
  if (tasks.length === 0) {
    lines.push('  (无)');
  } else {
    tasks.forEach((t) => lines.push(formatCollabTask(t)));
  }
  return lines.join('\n');
}

export function computeDiff(oldSnap: RoomSnapshot, newSnap: RoomSnapshot): DiffLine[] {
  const oldText = snapshotToText(oldSnap).split('\n');
  const newText = snapshotToText(newSnap).split('\n');
  const result: DiffLine[] = [];

  const maxLen = Math.max(oldText.length, newText.length);
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldText[i];
    const newLine = newText[i];

    if (oldLine === undefined && newLine !== undefined) {
      result.push({ type: 'added', content: newLine });
    } else if (oldLine !== undefined && newLine === undefined) {
      result.push({ type: 'removed', content: oldLine });
    } else if (oldLine !== newLine) {
      result.push({ type: 'removed', content: oldLine });
      result.push({ type: 'added', content: newLine });
    } else {
      result.push({ type: 'unchanged', content: oldLine });
    }
  }

  return result;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
