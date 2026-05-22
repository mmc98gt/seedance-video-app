import { useHistoryStore } from "@/stores/history.store";

export function useLocalHistory() {
  return useHistoryStore();
}
