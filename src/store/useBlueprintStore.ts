import { create } from 'zustand';
import type {
  BlueprintStore,
  Room,
  RoomStatus,
  CollabTask,
  VersionChangeStats,
  RoomSnapshot,
  StoryNode,
  GameplayMarker,
  AudioNode,
} from '@/types';
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

const STORAGE_KEY = 'haunted-blueprint-state-v2';

type PersistedState = {
  floors: BlueprintStore['floors'];
  rooms: BlueprintStore['rooms'];
  storyNodes: BlueprintStore['storyNodes'];
  gameplayMarkers: BlueprintStore['gameplayMarkers'];
  audioNodes: BlueprintStore['audioNodes'];
  collabTasks: BlueprintStore['collabTasks'];
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
  collabTasks: [],
  comments: mockComments,
  versions: mockVersions.map((v) => ({
    ...v,
    changeStats: { roomInfo: 1, storyNodes: 0, gameplayMarkers: 0, audioNodes: 0, collabTasks: 0 },
    snapshot: { ...v.snapshot, collabTasks: [] },
  })),
  currentFloorId: 'floor-1',
};

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersisted;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed.floors || !parsed.rooms) return defaultPersisted;
    return {
      ...defaultPersisted,
      ...parsed,
      collabTasks: parsed.collabTasks ?? [],
      versions: (parsed.versions ?? []).map((v) => ({
        ...v,
        changeStats: v.changeStats ?? { roomInfo: 1, storyNodes: 0, gameplayMarkers: 0, audioNodes: 0, collabTasks: 0 },
        snapshot: { ...v.snapshot, collabTasks: v.snapshot.collabTasks ?? [] },
      })),
    };
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
      collabTasks: state.collabTasks,
      comments: state.comments,
      versions: state.versions,
      currentFloorId: state.currentFloorId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

function countArrayChanges<T extends { id: string }>(
  prev: T[],
  curr: T[],
  isEqual: (a: T, b: T) => boolean,
): number {
  const prevMap = new Map(prev.map((p) => [p.id, p]));
  const currMap = new Map(curr.map((c) => [c.id, c]));
  let changes = 0;
  for (const c of curr) {
    if (!prevMap.has(c.id)) changes++;
    else if (!isEqual(prevMap.get(c.id)!, c)) changes++;
  }
  for (const p of prev) {
    if (!currMap.has(p.id)) changes++;
  }
  return changes;
}

function storyNodesEqual(a: StoryNode, b: StoryNode): boolean {
  if (a.triggerType !== b.triggerType || a.content !== b.content) return false;
  const aBranches = a.branches ?? [];
  const bBranches = b.branches ?? [];
  if (aBranches.length !== bBranches.length) return false;
  for (let i = 0; i < aBranches.length; i++) {
    if (aBranches[i].condition !== bBranches[i].condition || aBranches[i].content !== bBranches[i].content) {
      return false;
    }
  }
  return true;
}

function markersEqual(a: GameplayMarker, b: GameplayMarker): boolean {
  return (
    a.type === b.type &&
    a.name === b.name &&
    a.description === b.description &&
    (a.linkedTo ?? null) === (b.linkedTo ?? null)
  );
}

function audioNodesEqual(a: AudioNode, b: AudioNode): boolean {
  return (
    a.name === b.name &&
    a.triggerDistance === b.triggerDistance &&
    a.volume === b.volume &&
    a.loop === b.loop &&
    a.description === b.description &&
    JSON.stringify(a.attachedTo ?? null) === JSON.stringify(b.attachedTo ?? null)
  );
}

function collabTasksEqual(a: CollabTask, b: CollabTask): boolean {
  return (
    a.type === b.type &&
    a.title === b.title &&
    a.description === b.description &&
    a.assigneeRole === b.assigneeRole &&
    a.status === b.status
  );
}

function computeChangeStats(prev: RoomSnapshot | null, curr: RoomSnapshot): VersionChangeStats {
  if (!prev) {
    return {
      roomInfo: curr.name || curr.status || curr.description ? 1 : 0,
      storyNodes: curr.storyNodes.length,
      gameplayMarkers: curr.gameplayMarkers.length,
      audioNodes: curr.audioNodes.length,
      collabTasks: curr.collabTasks?.length ?? 0,
    };
  }
  const roomInfoChanged =
    prev.name !== curr.name || prev.status !== curr.status || prev.description !== curr.description;
  return {
    roomInfo: roomInfoChanged ? 1 : 0,
    storyNodes: countArrayChanges(prev.storyNodes, curr.storyNodes, storyNodesEqual),
    gameplayMarkers: countArrayChanges(prev.gameplayMarkers, curr.gameplayMarkers, markersEqual),
    audioNodes: countArrayChanges(prev.audioNodes, curr.audioNodes, audioNodesEqual),
    collabTasks: countArrayChanges(prev.collabTasks ?? [], curr.collabTasks ?? [], collabTasksEqual),
  };
}

