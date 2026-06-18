import { useBlueprintStore } from '@/store/useBlueprintStore';
import { Building2, Moon, User, HelpCircle, Bell } from 'lucide-react';

const Header = () => {
  const { floors, currentFloorId, rooms, selectedRoomId } = useBlueprintStore();

  const currentFloor = floors.find((f) => f.id === currentFloorId);
  const currentRoom = rooms.find((r) => r.id === selectedRoomId);
  const currentFloorRooms = rooms.filter((r) => r.floorId === currentFloorId);

  return (
    <header className="h-14 bg-horror-surface border-b border-horror-border flex items-center px-4 gap-4 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-horror-accent to-horror-locked flex items-center justify-center box-shadow-glow">
          <Building2 className="text-white" size={16} />
        </div>
        <div>
          <h1 className="font-cinzel text-sm font-bold text-white tracking-wider">
            HAUNTED BLUEPRINT
          </h1>
          <p className="text-[10px] text-horror-muted -mt-0.5">鬼屋叙事协作蓝图板</p>
        </div>
      </div>

      <div className="w-px h-6 bg-horror-border mx-2" />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-horror-muted">当前楼层:</span>
          <span className="font-cinzel text-sm text-white">
            {currentFloor?.name || '未选择'}
          </span>
          <span className="text-[10px] text-horror-muted">
            ({currentFloorRooms.length} 个区域)
          </span>
        </div>

        {currentRoom && (
          <>
            <div className="w-px h-6 bg-horror-border" />
            <div className="flex items-center gap-2">
              <Moon size={12} className="text-horror-accent animate-flicker" />
              <span className="text-xs text-horror-muted">正在编辑:</span>
              <span className="text-sm text-white">{currentRoom.name}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-horror-muted hover:text-white hover:bg-horror-surface2 transition-all" title="帮助">
          <HelpCircle size={16} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-horror-muted hover:text-white hover:bg-horror-surface2 transition-all relative" title="通知">
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-horror-accent animate-pulse" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-horror-accent/60 to-horror-locked/60 flex items-center justify-center ml-1 border border-horror-accent/40">
          <User size={14} className="text-white" />
        </div>
      </div>
    </header>
  );
};

export default Header;
