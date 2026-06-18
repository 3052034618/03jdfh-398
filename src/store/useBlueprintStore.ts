import { create } from 'zustand';
import type { BlueprintStore, Room, RoomStatus } from '@/types';
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

const STORAGE_KEY = 'haunted-blueprint-state-v1';

type PersistedState = {
  floors: BlueprintStore['floors'];
  rooms: BlueprintStore['rooms'];
  storyNodes: BlueprintStore['storyNodes'];
  gameplayMarkers: BlueprintStore['gameplayMarkers'];
  audioNodes: BlueprintStore['audioNodes'];
  comments: BlueprintStore['comments'];
  versions: BlueprintStore['versions'];
  currentFloorId: BlueprintStore['currentFloorId'];
};

const defaultPersisted: PersistedState = {
  floors: mockFloors,
  rooms: mockRooms,
  storyNodes: mockStoryNodes,
  gameplayMarkers: mockGameplayMarkers,
  audioNodes: mockAudioNodes,
  comments: mockComments,
  versions: mockVersions,
  currentFloorId: 'floor-1',
};

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersisted;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed.floors || !parsed.rooms) return defaultPersisted;
    return parsed;
  } catch {
    return defaultPersisted;
  }
}

function savePersisted(state: BlueprintStore) {
  try {
    const toSave: PersistedState = {
      floors: state.floors,
      rooms: state.rooms,
      storyNodes: state.storyNodes,
      gameplayMarkers: state.gameplayMarkers,
      audioNodes: state.audioNodes,
      comments: state.comments,
      versions: state.versions,
      currentFloorId: state.currentFloorId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

export const useBlueprintStore = create<BlueprintStore>((set, get) => {
  const initial = loadPersisted();

  return {
    floors: initial.floors,
    rooms: initial.rooms,
    storyNodes: initial.storyNodes,
    gameplayMarkers: initial.gameplayMarkers,
    audioNodes: initial.audioNodes,
    comments: initial.comments,
    versions: initial.versions,
    currentFloorId: initial.currentFloorId,
    selectedRoomId: null,
    zoom: 1,
    detailTab: 'story',
    reviewTab: 'comments',
    reviewPanelOpen: true,
    compareVersionIds: null,
    connectingFromRoomId: null,
    showAddFloorModal: false,
    showAddRoomModal: false,

    hydrateFromStorage: () => {
      const loaded = loadPersisted();
      set({
        floors: loaded.floors,
        rooms: loaded.rooms,
        storyNodes: loaded.storyNodes,
        gameplayMarkers: loaded.gameplayMarkers,
        audioNodes: loaded.audioNodes,
        comments: loaded.comments,
        versions: loaded.versions,
        currentFloorId: loaded.currentFloorId,
      });
    },

    setCurrentFloor: (floorId) => {
      set({ currentFloorId: floorId, selectedRoomId: null, connectingFromRoomId: null });
      savePersisted(get());
    },

    selectRoom: (roomId) => set({ selectedRoomId: roomId }),

    setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),

    updateRoom: (roomId, updates) => {
      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r)),
      }));
      savePersisted(get());
    },

    setDetailTab: (tab) => set({ detailTab: tab }),

    setReviewTab: (tab) => set({ reviewTab: tab }),

    toggleReviewPanel: () => set((state) => ({ reviewPanelOpen: !state.reviewPanelOpen })),

    setReviewPanelOpen: (open) => set({ reviewPanelOpen: open }),

    addFloor: (name, floorLevel) => {
      const id = generateId('floor');
      set((state) => ({
        floors: [...state.floors, { id, name, floorLevel }],
        currentFloorId: id,
        selectedRoomId: null,
      }));
      savePersisted(get());
      return id;
    },

    addRoom: (room) => {
      const id = generateId('room');
      const newRoom: Room = { ...room, id, connections: [] };
      set((state) => ({
        rooms: [...state.rooms, newRoom],
        selectedRoomId: id,
      }));
      savePersisted(get());
    },

    removeRoom: (roomId) => {
      set((state) => ({
        rooms: state.rooms
          .filter((r) => r.id !== roomId)
          .map((r) => ({
            ...r,
            connections: r.connections.filter((c) => c !== roomId),
          })),
        storyNodes: state.storyNodes.filter((n) => n.roomId !== roomId),
        gameplayMarkers: state.gameplayMarkers.filter((m) => m.roomId !== roomId),
        audioNodes: state.audioNodes.filter((a) => a.roomId !== roomId),
        comments: state.comments.filter((c) => c.roomId !== roomId),
        versions: state.versions.filter((v) => v.roomId !== roomId),
        selectedRoomId: state.selectedRoomId === roomId ? null : state.selectedRoomId,
        connectingFromRoomId:
          state.connectingFromRoomId === roomId ? null : state.connectingFromRoomId,
      }));
      savePersisted(get());
    },

    addConnection: (roomAId, roomBId) => {
      if (roomAId === roomBId) return;
      set((state) => ({
        rooms: state.rooms.map((r) => {
          if (r.id === roomAId && !r.connections.includes(roomBId)) {
            return { ...r, connections: [...r.connections, roomBId] };
          }
          if (r.id === roomBId && !r.connections.includes(roomAId)) {
            return { ...r, connections: [...r.connections, roomAId] };
          }
          return r;
        }),
      }));
      savePersisted(get());
    },

    removeConnection: (roomAId, roomBId) => {
      set((state) => ({
        rooms: state.rooms.map((r) => {
          if (r.id === roomAId) {
            return { ...r, connections: r.connections.filter((c) => c !== roomBId) };
          }
          if (r.id === roomBId) {
            return { ...r, connections: r.connections.filter((c) => c !== roomAId) };
          }
          return r;
        }),
      }));
      savePersisted(get());
    },

    setConnectingFrom: (roomId) => set({ connectingFromRoomId: roomId }),

    addStoryNode: (roomId, node) => {
      set((state) => ({
        storyNodes: [
          ...state.storyNodes,
          { ...node, id: generateId('story'), roomId },
        ],
      }));
      savePersisted(get());
    },

    updateStoryNode: (nodeId, updates) => {
      set((state) => ({
        storyNodes: state.storyNodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates } : n
        ),
      }));
      savePersisted(get());
    },

    removeStoryNode: (nodeId) => {
      set((state) => ({
        storyNodes: state.storyNodes.filter((n) => n.id !== nodeId),
        audioNodes: state.audioNodes.map((a) =>
          a.attachedTo?.type === 'story' && a.attachedTo.id === nodeId
            ? { ...a, attachedTo: null }
            : a
        ),
      }));
      savePersisted(get());
    },

    addGameplayMarker: (roomId, marker) => {
      const { linkedTo, ...rest } = marker;
      const newId = generateId('gp');
      set((state) => {
        let nextMarkers = [
          ...state.gameplayMarkers,
          { ...rest, id: newId, roomId, linkedTo: linkedTo || undefined },
        ];
        if (linkedTo) {
          nextMarkers = nextMarkers.map((m) =>
            m.id === linkedTo ? { ...m, linkedTo: newId } : m
          );
        }
        return { gameplayMarkers: nextMarkers };
      });
      savePersisted(get());
    },

    updateGameplayMarker: (markerId, updates) => {
      set((state) => {
        const old = state.gameplayMarkers.find((m) => m.id === markerId);
        const oldLinked = old?.linkedTo;
        const newLinked = updates.linkedTo;

        let nextMarkers = state.gameplayMarkers.map((m) =>
          m.id === markerId ? { ...m, ...updates } : m
        );

        if (newLinked !== undefined && newLinked !== oldLinked) {
          nextMarkers = nextMarkers.map((m) => {
            if (oldLinked && m.id === oldLinked && m.linkedTo === markerId) {
              const { linkedTo: _removed, ...rest } = m;
              void _removed;
              return rest as typeof m;
            }
            if (newLinked && m.id === newLinked) {
              return { ...m, linkedTo: markerId };
            }
            return m;
          });
        }

        return { gameplayMarkers: nextMarkers };
      });
      savePersisted(get());
    },

    removeGameplayMarker: (markerId) => {
      set((state) => {
        const target = state.gameplayMarkers.find((m) => m.id === markerId);
        return {
          gameplayMarkers: state.gameplayMarkers
            .filter((m) => m.id !== markerId)
            .map((m) =>
              m.linkedTo === markerId
                ? (() => {
                    const { linkedTo: _rm, ...rest } = m;
                    void _rm;
                    return rest as typeof m;
                  })()
                : m
            ),
          audioNodes: state.audioNodes.map((a) =>
            a.attachedTo?.type === 'gameplay' && a.attachedTo.id === markerId
              ? { ...a, attachedTo: null }
              : a
          ),
          ...(target?.linkedTo
            ? {
                gameplayMarkers: state.gameplayMarkers
                  .filter((m) => m.id !== markerId)
                  .map((m) => {
                    if (m.id === target.linkedTo && m.linkedTo === markerId) {
                      const { linkedTo: _r, ...rest } = m;
                      void _r;
                      return rest as typeof m;
                    }
                    if (m.linkedTo === markerId) {
                      const { linkedTo: _r2, ...rest2 } = m;
                      void _r2;
                      return rest2 as typeof m;
                    }
                    return m;
                  }),
              }
            : {}),
        };
      });
      savePersisted(get());
    },

    addAudioNode: (roomId, node) => {
      set((state) => ({
        audioNodes: [
          ...state.audioNodes,
          { ...node, id: generateId('audio'), roomId },
        ],
      }));
      savePersisted(get());
    },

    updateAudioNode: (nodeId, updates) => {
      set((state) => ({
        audioNodes: state.audioNodes.map((a) =>
          a.id === nodeId ? { ...a, ...updates } : a
        ),
      }));
      savePersisted(get());
    },

    removeAudioNode: (nodeId) => {
      set((state) => ({
        audioNodes: state.audioNodes.filter((a) => a.id !== nodeId),
      }));
      savePersisted(get());
    },

    addComment: (roomId, comment) => {
      set((state) => ({
        comments: [
          ...state.comments,
          { ...comment, id: generateId('comment'), roomId, timestamp: formatNow() },
        ],
        reviewTab: 'comments',
      }));
      savePersisted(get());
    },

    createVersion: (roomId, reason, author) => {
      const state = get();
      const room = state.rooms.find((r) => r.id === roomId);
      if (!room) return;

      const roomStory = state.storyNodes.filter((n) => n.roomId === roomId);
      const roomMarkers = state.gameplayMarkers.filter((m) => m.roomId === roomId);
      const roomAudio = state.audioNodes.filter((a) => a.roomId === roomId);
      const existingVersions = state.versions.filter((v) => v.roomId === roomId);
      const nextNumber =
        existingVersions.length > 0
          ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1
          : 1;

      const newVersion = {
        id: generateId('v'),
        roomId,
        versionNumber: nextNumber,
        snapshot: {
          name: room.name,
          status: room.status as RoomStatus,
          description: room.description,
          storyNodes: JSON.parse(JSON.stringify(roomStory)),
          gameplayMarkers: JSON.parse(JSON.stringify(roomMarkers)),
          audioNodes: JSON.parse(JSON.stringify(roomAudio)),
        },
        changeReason: reason,
        author,
        timestamp: formatNow(),
      };

      set((s) => ({
        versions: [...s.versions, newVersion],
        reviewTab: 'versions',
        reviewPanelOpen: true,
      }));
      savePersisted(get());
    },

    setCompareVersionIds: (ids) => set({ compareVersionIds: ids }),

    saveRoomSnapshot: (roomId) => {
      get().createVersion(roomId, '保存快照', '系统');
    },

    setShowAddFloorModal: (show) => set({ showAddFloorModal: show }),
    setShowAddRoomModal: (show) => set({ showAddRoomModal: show }),
  };
});
