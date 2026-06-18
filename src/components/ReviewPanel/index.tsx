import { useBlueprintStore } from '@/store/useBlueprintStore';
import { MessageSquare, Clock, GitCompare, ChevronDown, ChevronUp, X } from 'lucide-react';
import Comments from './Comments';
import VersionHistory from './VersionHistory';
import VersionDiff from './VersionDiff';

const tabs = [
  { key: 'comments', label: '团队评论', icon: <MessageSquare size={14} /> },
  { key: 'versions', label: '版本历史', icon: <Clock size={14} /> },
  { key: 'review', label: '版本对比', icon: <GitCompare size={14} /> },
] as const;

const ReviewPanel = () => {
  const {
    reviewPanelOpen,
    reviewTab,
    setReviewTab,
    toggleReviewPanel,
    selectedRoomId,
    compareVersionIds,
  } = useBlueprintStore();

  if (!reviewPanelOpen) {
    return (
      <div className="bg-horror-surface border-t border-horror-border h-10 flex items-center px-4 justify-between shrink-0">
        <span className="text-xs text-horror-muted">评审面板已收起</span>
        <button
          onClick={toggleReviewPanel}
          className="flex items-center gap-1 text-xs text-horror-muted hover:text-white transition-colors"
        >
          <ChevronUp size={14} />
          展开
        </button>
      </div>
    );
  }

  return (
    <div className="bg-horror-surface border-t border-horror-border h-72 flex flex-col shrink-0 animate-slide-up">
      <div className="flex items-center justify-between border-b border-horror-border px-4 shrink-0">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setReviewTab(tab.key)}
              className={`
                flex items-center gap-1.5 py-2.5 px-4 text-xs border-b-2 transition-all
                ${reviewTab === tab.key ? 'horror-tab-active' : 'horror-tab'}
                ${tab.key === 'review' && compareVersionIds ? 'text-blue-400' : ''}
              `}
            >
              {tab.icon}
              {tab.label}
              {tab.key === 'review' && compareVersionIds && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>
        <button
          onClick={toggleReviewPanel}
          className="p-1.5 rounded text-horror-muted hover:text-white hover:bg-horror-surface2 transition-colors"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="flex-1 p-3 overflow-hidden">
        {reviewTab === 'comments' && <Comments roomId={selectedRoomId} />}
        {reviewTab === 'versions' && <VersionHistory roomId={selectedRoomId} />}
        {reviewTab === 'review' && <VersionDiff roomId={selectedRoomId} />}
      </div>
    </div>
  );
};

export default ReviewPanel;
