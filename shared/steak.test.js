import { describe, expect, it } from "vitest";
import {
  analyzeRgba,
  assessSteak,
  buildSampleSteak,
  degreeFor,
  leanColor,
  rankScans,
} from "./steak.js";

describe("marbling read", () => {
  it("maps fat share to a marbling degree", () => {
    expect(degreeFor(1.5)).toBe("Practically Devoid");
    expect(degreeFor(4)).toBe("Slight");
    expect(degreeFor(5.5)).toBe("Small");
    expect(degreeFor(7)).toBe("Modest");
    expect(degreeFor(8)).toBe("Moderate");
    expect(degreeFor(11)).toBe("Slightly Abundant");
    expect(degreeFor(16)).toBe("Abundant");
  });

  it("reads a synthetic steak as Small marbling and Choice", () => {
    const sample = buildSampleSteak(0.055);
    const analysis = analyzeRgba(sample.data);
    expect(analysis.enoughTissue).toBe(true);
    expect(analysis.marblingPercent).toBeGreaterThan(5);
    expect(analysis.marblingPercent).toBeLessThan(6.2);
    const result = assessSteak(analysis, "Ribeye");
    expect(result.status).toBe("ok");
    expect(result.degree).toBe("Small");
    expect(result.likelyGrade).toBe("Choice");
    expect(result.rating).toBe(3);
    expect(result.color?.tone).toBe("bright");
  });

  it("reads a heavily marbled sample as Prime", () => {
    const result = assessSteak(analyzeRgba(buildSampleSteak(0.12, 11).data), "Ribeye");
    expect(result.likelyGrade).toBe("Prime");
    expect(result.rating).toBe(5);
    expect(result.headline).toBe("Excellent steak");
  });

  it("calls a lean sample Select and softens it for lean cuts", () => {
    const analysis = analyzeRgba(buildSampleSteak(0.035, 3).data);
    expect(assessSteak(analysis, "Strip").headline).toBe("Lean steak");
    expect(assessSteak(analysis, "Tenderloin").headline).toBe("Lean, as expected for this cut");
    expect(assessSteak(analysis, "Strip").likelyGrade).toBe("Select");
  });

  it("refuses a dark frame", () => {
    const result = assessSteak(analyzeRgba(new Uint8ClampedArray(40 * 40 * 4)));
    expect(result.status).toBe("no_meat");
    expect(result.rating).toBeNull();
  });

  it("flags a frame that is mostly fat", () => {
    const result = assessSteak(analyzeRgba(buildSampleSteak(0.5, 5).data), "Ribeye");
    expect(result.status).toBe("mostly_fat");
  });
});

describe("lean color", () => {
  it("names the common tones", () => {
    expect(leanColor({ r: 150, g: 45, b: 42 })?.tone).toBe("bright");
    expect(leanColor({ r: 100, g: 30, b: 45 })?.tone).toBe("purple");
    expect(leanColor({ r: 120, g: 85, b: 70 })?.tone).toBe("brown");
    expect(leanColor({ r: 105, g: 30, b: 28 })?.tone).toBe("dark");
    expect(leanColor(null)).toBeNull();
  });
});

describe("comparing a tray", () => {
  it("picks the best marbling and the best value", () => {
    const prime = { assessment: assessSteak(analyzeRgba(buildSampleSteak(0.12, 11).data)), pricePerLb: "24.99" };
    const choice = { assessment: assessSteak(analyzeRgba(buildSampleSteak(0.055).data)), pricePerLb: "11.99" };
    const select = { assessment: assessSteak(analyzeRgba(buildSampleSteak(0.035, 3).data)), pricePerLb: "" };
    const ranked = rankScans([select, choice, prime]);
    expect(ranked.bestMarbling).toBe(prime);
    expect(ranked.bestValue).toBe(choice);
  });

  it("returns nothing for an empty tray", () => {
    expect(rankScans([])).toEqual({ bestMarbling: null, bestValue: null });
  });
});
