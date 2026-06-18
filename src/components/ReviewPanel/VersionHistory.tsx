import { useMemo, useState } from 'react';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import {
  Clock, GitCompare, X, ArrowRight, User,
  Home, BookOpen, Gamepad2, Volume2, ClipboardList,
} from 'lucide-react';
import { computeDiff } from '@/utils/diff';

interface VersionHistoryProps {
  roomId: string | null;
}

const VersionHistory = ({ roomId }: VersionHistoryProps) => {
  const { versions, compareVersionIds, setCompareVersionIds } = useBlueprintStore();
  const [selectedForCompare, setSelectedForCompare] = useState<string | null>(null);

  const roomVersions = useMemo(() => {
    if (!roomId) return [];
    return versions
      .filter((v) => v.roomId === roomId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }, [versions, roomId]);

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

  return (
    <div className="h-full overflow-y-auto pr-2">
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

      <div className="space-y-2">
        {roomVersions.map((version, idx) => {
          const isSelected = selectedForCompare === version.id;
          const isInComparePair = compareVersionIds?.includes(version.id);
          const s = version.changeStats;

          return (
            <div
              key={version.id}
              className={`
                relative horror-card p-3 cursor-pointer transition-all
                ${isSelected ? 'ring-2 ring-horror-accent box-shadow-glow' : ''}
                ${isInComparePair ? 'ring-1 ring-blue-500/50 bg-blue-500/5' : ''}
                hover:border-horror-accent/40
              `}
              onClick={() => handleCompareClick(version.id)}
            >
              {idx < roomVersions.length - 1 && (
                <div className="absolute left-5 -bottom-2 w-px h-4 bg-horror-border" />
              )}

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-horror-surface2 flex items-center justify-center shrink-0 border border-horror-border">
                  <span className="text-xs font-cinzel font-bold text-horror-accent">v{version.versionNumber}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium">{version.changeReason}</span>
                    </div>
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VersionHistory;