export const useBlueprintStore = create<BlueprintStore>((set, get) => {
  const initial = loadPersisted();

  return {
    floors: initial.floors,
    rooms: initial.rooms,
    storyNodes: initial.storyNodes,
    gameplayMarkers: initial.gameplayMarkers,
    audioNodes: initial.audioNodes,
    collabTasks: initial.collabTasks,
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
    showPuzzleInspector: false,

    hydrateFromStorage: () => {
      const loaded = loadPersisted();
      set({
        floors: loaded.floors,
        rooms: loaded.rooms,
        storyNodes: loaded.storyNodes,
        gameplayMarkers: loaded.gameplayMarkers,
        audioNodes: loaded.audioNodes,
        collabTasks: loaded.collabTasks,
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

    togglePuzzleInspector: () => set((s) => ({ showPuzzleInspector: !s.showPuzzleInspector })),
    setShowPuzzleInspector: (show) => set({ showPuzzleInspector: show }),

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
        collabTasks: state.collabTasks.filter((t) => t.roomId !== roomId),
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
        if (!old) return state;

        const oldLinked = old.linkedTo;
        const updatingLink = 'linkedTo' in updates;
        const newLinked = updates.linkedTo;

        let nextMarkers = state.gameplayMarkers.map((m) =>
          m.id === markerId ? { ...m, ...updates } : m
        );

        if (updatingLink && newLinked !== oldLinked) {
          nextMarkers = nextMarkers.map((m) => {
            let out = m;
            if (oldLinked && m.id === oldLinked && m.linkedTo === markerId) {
              const { linkedTo: _removed, ...rest } = out;
              void _removed;
              out = rest as typeof out;
            }
            if (newLinked && m.id === newLinked) {
              out = { ...out, linkedTo: markerId };
            }
            return out;
          });

          const newTarget = nextMarkers.find((m) => m.id === newLinked);
          const prevOwnerId = newTarget?.linkedTo;
          if (newLinked && prevOwnerId && prevOwnerId !== markerId) {
            nextMarkers = nextMarkers.map((m) => {
              if (m.id === prevOwnerId && m.linkedTo === newLinked) {
                const { linkedTo: _r, ...rest } = m;
                void _r;
                return rest as typeof m;
              }
              return m;
            });
          }
        }

        return { gameplayMarkers: nextMarkers };
      });
      savePersisted(get());
    },

    removeGameplayMarker: (markerId) => {
      set((state) => {
        const target = state.gameplayMarkers.find((m) => m.id === markerId);
        const nextMarkers = state.gameplayMarkers
          .filter((m) => m.id !== markerId)
          .map((m) => {
            if (m.linkedTo === markerId) {
              const { linkedTo: _r, ...rest } = m;
              void _r;
              return rest as typeof m;
            }
            return m;
          });
        const finalMarkers = target?.linkedTo
          ? nextMarkers.map((m) => {
              if (m.id === target.linkedTo && m.linkedTo === markerId) {
                const { linkedTo: _r2, ...rest2 } = m;
                void _r2;
                return rest2 as typeof m;
              }
              return m;
            })
          : nextMarkers;
        return {
          gameplayMarkers: finalMarkers,
          audioNodes: state.audioNodes.map((a) =>
            a.attachedTo?.type === 'gameplay' && a.attachedTo.id === markerId
              ? { ...a, attachedTo: null }
              : a
          ),
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

    addCollabTask: (roomId, task) => {
      const now = formatNow();
      const newTask: CollabTask = {
        ...task,
        id: generateId('task'),
        roomId,
        createdAt: now,
        updatedAt: now,
      };
      set((s) => ({
        collabTasks: [...s.collabTasks, newTask],
        reviewPanelOpen: true,
      }));
      savePersisted(get());
    },

    updateCollabTask: (taskId, updates) => {
      const now = formatNow();
      set((s) => {
        const old = s.collabTasks.find((t) => t.id === taskId);
        const finalUpdates: Partial<CollabTask> = { ...updates, updatedAt: now };
        if (
          updates.status === 'done' &&
          old?.status !== 'done' &&
          !old?.closedAt
        ) {
          finalUpdates.closedAt = now;
        }
        if (
          updates.status &&
          updates.status !== 'done' &&
          old?.closedAt
        ) {
          const { closedAt: _rm, ...rest } = finalUpdates;
          void _rm;
          Object.assign(finalUpdates, rest);
        }
        return {
          collabTasks: s.collabTasks.map((t) =>
            t.id === taskId ? { ...t, ...finalUpdates } : t
          ),
          reviewPanelOpen: true,
        };
      });
      savePersisted(get());
    },

    removeCollabTask: (taskId) => {
      set((s) => ({
        collabTasks: s.collabTasks.filter((t) => t.id !== taskId),
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
      const roomTasks = state.collabTasks.filter((t) => t.roomId === roomId);
      const existingVersions = state.versions.filter((v) => v.roomId === roomId);
      const nextNumber =
        existingVersions.length > 0
          ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1
          : 1;

      const sortedVersions = [...existingVersions].sort(
        (a, b) => b.versionNumber - a.versionNumber
      );
      const latest = sortedVersions[0];

      const currSnapshot: RoomSnapshot = {
        name: room.name,
        status: room.status as RoomStatus,
        description: room.description,
        storyNodes: JSON.parse(JSON.stringify(roomStory)),
        gameplayMarkers: JSON.parse(JSON.stringify(roomMarkers)),
        audioNodes: JSON.parse(JSON.stringify(roomAudio)),
        collabTasks: JSON.parse(JSON.stringify(roomTasks)),
      };
      const changeStats: VersionChangeStats = computeChangeStats(
        latest ? latest.snapshot : null,
        currSnapshot
      );

      const newVersion = {
        id: generateId('v'),
        roomId,
        versionNumber: nextNumber,
        snapshot: currSnapshot,
        changeReason: reason,
        changeStats,
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
