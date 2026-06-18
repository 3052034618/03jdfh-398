import { useMemo, useCallback } from 'react';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import {
  X, Key, Lock, AlertTriangle, AlertOctagon, RefreshCcw,
  Layers, MapPin, Link2, Unlink, CheckCircle2, Users,
  Wrench, ArrowRight, Eye,
} from 'lucide-react';

type PuzzleIssue =
  | { kind: 'unpaired'; markerId: string; markerType: 'key' | 'door_lock'; markerName: string; roomId: string; roomName: string; floorName: string; floorLevel: number }
  | { kind: 'duplicate_target'; markerId: string; markerName: string; roomId: string; targetName: string; targetRoomName: string; otherMarkerId: string; otherMarkerName: string; otherRoomName: string; markerType: 'key' | 'door_lock' }
  | { kind: 'cross_floor'; markerId: string; markerName: string; markerRoomId: string; markerRoomName: string; markerFloorName: string; markerFloorLevel: number; targetId: string; targetName: string; targetRoomName: string; targetFloorName: string; targetFloorLevel: number }
  | { kind: 'dangling_ref'; markerId: string; markerName: string; markerType: 'key' | 'door_lock'; roomId: string; roomName: string; linkedTo: string; reason: string }
  | { kind: 'asymmetric'; markerId: string; markerName: string; markerType: 'key' | 'door_lock'; roomName: string; targetId: string; targetName: string; targetRoomName: string; targetPointsBack: boolean };

