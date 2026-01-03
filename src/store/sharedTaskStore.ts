import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SharedTask } from '@/types/habitica';

// Demo shared tasks
const DEMO_SHARED_TASKS: SharedTask[] = [
  {
    id: 'shared-1',
    text: 'Clean up living room',
    notes: 'Vacuum, dust, and tidy up before guests arrive',
    type: 'todo',
    priority: 1.5,
    assignedTo: ['demo-3', 'demo-4', 'demo-5'], // Emma, Jake, Sophie
    completedBy: [],
    date: '2026-01-05',
    createdAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 'shared-2',
    text: 'Walk the dog',
    notes: 'Morning walk around the block',
    type: 'daily',
    priority: 1,
    assignedTo: ['demo-4', 'demo-6'], // Jake, Max
    completedBy: [],
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'shared-3',
    text: 'Set dinner table',
    notes: 'Plates, utensils, napkins, glasses',
    type: 'daily',
    priority: 0.1,
    assignedTo: ['demo-5', 'demo-7', 'demo-8'], // Sophie, Lily, Ben
    completedBy: [],
    createdAt: '2026-01-01T17:00:00Z',
  },
  {
    id: 'shared-4',
    text: 'Grocery shopping',
    notes: 'Get items from the list on the fridge',
    type: 'todo',
    priority: 2,
    assignedTo: ['demo-1', 'demo-2'], // Dad, Mom
    completedBy: [],
    date: '2026-01-04',
    createdAt: '2026-01-02T09:00:00Z',
  },
  {
    id: 'shared-5',
    text: 'Family game night prep',
    notes: 'Pick games, set up snacks, clear table',
    type: 'todo',
    priority: 1,
    assignedTo: ['demo-1', 'demo-2', 'demo-3', 'demo-4', 'demo-5', 'demo-6', 'demo-7', 'demo-8', 'demo-9'],
    completedBy: [],
    date: '2026-01-06',
    createdAt: '2026-01-01T12:00:00Z',
  },
];

interface SharedTaskStore {
  sharedTasks: SharedTask[];
  isDemoInitialized: boolean;
  addSharedTask: (task: Omit<SharedTask, 'id' | 'createdAt' | 'completedBy'>) => void;
  updateSharedTask: (id: string, updates: Partial<SharedTask>) => void;
  deleteSharedTask: (id: string) => void;
  completeSharedTask: (taskId: string, memberId: string) => void;
  uncompleteSharedTask: (taskId: string, memberId: string) => void;
  initDemoTasks: () => void;
}

export const useSharedTaskStore = create<SharedTaskStore>()(
  persist(
    (set, get) => ({
      sharedTasks: [],
      isDemoInitialized: false,

      initDemoTasks: () => {
        if (!get().isDemoInitialized) {
          set({ sharedTasks: DEMO_SHARED_TASKS, isDemoInitialized: true });
        }
      },

      addSharedTask: (task) => {
        const newTask: SharedTask = {
          ...task,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          completedBy: [],
        };
        set((state) => ({
          sharedTasks: [...state.sharedTasks, newTask],
        }));
      },

      updateSharedTask: (id, updates) => {
        set((state) => ({
          sharedTasks: state.sharedTasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteSharedTask: (id) => {
        set((state) => ({
          sharedTasks: state.sharedTasks.filter((t) => t.id !== id),
        }));
      },

      completeSharedTask: (taskId, memberId) => {
        set((state) => ({
          sharedTasks: state.sharedTasks.map((t) => {
            if (t.id === taskId) {
              const completedBy = [...(t.completedBy || [])];
              if (!completedBy.includes(memberId)) {
                completedBy.push(memberId);
              }
              // If one person completes, mark as done for all assigned
              return {
                ...t,
                completedBy: t.assignedTo, // Clear for everyone
              };
            }
            return t;
          }),
        }));
      },

      uncompleteSharedTask: (taskId, memberId) => {
        set((state) => ({
          sharedTasks: state.sharedTasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                completedBy: [],
              };
            }
            return t;
          }),
        }));
      },
    }),
    {
      name: 'shared-tasks-storage',
    }
  )
);
