import { create } from 'zustand';
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} from '../lib/storage';

type WatchlistStore = {
  ids: Set<number>;
  loaded: boolean;
  load: () => Promise<void>;
  add: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  has: (id: number) => boolean;
};

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  ids: new Set(),
  loaded: false,

  load: async () => {
    const saved = await getWatchlist();
    set({ ids: new Set(saved), loaded: true });
  },

  add: async (id) => {
    await addToWatchlist(id);
    set((state) => ({ ids: new Set([...state.ids, id]) }));
  },

  remove: async (id) => {
    await removeFromWatchlist(id);
    set((state) => {
      const next = new Set(state.ids);
      next.delete(id);
      return { ids: next };
    });
  },

  has: (id) => get().ids.has(id),
}));
