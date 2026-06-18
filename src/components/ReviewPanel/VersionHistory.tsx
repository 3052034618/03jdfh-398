import { useMemo, useState } from 'react';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import {
  Clock, GitCompare, X, ArrowRight, User,
  Home, BookOpen, Gamepad2, Volume2, ClipboardList,
  Key, Lock, Zap, Shield, Filter, ChevronDown, ChevronUp,
} from 'lucide-react';
import { computeDiff, snapshotToText } from '@/utils/diff';
import type { Version, StoryNode, GameplayMarker, AudioNode, CollabTask, VersionChangeStats } from '@/types';

type FilterKey = 'all' | keyof VersionChangeStats;

const filterOptions: { key: FilterKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'all', label: '全部', icon: <Filter size={11} />, color: 'border-horror-border text-horror-muted' },
  { key: 'roomInfo', label: '房间信息', icon: <Home size={11} />, color: 'border-green-500/30 text-green-400' },
  { key: 'storyNodes', label: '剧情节点', icon: <BookOpen size={11} />, color: 'border-blue-500/30 text-blue-400' },
  { key: 'gameplayMarkers', label: '玩法标记', icon: <Gamepad2 size={11} />, color: 'border-orange-500/30 text-orange-400' },
  { key: 'audioNodes', label: '音效挂载', icon: <Volume2 size={11} />, color: 'border-purple-500/30 text-purple-400' },
  { key: 'collabTasks', label: '协作任务', icon: <ClipboardList size={11} />, color: 'border-cyan-500/30 text-cyan-400' },
];

const markerTypeLabel: Record<string, { label: string; icon: React.ReactNode }> = {
  door_lock: { label: '门锁', icon: <Lock size={9} className="text-red-400" /> },
  key: { label: '钥匙', icon: <Key size={9} className="text-yellow-400" /> },
  chase_trigger: { label: '追逐触发', icon: <Zap size={9} className="text-orange-400" /> },
  hiding_spot: { label: '藏身点', icon: <Shield size={9} className="text-green-400" /> },
};

interface VersionHistoryProps {
  roomId: string | null;
}

