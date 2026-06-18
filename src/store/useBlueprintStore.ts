import { create } from 'zustand';
import type { BlueprintStore } from '@/types';
import {
  mockFloors,
  mockRooms,
  mockStoryNodes,
  mockGameplayMarkers,
  mockAudioNodes,
  mockComments,
  mockVersions,
} from '@/data/mockData';
import { generateId, formatNow } from '@/utils/diff';

export const useBlueprintStore = create<BlueprintStore>((set, get) => ({
  floors: mockFloors,
  rooms: mockRooms,
  storyNodes: mockStoryNodes,
  gameplayMarkers: mockGameplayMarkers,
  audioNodes: mockAudioNodes,
  comments: mockComments,
  versions: mockVersions,
  currentFloorId: 'floor-1',
  selectedRoomId: 'room-living',
  zoom: 1,
  detailTab: 'story',
  reviewTab: 'comments',
  reviewPanelOpen: true,
  compareVersionIds: null,

  setCurrentFloor: (floorId) => set({ currentFloorId: floorId, selectedRoomId: null }),

  selectRoom: (roomId) => set({ selectedRoomId: roomId }),

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),

  updateRoom: (roomId, updates) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r)),
    })),

  setDetailTab: (tab) => set({ detailTab: tab }),

  setReviewTab: (tab) => set({ reviewTab: tab }),

  toggleReviewPanel: () => set((state) => ({ reviewPanelOpen: !state.reviewPanelOpen })),

  setReviewPanelOpen: (open) => set({ reviewPanelOpen: open }),

  addStoryNode: (roomId, node) =>
    set((state) => ({
      storyNodes: [
        ...state.storyNodes,
        { ...node, id: generateId('story'), roomId },
      ],
    })),

  updateStoryNode: (nodeId, updates) =>
    set((state) => ({
      storyNodes: state.storyNodes.map((n) =>
        n.id === nodeId ? { ...n, ...updates } : n
      ),
    })),

  removeStoryNode: (nodeId) =>
    set((state) => ({
      storyNodes: state.storyNodes.filter((n) => n.id !== nodeId),
    })),

  addGameplayMarker: (roomId, marker) =>
    set((state) => ({
      gameplayMarkers: [
        ...state.gameplayMarkers,
        { ...marker, id: generateId('gp'), roomId },
      ],
    })),

  updateGameplayMarker: (markerId, updates) =>
    set((state) => ({
      gameplayMarkers: state.gameplayMarkers.map((m) =>
        m.id === markerId ? { ...m, ...updates } : m
      ),
    })),

  removeGameplayMarker: (markerId) =>
    set((state) => ({
      gameplayMarkers: state.gameplayMarkers.filter((m) => m.id !== markerId),
    })),

  addAudioNode: (roomId, node) =>
    set((state) => ({
      audioNodes: [
        ...state.audioNodes,
        { ...node, id: generateId('audio'), roomId },
      ],
    })),

  updateAudioNode: (nodeId, updates) =>
    set((state) => ({
      audioNodes: state.audioNodes.map((a) =>
        a.id === nodeId ? { ...a, ...updates } : a
      ),
    })),

  removeAudioNode: (nodeId) =>
    set((state) => ({
      audioNodes: state.audioNodes.filter((a) => a.id !== nodeId),
    })),

  addComment: (roomId, comment) =>
    set((state) => ({
      comments: [
        ...state.comments,
        { ...comment, id: generateId('comment'), roomId, timestamp: formatNow() },
      ],
    })),

  createVersion: (roomId, reason, author) => {
    const state = get();
    const room = state.rooms.find((r) => r.id === roomId);
    if (!room) return;

    const roomStory = state.storyNodes.filter((n) => n.roomId === roomId);
    const roomMarkers = state.gameplayMarkers.filter((m) => m.roomId === roomId);
    const roomAudio = state.audioNodes.filter((a) => a.roomId === roomId);
    const existingVersions = state.versions.filter((v) => v.roomId === roomId);
    const nextNumber = existingVersions.length > 0
      ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1
      : 1;

    const newVersion = {
      id: generateId('v'),
      roomId,
      versionNumber: nextNumber,
      snapshot: {
        name: room.name,
        status: room.status,
        description: room.description,
        storyNodes: JSON.parse(JSON.stringify(roomStory)),
        gameplayMarkers: JSON.parse(JSON.stringify(roomMarkers)),
        audioNodes: JSON.parse(JSON.stringify(roomAudio)),
      },
      changeReason: reason,
      author,
      timestamp: formatNow(),
    };

    set((state) => ({ versions: [...state.versions, newVersion] }));
  },

  setCompareVersionIds: (ids) => set({ compareVersionIds: ids }),

  saveRoomSnapshot: (roomId) => {
    get().createVersion(roomId, '保存快照', '系统');
  },
}));