const PuzzleInspector = () => {
  const {
    gameplayMarkers,
    rooms,
    floors,
    showPuzzleInspector,
    setShowPuzzleInspector,
    updateGameplayMarker,
    selectRoom,
    setDetailTab,
  } = useBlueprintStore();

  const { chains, issues, stats } = useMemo(() => {
    const keyMarkers = gameplayMarkers.filter((m) => m.type === 'key');
    const lockMarkers = gameplayMarkers.filter((m) => m.type === 'door_lock');
    const allPairs = [...keyMarkers, ...lockMarkers];

    const markerRoom = (id: string) => rooms.find((r) => r.id === id);
    const markerFloor = (roomFloorId: string) => floors.find((f) => f.id === roomFloorId);

    const chains = allPairs
      .filter((m) => m.linkedTo)
      .map((m) => {
        const target = gameplayMarkers.find((t) => t.id === m.linkedTo);
        const room = markerRoom(m.roomId);
        const floor = room ? markerFloor(room.floorId) : undefined;
        const targetRoom = target ? markerRoom(target.roomId) : undefined;
        const targetFloor = targetRoom ? markerFloor(targetRoom.floorId) : undefined;
        const targetPointsBack = target?.linkedTo === m.id;
        return {
          source: m,
          target: target || null,
          sourceRoomName: room?.name || '未知房间',
          sourceFloorName: floor?.name || '未知楼层',
          sourceFloorLevel: floor?.floorLevel || 0,
          targetRoomName: targetRoom?.name || '（房间丢失）',
          targetFloorName: targetFloor?.name || '未知楼层',
          targetFloorLevel: targetFloor?.floorLevel || 0,
          targetPointsBack,
          crossFloor: floor && targetFloor && floor.id !== targetFloor.id,
        };
      })
      .sort((a, b) => a.sourceFloorLevel - b.sourceFloorLevel || a.sourceRoomName.localeCompare(b.sourceRoomName));

    const issues: PuzzleIssue[] = [];

    const locksByTarget = new Map<string, string[]>();
    const keysByTarget = new Map<string, string[]>();
    for (const k of keyMarkers) {
      if (k.linkedTo) {
        const arr = keysByTarget.get(k.linkedTo) || [];
        arr.push(k.id);
        keysByTarget.set(k.linkedTo, arr);
      }
    }
    for (const l of lockMarkers) {
      if (l.linkedTo) {
        const arr = locksByTarget.get(l.linkedTo) || [];
        arr.push(l.id);
        locksByTarget.set(l.linkedTo, arr);
      }
    }

    const issuedIds = new Set<string>();

    for (const marker of allPairs) {
      const room = markerRoom(marker.roomId);
      const floor = room ? markerFloor(room.floorId) : undefined;
      if (!marker.linkedTo) {
        issues.push({
          kind: 'unpaired',
          markerId: marker.id,
          markerType: marker.type as 'key' | 'door_lock',
          markerName: marker.name,
          roomId: marker.roomId,
          roomName: room?.name || '未知房间',
          floorName: floor?.name || '未知楼层',
          floorLevel: floor?.floorLevel || 0,
        });
        continue;
      }

      const target = gameplayMarkers.find((t) => t.id === marker.linkedTo);
      if (!target) {
        issues.push({
          kind: 'dangling_ref',
          markerId: marker.id,
          markerName: marker.name,
          markerType: marker.type as 'key' | 'door_lock',
          roomId: marker.roomId,
          roomName: room?.name || '未知房间',
          linkedTo: marker.linkedTo,
          reason: '关联对象已删除',
        });
        continue;
      }

      if (target.linkedTo !== marker.id) {
        const targetRoom = markerRoom(target.roomId);
        const pairKey = [marker.id, target.id].sort().join('|');
        if (!issuedIds.has(pairKey)) {
          issuedIds.add(pairKey);
          issues.push({
            kind: 'asymmetric',
            markerId: marker.id,
            markerName: marker.name,
            markerType: marker.type as 'key' | 'door_lock',
            roomName: room?.name || '未知房间',
            targetId: target.id,
            targetName: target.name,
            targetRoomName: targetRoom?.name || '未知房间',
            targetPointsBack: target.linkedTo === marker.id,
          });
        }
      }

      if (marker.type === 'key') {
        const duplicates = (keysByTarget.get(marker.linkedTo) || []).filter((id) => id !== marker.id);
        for (const otherKeyId of duplicates) {
          const dupKey = [marker.id, otherKeyId].sort().join('|');
          if (issuedIds.has(dupKey)) continue;
          issuedIds.add(dupKey);
          const otherKey = gameplayMarkers.find((m) => m.id === otherKeyId);
          const otherRoom = otherKey ? markerRoom(otherKey.roomId) : undefined;
          const targetRoom = markerRoom(target.roomId);
          issues.push({
            kind: 'duplicate_target',
            markerId: marker.id,
            markerName: marker.name,
            roomId: marker.roomId,
            targetName: target.name,
            targetRoomName: targetRoom?.name || '未知房间',
            otherMarkerId: otherKeyId,
            otherMarkerName: otherKey?.name || otherKeyId,
            otherRoomName: otherRoom?.name || '未知房间',
            markerType: 'key',
          });
        }
      } else {
        const duplicates = (locksByTarget.get(marker.linkedTo) || []).filter((id) => id !== marker.id);
        for (const otherLockId of duplicates) {
          const dupKey = [marker.id, otherLockId].sort().join('|');
          if (issuedIds.has(dupKey)) continue;
          issuedIds.add(dupKey);
          const otherLock = gameplayMarkers.find((m) => m.id === otherLockId);
          const otherRoom = otherLock ? markerRoom(otherLock.roomId) : undefined;
          const targetRoom = markerRoom(target.roomId);
          issues.push({
            kind: 'duplicate_target',
            markerId: marker.id,
            markerName: marker.name,
            roomId: marker.roomId,
            targetName: target.name,
            targetRoomName: targetRoom?.name || '未知房间',
            otherMarkerId: otherLockId,
            otherMarkerName: otherLock?.name || otherLockId,
            otherRoomName: otherRoom?.name || '未知房间',
            markerType: 'door_lock',
          });
        }
      }

      const targetRoom = markerRoom(target.roomId);
      const targetFloor = targetRoom ? markerFloor(targetRoom.floorId) : undefined;
      if (floor && targetFloor && floor.id !== targetFloor.id) {
        issues.push({
          kind: 'cross_floor',
          markerId: marker.id,
          markerName: marker.name,
          markerRoomId: marker.roomId,
          markerRoomName: room?.name || '未知房间',
          markerFloorName: floor.name,
          markerFloorLevel: floor.floorLevel,
          targetId: target.id,
          targetName: target.name,
          targetRoomName: targetRoom?.name || '未知房间',
          targetFloorName: targetFloor.name,
          targetFloorLevel: targetFloor.floorLevel,
        });
      }
    }

    const issueCounts = {
      unpaired: issues.filter((i) => i.kind === 'unpaired').length,
      duplicate: issues.filter((i) => i.kind === 'duplicate_target').length,
      crossFloor: issues.filter((i) => i.kind === 'cross_floor').length,
      dangling: issues.filter((i) => i.kind === 'dangling_ref').length,
      asymmetric: issues.filter((i) => i.kind === 'asymmetric').length,
    };

    return {
      chains,
      issues,
      stats: {
        totalKeys: keyMarkers.length,
        totalLocks: lockMarkers.length,
        pairedChains: chains.filter((c) => c.target && c.targetPointsBack).length,
        issueCounts,
        totalIssues: issues.length,
      },
    };
  }, [gameplayMarkers, rooms, floors]);

  const handleFix = useCallback((iss: PuzzleIssue) => {
    switch (iss.kind) {
      case 'dangling_ref':
        updateGameplayMarker(iss.markerId, { linkedTo: undefined });
        break;
      case 'asymmetric':
        updateGameplayMarker(iss.targetId, { linkedTo: iss.markerId });
        break;
      case 'duplicate_target':
        updateGameplayMarker(iss.otherMarkerId, { linkedTo: undefined });
        break;
      case 'unpaired':
        selectRoom(iss.roomId);
        setDetailTab('gameplay');
        setShowPuzzleInspector(false);
        break;
      default:
        break;
    }
  }, [updateGameplayMarker, selectRoom, setDetailTab, setShowPuzzleInspector]);

  if (!showPuzzleInspector) return null;

  const IssueIcon = ({ kind }: { kind: PuzzleIssue['kind'] }) => {
    switch (kind) {
      case 'unpaired':
        return <Unlink size={14} className="text-yellow-400 shrink-0" />;
      case 'duplicate_target':
        return <Users size={14} className="text-orange-400 shrink-0" />;
      case 'cross_floor':
        return <RefreshCcw size={14} className="text-cyan-400 shrink-0" />;
      case 'dangling_ref':
        return <AlertOctagon size={14} className="text-red-400 shrink-0" />;
      case 'asymmetric':
        return <AlertTriangle size={14} className="text-orange-500 shrink-0" />;
    }
  };

  const IssueBadge = ({ kind, count }: { kind: PuzzleIssue['kind']; count: number }) => {
    if (count === 0) return null;
    const styles: Record<PuzzleIssue['kind'], string> = {
      unpaired: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400',
      duplicate_target: 'bg-orange-500/10 border-orange-500/40 text-orange-400',
      cross_floor: 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400',
      dangling_ref: 'bg-red-500/10 border-red-500/40 text-red-400',
      asymmetric: 'bg-orange-500/10 border-orange-500/40 text-orange-500',
    };
    const labels: Record<PuzzleIssue['kind'], string> = {
      unpaired: '未配对',
      duplicate_target: '重复配对',
      cross_floor: '跨楼层',
      dangling_ref: '悬挂引用',
      asymmetric: '关联不对称',
    };
    return (
      <span className={`text-[11px] px-1.5 py-0.5 rounded border ${styles[kind]} font-medium flex items-center gap-0.5`}>
        <IssueIcon kind={kind} />
        {labels[kind]} {count}
      </span>
    );
  };

  const fixButtonConfig = (iss: PuzzleIssue): { label: string; className: string } | null => {
    switch (iss.kind) {
      case 'dangling_ref':
        return { label: '清空无效引用', className: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/40' };
      case 'asymmetric':
        return { label: '补齐反向关联', className: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/40' };
      case 'duplicate_target':
        return { label: `保留${iss.markerName}，取消${iss.otherMarkerName}`, className: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/40' };
      case 'unpaired':
        return { label: '前往详情编辑', className: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/40' };
      case 'cross_floor':
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-horror-surface border border-horror-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-slide-up box-shadow-glow">
        <div className="flex items-center justify-between px-5 py-3 border-b border-horror-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-500/30 to-red-500/30 border border-yellow-500/30 flex items-center justify-center">
              <Key size={18} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg font-semibold text-white tracking-wide">解谜链路全局检查</h2>
              <p className="text-[11px] text-horror-muted">快速找出钥匙与门锁的断链、重复和异常，支持一键修复</p>
            </div>
          </div>
          <button
            onClick={() => setShowPuzzleInspector(false)}
            className="p-1.5 rounded hover:bg-horror-surface2 text-horror-muted hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-horror-border bg-horror-surface2/40 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-horror-muted flex items-center gap-1">
              <Key size={12} className="text-yellow-400" /> 共 <span className="text-white font-medium">{stats.totalKeys}</span> 把钥匙
            </span>
            <span className="text-xs text-horror-muted flex items-center gap-1">
              <Lock size={12} className="text-red-400" /> 共 <span className="text-white font-medium">{stats.totalLocks}</span> 把门锁
            </span>
            <span className="text-xs text-horror-muted flex items-center gap-1">
              <Link2 size={12} className="text-cyan-400" /> 双向有效链路 <span className="text-white font-medium">{stats.pairedChains}</span>
            </span>
            <div className="w-px h-4 bg-horror-border mx-1" />
            {stats.totalIssues === 0 ? (
              <span className="text-[11px] px-2 py-0.5 rounded border border-green-500/40 bg-green-500/10 text-green-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={12} /> 未发现问题
              </span>
            ) : (
              <>
                <span className="text-xs text-horror-muted">
                  发现 <span className="text-red-400 font-medium">{stats.totalIssues}</span> 项问题:
                </span>
                <IssueBadge kind="unpaired" count={stats.issueCounts.unpaired} />
                <IssueBadge kind="duplicate_target" count={stats.issueCounts.duplicate} />
                <IssueBadge kind="cross_floor" count={stats.issueCounts.crossFloor} />
                <IssueBadge kind="asymmetric" count={stats.issueCounts.asymmetric} />
                <IssueBadge kind="dangling_ref" count={stats.issueCounts.dangling} />
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {issues.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-red-400 mb-2.5 flex items-center gap-1.5">
                <AlertTriangle size={14} /> 问题清单（{issues.length}）—— 每条问题可直接修复
              </h3>
              <div className="space-y-2">
                {issues.map((iss, idx) => {
                  const styleByKind: Record<PuzzleIssue['kind'], string> = {
                    unpaired: 'border-yellow-500/30 bg-yellow-500/5',
                    duplicate_target: 'border-orange-500/30 bg-orange-500/5',
                    cross_floor: 'border-cyan-500/30 bg-cyan-500/5',
                    dangling_ref: 'border-red-500/30 bg-red-500/5',
                    asymmetric: 'border-orange-600/30 bg-orange-600/5',
                  };
                  const fixCfg = fixButtonConfig(iss);
                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border px-3 py-2.5 text-[12px] transition-all ${styleByKind[iss.kind]}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5"><IssueIcon kind={iss.kind} /></div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {iss.kind === 'unpaired' && (
                            <>
                              <div className="text-horror-text">
                                {iss.markerType === 'key' ? <Key size={12} className="inline text-yellow-400 mr-1" /> : <Lock size={12} className="inline text-red-400 mr-1" />}
                                <span className="text-white font-medium">{iss.markerName}</span>
                                <span className="text-horror-muted"> 位于 </span>
                                <span className="text-white">{iss.roomName}</span>
                                <span className="text-horror-muted">（{iss.floorName}）</span>
                                <span className="text-yellow-400 font-medium"> 尚未配对</span>
                              </div>
                              <div className="text-[11px] text-horror-muted">
                                需要为这把{iss.markerType === 'key' ? '钥匙选择门锁' : '门锁选择钥匙'}，否则解谜链路会断在起点
                              </div>
                            </>
                          )}
                          {iss.kind === 'duplicate_target' && (
                            <>
                              <div className="text-horror-text">
                                {iss.markerType === 'key' ? <Key size={12} className="inline text-yellow-400 mr-1" /> : <Lock size={12} className="inline text-red-400 mr-1" />}
                                <span className="text-white font-medium">{iss.markerName}</span>
                                <span className="text-horror-muted"> 和 </span>
                                <span className="text-white font-medium">{iss.otherMarkerName}</span>
                                <span className="text-horror-muted">（{iss.otherRoomName}）</span>
                                <span className="text-orange-400 font-medium"> 同时指向同一目标 </span>
                                <span className="text-white">{iss.targetName}</span>
                                <span className="text-horror-muted">（{iss.targetRoomName}）</span>
                              </div>
                              <div className="text-[11px] text-horror-muted">
                                {iss.markerType === 'key' ? '两把钥匙开同一扇门' : '两扇门由同一把钥匙开启'}——点击右侧按钮可解除另一标记的配对
                              </div>
                            </>
                          )}
                          {iss.kind === 'cross_floor' && (
                            <>
                              <div className="text-horror-text">
                                <Key size={12} className="inline text-yellow-400 mr-1" />
                                <span className="text-white font-medium">{iss.markerName}</span>
                                <span className="text-horror-muted">（{iss.markerFloorName}·{iss.markerRoomName}）</span>
                                <span className="text-cyan-400 font-medium"> 跨楼层配对 </span>
                                <Lock size={12} className="inline text-red-400 mx-1" />
                                <span className="text-white font-medium">{iss.targetName}</span>
                                <span className="text-horror-muted">（{iss.targetFloorName}·{iss.targetRoomName}）</span>
                              </div>
                              <div className="text-[11px] text-horror-muted flex items-center gap-1">
                                <Eye size={11} /> 跨层解谜需确保玩家动线可达——若中间未解锁可能会卡关，建议设计时人工确认
                              </div>
                            </>
                          )}
                          {iss.kind === 'dangling_ref' && (
                            <>
                              <div className="text-horror-text">
                                {iss.markerType === 'key' ? <Key size={12} className="inline text-yellow-400 mr-1" /> : <Lock size={12} className="inline text-red-400 mr-1" />}
                                <span className="text-white font-medium">{iss.markerName}</span>
                                <span className="text-horror-muted"> 位于 </span>
                                <span className="text-white">{iss.roomName}</span>
                                <span className="text-red-400 font-medium"> 关联对象已失效（{iss.reason}）</span>
                              </div>
                              <div className="text-[11px] text-horror-muted">
                                需要重新为该{iss.markerType === 'key' ? '钥匙' : '门锁'}指定关联对象，或先清空无效引用
                              </div>
                            </>
                          )}
                          {iss.kind === 'asymmetric' && (
                            <>
                              <div className="text-horror-text">
                                {iss.markerType === 'key' ? <Key size={12} className="inline text-yellow-400 mr-1" /> : <Lock size={12} className="inline text-red-400 mr-1" />}
                                <span className="text-white font-medium">{iss.markerName}</span>
                                <span className="text-horror-muted">（{iss.roomName}）</span>
                                <span className="text-orange-500 font-medium"> 指向 </span>
                                {iss.markerType === 'key' ? <Lock size={12} className="inline text-red-400 mx-1" /> : <Key size={12} className="inline text-yellow-400 mx-1" />}
                                <span className="text-white font-medium">{iss.targetName}</span>
                                <span className="text-horror-muted">（{iss.targetRoomName}）</span>
                                <span className="text-orange-500 font-medium">，但对方未反向指向</span>
                              </div>
                              <div className="text-[11px] text-horror-muted">
                                数据双向不一致，点击右侧按钮自动补齐反向关联
                              </div>
                            </>
                          )}
                        </div>
                        {fixCfg && (
                          <button
                            onClick={() => handleFix(iss)}
                            className={`shrink-0 self-center text-[11px] px-2 py-1 rounded border flex items-center gap-1 transition-colors ${fixCfg.className}`}
                            title="点击自动修复"
                          >
                            <Wrench size={11} />
                            {fixCfg.label}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-semibold text-cyan-400 mb-2.5 flex items-center gap-1.5">
              <Link2 size={14} /> 完整链路一览（按楼层排序）
            </h3>
            {chains.length === 0 ? (
              <div className="text-center py-6 text-horror-muted text-sm border border-dashed border-horror-border rounded-lg">
                暂无任何已建立的钥匙-门锁链路
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {chains.map((c, i) => {
                  const sourceIcon = c.source.type === 'key' ? <Key size={13} className="text-yellow-400 shrink-0" /> : <Lock size={13} className="text-red-400 shrink-0" />;
                  const targetIcon = c.target?.type === 'key' ? <Key size={13} className="text-yellow-400 shrink-0" /> : <Lock size={13} className="text-red-400 shrink-0" />;
                  const issueBadges: React.ReactNode[] = [];
                  if (!c.target) issueBadges.push(<span key="d" className="text-[10px] px-1 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400">悬挂引用</span>);
                  else if (!c.targetPointsBack) issueBadges.push(<span key="a" className="text-[10px] px-1 py-0.5 rounded border border-orange-500/40 bg-orange-500/10 text-orange-500">单向</span>);
                  if (c.crossFloor) issueBadges.push(<span key="c" className="text-[10px] px-1 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">跨楼层</span>);
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border px-3 py-2.5 transition-all hover:border-cyan-500/40 ${
                        !c.target || !c.targetPointsBack || c.crossFloor
                          ? 'border-horror-border bg-horror-surface2/30'
                          : 'border-green-500/20 bg-green-500/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {sourceIcon}
                        <div className="min-w-0">
                          <div className="text-sm text-white font-medium truncate">{c.source.name}</div>
                          <div className="text-[10px] text-horror-muted flex items-center gap-1">
                            <Layers size={9} /> {c.sourceFloorName}
                            <MapPin size={9} className="ml-1" /> {c.sourceRoomName}
                          </div>
                        </div>
                        <ArrowRight size={14} className={`mx-1 shrink-0 ${c.target && c.targetPointsBack ? 'text-green-400' : 'text-orange-400'}`} />
                        {c.target ? (
                          <>
                            {targetIcon}
                            <div className="min-w-0">
                              <div className="text-sm text-white font-medium truncate">{c.target.name}</div>
                              <div className="text-[10px] text-horror-muted flex items-center gap-1">
                                <Layers size={9} /> {c.targetFloorName}
                                <MapPin size={9} className="ml-1" /> {c.targetRoomName}
                              </div>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-red-400">⚠ 目标已丢失</span>
                        )}
                      </div>
                      {issueBadges.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-horror-border/60 flex-wrap">
                          {issueBadges}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="px-5 py-2.5 border-t border-horror-border bg-horror-surface2/40 shrink-0 flex items-center justify-between text-[11px] text-horror-muted">
          <span>绿色卡片=双向有效链路；跨楼层问题需人工确认动线，其余问题点按钮即可修复</span>
          <button
            onClick={() => setShowPuzzleInspector(false)}
            className="horror-btn-primary text-xs py-1 px-3 flex items-center gap-1"
          >
            <CheckCircle2 size={12} /> 确认并关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default PuzzleInspector;
