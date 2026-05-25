import { describe, expect, it } from "vitest";
import { estimateVideoCostUsd } from "./pricing";

describe("estimateVideoCostUsd", () => {
  it("estimates per-second pricing", () => {
    expect(
      estimateVideoCostUsd({
        pricing: { type: "per_second", pricePerSecondUsd: 0.05 },
        durationSeconds: 10,
        numVideos: 2,
      }),
    ).toBe(1);
  });

  it("estimates per-video pricing", () => {
    expect(
      estimateVideoCostUsd({
        pricing: { type: "per_video", pricePerVideoUsd: 0.2 },
        durationSeconds: 10,
        numVideos: 3,
      }),
    ).toBeCloseTo(0.6);
  });

  it("returns null when pricing is unknown", () => {
    expect(estimateVideoCostUsd({ durationSeconds: 10 })).toBeNull();
  });
});
