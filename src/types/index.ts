export type RoomStatus = 'locked' | 'explorable' | 'second_run' | 'normal';

export type StoryTriggerType = 'enter' | 'investigate' | 'leave';

export type GameplayMarkerType = 'door_lock' | 'key' | 'chase_trigger' | 'hiding_spot';

export type ReviewTab = 'comments' | 'versions' | 'review';

export type DetailTab = 'story' | 'gameplay' | 'audio';

export interface Floor {
  id: string;
  name: string;
  floorLevel: number;
}

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  floorId: string;
  connections: string[];
  description: string;
}

export interface StoryBranch {
  id: string;
  condition: string;
  content: string;
}

export interface StoryNode {
  id: string;
  roomId: string;
  triggerType: StoryTriggerType;
  content: string;
  branches?: StoryBranch[];
}

export interface GameplayMarker {
  id: string;
  roomId: string;
  type: GameplayMarkerType;
  name: string;
  description: string;
  linkedTo?: string;
}

export interface AudioNode {
  id: string;
  roomId: string;
  name: string;
  triggerDistance: number;
  volume: number;
  loop: boolean;
  description: string;
}

export interface Comment {
  id: string;
  roomId: string;
  author: string;
  role: string;
  avatar: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
}

export interface RoomSnapshot {
  name: string;
  status: RoomStatus;
  description: string;
  storyNodes: StoryNode[];
  gameplayMarkers: GameplayMarker[];
  audioNodes: AudioNode[];
}

export interface Version {
  id: string;
  roomId: string;
  versionNumber: number;
  snapshot: RoomSnapshot;
  changeReason: string;
  author: string;
  timestamp: string;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  field?: string;
}

export interface BlueprintState {
  floors: Floor[];
  rooms: Room[];
  storyNodes: StoryNode[];
  gameplayMarkers: GameplayMarker[];
  audioNodes: AudioNode[];
  comments: Comment[];
  versions: Version[];
  currentFloorId: string;
  selectedRoomId: string | null;
  zoom: number;
  detailTab: DetailTab;
  reviewTab: ReviewTab;
  reviewPanelOpen: boolean;
  compareVersionIds: [string, string] | null;
}

export interface BlueprintActions {
  setCurrentFloor: (floorId: string) => void;
  selectRoom: (roomId: string | null) => void;
  setZoom: (zoom: number) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  setDetailTab: (tab: DetailTab) => void;
  setReviewTab: (tab: ReviewTab) => void;
  toggleReviewPanel: () => void;
  setReviewPanelOpen: (open: boolean) => void;
  addStoryNode: (roomId: string, node: Omit<StoryNode, 'id' | 'roomId'>) => void;
  updateStoryNode: (nodeId: string, updates: Partial<StoryNode>) => void;
  removeStoryNode: (nodeId: string) => void;
  addGameplayMarker: (roomId: string, marker: Omit<GameplayMarker, 'id' | 'roomId'>) => void;
  updateGameplayMarker: (markerId: string, updates: Partial<GameplayMarker>) => void;
  removeGameplayMarker: (markerId: string) => void;
  addAudioNode: (roomId: string, node: Omit<AudioNode, 'id' | 'roomId'>) => void;
  updateAudioNode: (nodeId: string, updates: Partial<AudioNode>) => void;
  removeAudioNode: (nodeId: string) => void;
  addComment: (roomId: string, comment: Omit<Comment, 'id' | 'roomId' | 'timestamp'>) => void;
  createVersion: (roomId: string, reason: string, author: string) => void;
  setCompareVersionIds: (ids: [string, string] | null) => void;
  saveRoomSnapshot: (roomId: string) => void;
}

export type BlueprintStore = BlueprintState & BlueprintActions;
