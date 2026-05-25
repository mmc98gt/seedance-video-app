import type { QualityTier, VideoPricing } from "@/types/generation.types";

export function estimateVideoCostUsd(params: {
  pricing?: VideoPricing;
  durationSeconds: number;
  numVideos?: number;
}): number | null {
  const { pricing, durationSeconds, numVideos = 1 } = params;

  if (!pricing) return null;

  if (pricing.type === "per_second" && typeof pricing.pricePerSecondUsd === "number") {
    return pricing.pricePerSecondUsd * durationSeconds * numVideos;
  }

  if (pricing.type === "per_video" && typeof pricing.pricePerVideoUsd === "number") {
    return pricing.pricePerVideoUsd * numVideos;
  }

  return null;
}

export function formatCost(cost: number | null): string {
  return cost == null ? "Precio no disponible" : `~$${cost.toFixed(2)}`;
}

export function qualityTierLabel(tier: QualityTier): string {
  if (tier === "economy") return "Economico";
  if (tier === "balanced") return "Equilibrado";
  return "Premium";
}
