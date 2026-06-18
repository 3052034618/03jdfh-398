import { useBlueprintStore } from '@/store/useBlueprintStore';
import {
  Home as HomeIcon,
  Building2,
  Lock,
  Eye,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Plus,
  Layers,
  MessageSquare,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const Toolbar = () => {
  const {
    floors,
    currentFloorId,
    setCurrentFloor,
    zoom,
    setZoom,
    reviewPanelOpen,
    toggleReviewPanel,
  } = useBlueprintStore();

  return (
    <div className="w-16 bg-horror-surface border-r border-horror-border flex flex-col items-center py-4 gap-1 shrink-0">
      <div className="mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-horror-accent to-horror-locked flex items-center justify-center box-shadow-glow">
          <Building2 className="text-white" size={20} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-0.5 mb-4">
        <button
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-horror-muted hover:text-white hover:bg-horror-surface2 transition-all"
          title="放大"
        >
          <ZoomIn size={18} />
        </button>
        <div className="text-[10px] text-horror-muted font-mono py-0.5">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-horror-muted hover:text-white hover:bg-horror-surface2 transition-all"
          title="缩小"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      <div className="w-8 h-px bg-horror-border my-2" />

      <div className="flex flex-col items-center gap-1">
        {floors.map((floor) => (
          <button
            key={floor.id}
            onClick={() => setCurrentFloor(floor.id)}
            className={`
              w-10 h-10 flex flex-col items-center justify-center rounded-lg transition-all
              ${currentFloorId === floor.id
                ? 'bg-horror-accent text-white box-shadow-glow'
                : 'text-horror-muted hover:text-white hover:bg-horror-surface2'
              }
            `}
            title={floor.name}
          >
            <Layers size={16} />
            <span className="text-[9px] font-medium mt-0.5">{floor.floorLevel}F</span>
          </button>
        ))}
      </div>

      <div className="w-8 h-px bg-horror-border my-2" />

      <button
        className="w-10 h-10 flex items-center justify-center rounded-lg text-horror-muted hover:text-white hover:bg-horror-surface2 transition-all"
        title="添加区域"
      >
        <Plus size={18} />
      </button>

      <div className="flex-1" />

      <button
        onClick={toggleReviewPanel}
        className={`
          w-10 h-10 flex items-center justify-center rounded-lg transition-all mb-1
          ${reviewPanelOpen ? 'bg-horror-accent/20 text-horror-accent' : 'text-horror-muted hover:text-white hover:bg-horror-surface2'}
        `}
        title={reviewPanelOpen ? '收起评审面板' : '展开评审面板'}
      >
        {reviewPanelOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      <div className="w-8 h-px bg-horror-border my-2" />

      <div className="flex flex-col items-center gap-2 px-1 w-full">
        <div className="flex items-center gap-1.5 w-full">
          <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-horror-locked/80 to-horror-locked/40 border border-horror-accent" />
          <span className="text-[10px] text-horror-muted flex items-center gap-1">
            <Lock size={10} /> 封锁
          </span>
        </div>
        <div className="flex items-center gap-1.5 w-full">
          <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-horror-explorable/80 to-horror-explorable/40 border border-green-800" />
          <span className="text-[10px] text-horror-muted flex items-center gap-1">
            <Eye size={10} /> 可探索
          </span>
        </div>
        <div className="flex items-center gap-1.5 w-full">
          <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-horror-secondrun/80 to-horror-secondrun/40 border border-purple-800" />
          <span className="text-[10px] text-horror-muted flex items-center gap-1">
            <RefreshCw size={10} /> 二周目
          </span>
        </div>
        <div className="flex items-center gap-1.5 w-full">
          <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-horror-surface2 to-horror-surface border border-horror-border" />
          <span className="text-[10px] text-horror-muted flex items-center gap-1">
            <HomeIcon size={10} /> 普通
          </span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
