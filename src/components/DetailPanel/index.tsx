import { useBlueprintStore } from '@/store/useBlueprintStore';
import { useMemo, useState } from 'react';
import {
  BookOpen, Gamepad2, Volume2, Edit2, Check, X, Save,
  Trash2, AlertTriangle, Key, Lock, Link2, Map,
  ClipboardList,
} from 'lucide-react';
import type { RoomStatus, GameplayMarker } from '@/types';
import StoryTab from './StoryTab';
import GameplayTab from './GameplayTab';
import AudioTab from './AudioTab';
import CollabTab from './CollabTab';

const statusOptions: { value: RoomStatus; label: string }[] = [
  { value: 'normal', label: '普通' },
  { value: 'explorable', label: '可探索' },
  { value: 'locked', label: '封锁' },
  { value: 'second_run', label: '二周目变化' },
];

const tabs = [
  { key: 'story', label: '剧情', icon: <BookOpen size={14} /> },
  { key: 'gameplay', label: '玩法', icon: <Gamepad2 size={14} /> },
  { key: 'audio', label: '音效', icon: <Volume2 size={14} /> },
  { key: 'collab', label: '协作', icon: <ClipboardList size={14} /> },
] as const;

const DetailPanel = () => {
  const {
    rooms,
    gameplayMarkers,
    selectedRoomId,
    detailTab,
    setDetailTab,
    updateRoom,
    createVersion,
    removeRoom,
    selectRoom,
  } = useBlueprintStore();

  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [versionReason, setVersionReason] = useState('');
  const [showVersionInput, setShowVersionInput] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const room = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  const { puzzleLinks, connectedRoomNames } = useMemo(() => {
    if (!room) return { puzzleLinks: [] as Array<{ marker: GameplayMarker; target: GameplayMarker; targetRoomName: string }>, connectedRoomNames: [] as string[] };
    const roomMarkers = gameplayMarkers.filter((m) => m.roomId === room.id && (m.type === 'key' || m.type === 'door_lock'));
    const links = roomMarkers
      .filter((m) => m.linkedTo)
      .map((m) => {
        const target = gameplayMarkers.find((g) => g.id === m.linkedTo);
        if (!target) return null;
        const targetRoom = rooms.find((r) => r.id === target.roomId);
        return { marker: m, target, targetRoomName: targetRoom?.name || '未知房间' };
      })
      .filter(Boolean) as Array<{ marker: GameplayMarker; target: GameplayMarker; targetRoomName: string }>;
    const connNames = room.connections
      .map((cid) => rooms.find((r) => r.id === cid)?.name)
      .filter(Boolean) as string[];
    return { puzzleLinks: links, connectedRoomNames: connNames };
  }, [room, gameplayMarkers, rooms]);

  const handleSaveName = () => {
    if (!room || !editName.trim()) return;
    updateRoom(room.id, { name: editName.trim() });
    setEditingName(false);
  };

  const handleSaveDesc = () => {
    if (!room) return;
    updateRoom(room.id, { description: editDesc });
    setEditingDesc(false);
  };

  const handleCreateVersion = () => {
    if (!room || !versionReason.trim()) return;
    createVersion(room.id, versionReason.trim(), '当前用户');
    setVersionReason('');
    setShowVersionInput(false);
  };

  const handleConfirmDelete = () => {
    if (!room) return;
    removeRoom(room.id);
    selectRoom(null);
    setConfirmingDelete(false);
  };

  if (!room) {
    return (
      <div className="w-80 bg-horror-surface border-l border-horror-border flex flex-col items-center justify-center p-6 shrink-0">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-horror-surface2 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-horror-muted" size={28} />
          </div>
          <h3 className="text-horror-text font-cinzel text-base mb-2">未选择区域</h3>
          <p className="text-horror-muted text-sm">在左侧蓝图上点击一个房间区域</p>
          <p className="text-horror-muted text-xs mt-1">查看和编辑该区域的详细信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-horror-surface border-l border-horror-border flex flex-col shrink-0">
      <div className="p-4 border-b border-horror-border">
        <div className="flex items-start justify-between mb-2 gap-2">
          {editingName ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                className="horror-input text-sm font-cinzel font-semibold py-1"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
              <button onClick={handleSaveName} className="p-1 text-green-400 hover:bg-green-500/10 rounded">
                <Check size={14} />
              </button>
              <button onClick={() => setEditingName(false)} className="p-1 text-horror-muted hover:bg-horror-surface2 rounded">
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-cinzel text-lg font-semibold text-white tracking-wide leading-tight">
                {room.name}
              </h2>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => { setEditingName(true); setEditName(room.name); }}
                  className="p-1 text-horror-muted hover:text-white hover:bg-horror-surface2 rounded transition-colors"
                  title="重命名"
                >
                  <Edit2 size={14} />
                </button>
                {confirmingDelete ? (
                  <div className="flex items-center gap-0.5 animate-fade-in">
                    <button
                      onClick={handleConfirmDelete}
                      className="p-1 text-red-400 bg-red-500/10 rounded hover:bg-red-500/20 transition-colors"
                      title="确认删除"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="p-1 text-horror-muted bg-horror-surface2 rounded hover:bg-horror-border transition-colors"
                      title="取消"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="p-1 text-horror-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="删除房间"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {confirmingDelete && (
          <div className="mb-3 text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5 flex items-start gap-1.5 animate-fade-in">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>将删除此房间的全部节点、标记、音效、评论和历史版本，且无法恢复。</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-horror-muted">状态:</span>
          <select
            className="horror-input text-xs py-1 flex-1"
            value={room.status}
            onChange={(e) => updateRoom(room.id, { status: e.target.value as RoomStatus })}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {(connectedRoomNames.length > 0 || puzzleLinks.length > 0) && (
          <div className="mb-3 space-y-1.5 border-t border-horror-border pt-3">
            {connectedRoomNames.length > 0 && (
              <div className="text-[11px] flex items-start gap-1.5 text-horror-muted">
                <Map size={11} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  连通 <span className="text-cyan-300 font-medium">{connectedRoomNames.length}</span> 区域：
                  {connectedRoomNames.map((n, i) => (
                    <span key={n}>
                      <span className="text-white">{n}</span>
                      {i < connectedRoomNames.length - 1 && '、'}
                    </span>
                  ))}
                </span>
              </div>
            )}
            {puzzleLinks.length > 0 && (
              <div className="text-[11px] flex flex-col gap-1">
                <div className="flex items-start gap-1.5 text-horror-muted">
                  <Key size={11} className="text-yellow-400 shrink-0 mt-0.5" />
                  <span>解谜链路 <span className="text-yellow-300 font-medium">({puzzleLinks.length})</span>：</span>
                </div>
                <div className="pl-4 space-y-1">
                  {puzzleLinks.map(({ marker, target, targetRoomName }) => (
                    <div
                      key={marker.id + '-' + target.id}
                      className="flex items-center gap-1 text-[11px] text-horror-text bg-horror-surface2/60 rounded px-1.5 py-1 flex-wrap"
                    >
                      {marker.type === 'key' ? (
                        <>
                          <Key size={10} className="text-yellow-400 shrink-0" />
                          <span className="text-yellow-300">{marker.name}</span>
                          <Link2 size={9} className="text-cyan-400 shrink-0" />
                          <Lock size={10} className="text-red-400 shrink-0" />
                          <span className="text-red-300">{target.name}</span>
                          <span className="text-horror-muted text-[10px]">（{targetRoomName}）</span>
                        </>
                      ) : (
                        <>
                          <Lock size={10} className="text-red-400 shrink-0" />
                          <span className="text-red-300">{marker.name}</span>
                          <Link2 size={9} className="text-cyan-400 shrink-0" />
                          <Key size={10} className="text-yellow-400 shrink-0" />
                          <span className="text-yellow-300">{target.name}</span>
                          <span className="text-horror-muted text-[10px]">（{targetRoomName}）</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          {editingDesc ? (
            <div className="space-y-1">
              <textarea
                className="horror-textarea text-xs"
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-1">
                <button onClick={handleSaveDesc} className="text-xs px-2 py-1 text-green-400 hover:bg-green-500/10 rounded flex items-center gap-1">
                  <Check size={10} /> 保存
                </button>
                <button onClick={() => setEditingDesc(false)} className="text-xs px-2 py-1 text-horror-muted hover:bg-horror-surface2 rounded flex items-center gap-1">
                  <X size={10} /> 取消
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => { setEditingDesc(true); setEditDesc(room.description); }}
              className="text-xs text-horror-muted leading-relaxed cursor-pointer hover:text-horror-text transition-colors group"
            >
              {room.description}
              <Edit2 size={10} className="inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {showVersionInput ? (
          <div className="mt-3 space-y-2 animate-fade-in">
            <input
              className="horror-input text-xs py-1.5"
              placeholder="输入变更说明..."
              value={versionReason}
              onChange={(e) => setVersionReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-1">
              <button onClick={handleCreateVersion} className="horror-btn-primary text-xs py-1 px-2 flex items-center gap-1 flex-1 justify-center">
                <Save size={10} /> 保存版本
              </button>
              <button onClick={() => { setShowVersionInput(false); setVersionReason(''); }} className="horror-btn text-xs py-1 px-2">
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowVersionInput(true)}
            className="mt-3 w-full text-xs py-1.5 border border-dashed border-horror-border rounded text-horror-muted hover:text-horror-accent hover:border-horror-accent/50 transition-all flex items-center justify-center gap-1"
          >
            <Save size={10} /> 保存当前为新版本
          </button>
        )}
      </div>

      <div className="flex border-b border-horror-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setDetailTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs border-b-2 transition-all ${
              detailTab === tab.key
                ? 'horror-tab-active'
                : 'horror-tab'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {detailTab === 'story' && <StoryTab roomId={room.id} />}
        {detailTab === 'gameplay' && <GameplayTab roomId={room.id} />}
        {detailTab === 'audio' && <AudioTab roomId={room.id} />}
        {detailTab === 'collab' && <CollabTab roomId={room.id} />}
      </div>
    </div>
  );
};

export default DetailPanel;
