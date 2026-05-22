import { create } from "zustand";
import type { GenerationJob, GenerationStatus } from "@/types/generation.types";

interface GenerationState {
  currentJob: GenerationJob | null;
  status: GenerationStatus;
  setCurrentJob: (job: GenerationJob | null) => void;
  setStatus: (status: GenerationStatus) => void;
  resetCurrentJob: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  currentJob: null,
  status: "idle",
  setCurrentJob: (job) => set({ currentJob: job, status: job?.status ?? "idle" }),
  setStatus: (status) => set({ status }),
  resetCurrentJob: () => set({ currentJob: null, status: "idle" }),
}));