const VersionHistory = ({ roomId }: VersionHistoryProps) => {
  const { versions, rooms, compareVersionIds, setCompareVersionIds } = useBlueprintStore();
  const [selectedForCompare, setSelectedForCompare] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const roomVersions = useMemo(() => {
    if (!roomId) return [];
    return versions
      .filter((v) => v.roomId === roomId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }, [versions, roomId]);

  const filteredVersions = useMemo(() => {
    if (activeFilter === 'all') return roomVersions;
    return roomVersions.filter((v) => {
      const stat = v.changeStats[activeFilter];
      return stat !== undefined && stat > 0;
    });
  }, [roomVersions, activeFilter]);

  const handleCompareClick = (versionId: string) => {
    if (!selectedForCompare) {
      setSelectedForCompare(versionId);
      return;
    }
    if (selectedForCompare === versionId) {
      setSelectedForCompare(null);
      return;
    }
    const [v1, v2] = [selectedForCompare, versionId].sort((a, b) => {
      const va = roomVersions.find((v) => v.id === a);
      const vb = roomVersions.find((v) => v.id === b);
      return (va?.versionNumber || 0) - (vb?.versionNumber || 0);
    });
    setCompareVersionIds([v1, v2]);
    setSelectedForCompare(null);
  };

  const summarizeChanges = (version: Version) => {
    const idx = roomVersions.findIndex((v) => v.id === version.id);
    if (idx < 0) return null;
    const nextVer = roomVersions[idx + 1];
    if (!nextVer) return null;
    const snapA = nextVer.snapshot;
    const snapB = version.snapshot;

    type ChangeKind = 'added' | 'removed' | 'modified';
    type ChangeItem =
      | { category: 'storyNodes'; kind: ChangeKind; title: string; detail?: string }
      | { category: 'gameplayMarkers'; kind: ChangeKind; title: string; markerType?: string; detail?: string }
      | { category: 'audioNodes'; kind: ChangeKind; title: string; detail?: string }
      | { category: 'collabTasks'; kind: ChangeKind; title: string; role?: string; status?: string; detail?: string }
      | { category: 'roomInfo'; kind: ChangeKind; field: string; detail: string };

    const items: ChangeItem[] = [];

    if (snapA.name !== snapB.name) items.push({ category: 'roomInfo', kind: 'modified', field: '名称', detail: `${snapA.name} → ${snapB.name}` });
    if (snapA.status !== snapB.status) items.push({ category: 'roomInfo', kind: 'modified', field: '状态', detail: `${snapA.status} → ${snapB.status}` });
    if (snapA.description !== snapB.description) items.push({ category: 'roomInfo', kind: 'modified', field: '描述', detail: '（内容有变更）' });

    const diffArr = <T extends { id: string }>(a: T[], b: T[], label: (t: T) => string, diff: (a: T, b: T) => string | null) => {
      const aMap = new Map(a.map((x) => [x.id, x]));
      const bMap = new Map(b.map((x) => [x.id, x]));
      const out: { kind: ChangeKind; id: string; label: string; detail?: string }[] = [];
      for (const x of a) {
        if (!bMap.has(x.id)) out.push({ kind: 'removed', id: x.id, label: label(x) });
      }
      for (const x of b) {
        if (!aMap.has(x.id)) out.push({ kind: 'added', id: x.id, label: label(x) });
        else {
          const d = diff(aMap.get(x.id)!, x);
          if (d) out.push({ kind: 'modified', id: x.id, label: label(x), detail: d });
        }
      }
      return out;
    };

    const storyLabel = (n: StoryNode) => `[${n.triggerType}] ${n.content.slice(0, 28)}${n.content.length > 28 ? '…' : ''}`;
    const storyDiff = (a: StoryNode, b: StoryNode) => {
      const changes: string[] = [];
      if (a.triggerType !== b.triggerType) changes.push(`触发条件:${a.triggerType}→${b.triggerType}`);
      if (a.content !== b.content) changes.push('正文变更');
      const ab = a.branches?.length ?? 0;
      const bb = b.branches?.length ?? 0;
      if (ab !== bb) changes.push(`分支数:${ab}→${bb}`);
      return changes.length ? changes.join('，') : null;
    };
    for (const c of diffArr<StoryNode>(snapA.storyNodes, snapB.storyNodes, storyLabel, storyDiff)) {
      items.push({ category: 'storyNodes', kind: c.kind, title: c.label, detail: c.detail });
    }

    const markerLabel = (m: GameplayMarker) => `${markerTypeLabel[m.type]?.label ?? m.type}·${m.name}`;
    const markerDiff = (a: GameplayMarker, b: GameplayMarker) => {
      const changes: string[] = [];
      if (a.name !== b.name) changes.push(`名称变更`);
      if (a.description !== b.description) changes.push('说明变更');
      if ((a.linkedTo ?? null) !== (b.linkedTo ?? null)) {
        const bTarget = b.linkedTo ? snapB.gameplayMarkers.find((m) => m.id === b.linkedTo)?.name ?? b.linkedTo : '(无)';
        changes.push(`关联变更→${bTarget}`);
      }
      return changes.length ? changes.join('，') : null;
    };
    for (const c of diffArr<GameplayMarker>(snapA.gameplayMarkers, snapB.gameplayMarkers, markerLabel, markerDiff)) {
      const marker = [...snapA.gameplayMarkers, ...snapB.gameplayMarkers].find((m) => m.id === c.id);
      items.push({
        category: 'gameplayMarkers',
        kind: c.kind,
        title: c.label,
        markerType: marker?.type,
        detail: c.detail,
      });
    }

    const audioLabel = (a: AudioNode) => `[${a.triggerDistance}m/${Math.round(a.volume * 100)}%] ${a.name}`;
    const audioDiff = (a: AudioNode, b: AudioNode) => {
      const changes: string[] = [];
      if (a.name !== b.name) changes.push('名称变更');
      if (a.triggerDistance !== b.triggerDistance) changes.push(`距离:${a.triggerDistance}→${b.triggerDistance}`);
      if (a.volume !== b.volume) changes.push(`音量变更`);
      if (a.loop !== b.loop) changes.push(`循环:${a.loop}→${b.loop}`);
      if (a.description !== b.description) changes.push('说明变更');
      const atA = a.attachedTo ? (a.attachedTo.type === 'story' ? '剧情节点' : '玩法标记') : '(无)';
      const atB = b.attachedTo ? (b.attachedTo.type === 'story' ? '剧情节点' : '玩法标记') : '(无)';
      if (atA !== atB) changes.push(`挂载目标变更→${atB}`);
      return changes.length ? changes.join('，') : null;
    };
    for (const c of diffArr<AudioNode>(snapA.audioNodes, snapB.audioNodes, audioLabel, audioDiff)) {
      items.push({ category: 'audioNodes', kind: c.kind, title: c.label, detail: c.detail });
    }

    const roleLabel: Record<string, string> = { writer: '编剧', sound_designer: '音效师', level_designer: '关卡策划', producer: '项目负责' };
    const statusLabel: Record<string, string> = { todo: '待办', doing: '进行中', done: '已完成' };
    const taskLabel = (t: CollabTask) => `[${roleLabel[t.assigneeRole] ?? t.assigneeRole}/${statusLabel[t.status]}] ${t.title}`;
    const taskDiff = (a: CollabTask, b: CollabTask) => {
      const changes: string[] = [];
      if (a.title !== b.title) changes.push('标题变更');
      if (a.description !== b.description) changes.push('描述变更');
      if (a.assigneeRole !== b.assigneeRole) changes.push(`负责人→${roleLabel[b.assigneeRole] ?? b.assigneeRole}`);
      if (a.status !== b.status) changes.push(`状态:${statusLabel[a.status]}→${statusLabel[b.status]}`);
      return changes.length ? changes.join('，') : null;
    };
    for (const c of diffArr<CollabTask>(snapA.collabTasks ?? [], snapB.collabTasks ?? [], taskLabel, taskDiff)) {
      const task = [...(snapA.collabTasks ?? []), ...(snapB.collabTasks ?? [])].find((t) => t.id === c.id);
      items.push({
        category: 'collabTasks',
        kind: c.kind,
        title: c.label,
        role: task ? roleLabel[task.assigneeRole] : undefined,
        status: task ? statusLabel[task.status] : undefined,
        detail: c.detail,
      });
    }

    if (activeFilter !== 'all') {
      return items.filter((i) => i.category === activeFilter);
    }
    return items;
  };

  const ChangeBadge = ({
    icon, value, color, label,
  }: { icon: React.ReactNode; value: number; color: string; label: string }) => {
    if (value === 0) return null;
    return (
      <span
        title={`${label} 变更 ${value} 项`}
        className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${color}`}
      >
        {icon}
        {value > 0 ? `+${value}` : value}
      </span>
    );
  };

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-horror-muted text-sm">
        请先选择一个房间区域查看版本历史
      </div>
    );
  }

  if (roomVersions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-horror-muted text-sm">
        暂无版本记录，在右侧详情面板中点击"保存当前为新版本"创建记录
      </div>
    );
  }

  const isInCompareMode = selectedForCompare !== null;
  const kindLabel: Record<string, { label: string; color: string }> = {
    added: { label: '+新增', color: 'text-green-400 border-green-500/30 bg-green-500/10' },
    removed: { label: '-删除', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
    modified: { label: '~修改', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-horror-border shrink-0 flex-wrap">
        {filterOptions.map((f) => {
          const active = activeFilter === f.key;
          const count = f.key === 'all'
            ? roomVersions.length
            : roomVersions.filter((v) => (v.changeStats[f.key as keyof VersionChangeStats] ?? 0) > 0).length;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 transition-all ${
                active
                  ? `${f.color} bg-opacity-20 ring-1`
                  : 'border-horror-border/50 text-horror-muted hover:border-horror-accent/40 hover:text-white'
              }`}
            >
              {f.icon}
              {f.label}
              <span className="opacity-60 ml-0.5">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        {compareVersionIds && (
          <div className="mb-3 p-2 rounded bg-horror-accent/10 border border-horror-accent/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-horror-accent">
              <GitCompare size={12} />
              对比模式已开启，在下方"版本对比"标签页查看差异
            </div>
            <button
              onClick={() => { setCompareVersionIds(null); setSelectedForCompare(null); }}
              className="p-1 rounded hover:bg-horror-accent/20 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {isInCompareMode && !compareVersionIds && (
          <div className="mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400 animate-fade-in">
            请选择第二个版本进行对比
          </div>
        )}

        {filteredVersions.length === 0 ? (
          <div className="text-center py-8 text-horror-muted text-xs">
            当前筛选类别下暂无版本记录
          </div>
        ) : (
          <div className="space-y-2">
            {filteredVersions.map((version, idx) => {
              const isSelected = selectedForCompare === version.id;
              const isInComparePair = compareVersionIds?.includes(version.id);
              const s = version.changeStats;
              const expanded = expandedId === version.id;
              const changes = expanded ? summarizeChanges(version) : null;

              return (
                <div
                  key={version.id}
                  className={`
                    relative horror-card p-3 transition-all
                    ${isSelected ? 'ring-2 ring-horror-accent box-shadow-glow' : ''}
                    ${isInComparePair ? 'ring-1 ring-blue-500/50 bg-blue-500/5' : ''}
                    hover:border-horror-accent/40
                  `}
                >
                  {idx < filteredVersions.length - 1 && (
                    <div className="absolute left-5 -bottom-2 w-px h-4 bg-horror-border" />
                  )}

                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => handleCompareClick(version.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-horror-surface2 flex items-center justify-center shrink-0 border border-horror-border">
                      <span className="text-xs font-cinzel font-bold text-horror-accent">v{version.versionNumber}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-white font-medium truncate">{version.changeReason}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className={`text-xs px-2 py-0.5 rounded border transition-all ${
                              isSelected || isInComparePair
                                ? 'border-horror-accent text-horror-accent bg-horror-accent/10'
                                : 'border-horror-border text-horror-muted hover:border-horror-accent/50 hover:text-horror-accent'
                            }`}
                            onClick={(e) => { e.stopPropagation(); handleCompareClick(version.id); }}
                          >
                            <GitCompare size={10} className="inline mr-1" />
                            {isSelected ? '已选' : '对比'}
                          </button>
                          <button
                            className="text-xs px-1.5 py-0.5 rounded border border-horror-border/50 text-horror-muted hover:border-horror-accent/40 hover:text-white transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expanded ? null : version.id);
                            }}
                            title="展开变更明细"
                          >
                            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-horror-muted mb-2">
                        <span className="flex items-center gap-1">
                          <User size={10} /> {version.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {version.timestamp}
                        </span>
                      </div>

                      {(s.roomInfo || s.storyNodes || s.gameplayMarkers || s.audioNodes || s.collabTasks) && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <ChangeBadge
                            icon={<Home size={9} />}
                            value={s.roomInfo}
                            color="border-green-500/30 text-green-400 bg-green-500/10"
                            label="房间信息"
                          />
                          <ChangeBadge
                            icon={<BookOpen size={9} />}
                            value={s.storyNodes}
                            color="border-blue-500/30 text-blue-400 bg-blue-500/10"
                            label="剧情节点"
                          />
                          <ChangeBadge
                            icon={<Gamepad2 size={9} />}
                            value={s.gameplayMarkers}
                            color="border-orange-500/30 text-orange-400 bg-orange-500/10"
                            label="玩法标记"
                          />
                          <ChangeBadge
                            icon={<Volume2 size={9} />}
                            value={s.audioNodes}
                            color="border-purple-500/30 text-purple-400 bg-purple-500/10"
                            label="音效挂载"
                          />
                          <ChangeBadge
                            icon={<ClipboardList size={9} />}
                            value={s.collabTasks}
                            color="border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                            label="协作任务"
                          />
                          {s.roomInfo + s.storyNodes + s.gameplayMarkers + s.audioNodes + s.collabTasks === 0 && (
                            <span className="text-[10px] text-horror-muted opacity-70">（无实质内容变更）</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {expanded && changes !== null && (
                    <div className="mt-3 pt-3 border-t border-horror-border/60 animate-fade-in">
                      {changes === null || changes.length === 0 ? (
                        <div className="text-[11px] text-horror-muted text-center py-2">
                          （v{version.versionNumber} 为初始版本，无变更对比）
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {changes.map((ch, i) => {
                            const kl = kindLabel[ch.kind];
                            let categoryIcon: React.ReactNode = null;
                            let categoryColor = '';
                            if (ch.category === 'roomInfo') { categoryIcon = <Home size={9} />; categoryColor = 'text-green-400'; }
                            else if (ch.category === 'storyNodes') { categoryIcon = <BookOpen size={9} />; categoryColor = 'text-blue-400'; }
                            else if (ch.category === 'gameplayMarkers') {
                              categoryIcon = (ch as any).markerType && markerTypeLabel[(ch as any).markerType]
                                ? markerTypeLabel[(ch as any).markerType].icon
                                : <Gamepad2 size={9} />;
                              categoryColor = 'text-orange-400';
                            }
                            else if (ch.category === 'audioNodes') { categoryIcon = <Volume2 size={9} />; categoryColor = 'text-purple-400'; }
                            else if (ch.category === 'collabTasks') { categoryIcon = <ClipboardList size={9} />; categoryColor = 'text-cyan-400'; }
                            return (
                              <div
                                key={i}
                                className="flex items-start gap-1.5 text-[11px] bg-horror-surface2/40 rounded px-2 py-1.5"
                              >
                                <span className={`shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded border text-[10px] ${kl.color}`}>
                                  {kl.label}
                                </span>
                                <span className={`shrink-0 mt-0.5 ${categoryColor}`}>{categoryIcon}</span>
                                <span className="flex-1 min-w-0 text-horror-text">
                                  <span className="text-white font-medium">
                                    {ch.category === 'roomInfo'
                                      ? `【${(ch as any).field}】${(ch as any).detail}`
                                      : ch.title}
                                  </span>
                                  {ch.detail && ch.category !== 'roomInfo' && (
                                    <span className="text-horror-muted ml-1">— {ch.detail}</span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
