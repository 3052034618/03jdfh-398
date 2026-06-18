import { useMemo } from 'react';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import { GitCompare, Plus, Minus, Equal, ArrowRight } from 'lucide-react';
import { computeDiff, snapshotToText } from '@/utils/diff';

interface VersionDiffProps {
  roomId: string | null;
}

const VersionDiff = ({ roomId }: VersionDiffProps) => {
  const { versions, compareVersionIds, setCompareVersionIds } = useBlueprintStore();

  const { v1, v2, diff } = useMemo(() => {
    if (!compareVersionIds || !roomId) return { v1: null, v2: null, diff: [] };
    const ver1 = versions.find((v) => v.id === compareVersionIds[0]);
    const ver2 = versions.find((v) => v.id === compareVersionIds[1]);
    if (!ver1 || !ver2) return { v1: null, v2: null, diff: [] };
    return {
      v1: ver1,
      v2: ver2,
      diff: computeDiff(ver1.snapshot, ver2.snapshot),
    };
  }, [compareVersionIds, versions, roomId]);

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-horror-muted text-sm">
        请先选择一个房间区域
      </div>
    );
  }

  if (!compareVersionIds || !v1 || !v2) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-horror-muted text-sm">
        <GitCompare size={32} className="mb-3 opacity-30" />
        <p>未选择对比版本</p>
        <p className="text-xs mt-1">请在"版本历史"标签页中选择两个版本进行对比</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-horror-border">
        <div className="horror-card px-3 py-2 text-xs">
          <div className="text-horror-muted mb-0.5">旧版本</div>
          <div className="flex items-center gap-2">
            <span className="font-cinzel font-bold text-white">v{v1.versionNumber}</span>
            <span className="text-horror-muted">{v1.changeReason}</span>
          </div>
        </div>
        <ArrowRight size={16} className="text-horror-accent" />
        <div className="horror-card px-3 py-2 text-xs border-horror-accent/50">
          <div className="text-horror-muted mb-0.5">新版本</div>
          <div className="flex items-center gap-2">
            <span className="font-cinzel font-bold text-horror-accent">v{v2.versionNumber}</span>
            <span className="text-horror-muted">{v2.changeReason}</span>
          </div>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setCompareVersionIds(null)}
          className="text-xs text-horror-muted hover:text-horror-accent transition-colors"
        >
          清除对比
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <div className="text-xs text-horror-muted mb-2 px-2">v{v1.versionNumber} - {v1.timestamp}</div>
          <div className="flex-1 overflow-auto horror-card p-3 font-mono text-xs whitespace-pre-wrap">
            {snapshotToText(v1.snapshot)}
          </div>
        </div>
        <div className="flex flex-col min-h-0">
          <div className="text-xs text-horror-muted mb-2 px-2">v{v2.versionNumber} - {v2.timestamp}</div>
          <div className="flex-1 overflow-auto horror-card p-3">
            {diff.map((line, idx) => (
              <div
                key={idx}
                className={`
                  font-mono text-xs whitespace-pre-wrap py-0.5 px-1 -mx-1 rounded mb-0.5 flex items-start gap-2
                  ${line.type === 'added' ? 'bg-green-500/10 text-green-400' : ''}
                  ${line.type === 'removed' ? 'bg-red-500/10 text-red-400 line-through' : ''}
                  ${line.type === 'unchanged' ? 'text-horror-muted' : ''}
                `}
              >
                <span className="shrink-0 w-4 text-center">
                  {line.type === 'added' && <Plus size={10} />}
                  {line.type === 'removed' && <Minus size={10} />}
                  {line.type === 'unchanged' && <Equal size={10} className="opacity-30" />}
                </span>
                <span className="flex-1">{line.content || '\u00A0'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionDiff;
