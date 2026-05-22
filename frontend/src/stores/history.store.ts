import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryItem } from "@/types/generation.types";

const MAX_HISTORY_ITEMS = 50;

interface HistoryState {
  items: HistoryItem[];
  addItem: (item: HistoryItem) => void;
  removeItem: (id: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [item, ...state.items.filter((entry) => entry.id !== item.id)].slice(0, MAX_HISTORY_ITEMS),
        })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      clearHistory: () => set({ items: [] }),
    }),
    { name: "seedance-generation-history" },
  ),
);
