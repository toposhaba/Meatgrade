export const CUTS: string[];
export const LEAN_CUTS: Set<string>;

export type PixelKind = "lean" | "fat" | "ignore";

export type MeanLean = { r: number; g: number; b: number };

export type Analysis = {
  fatPixels: number;
  leanPixels: number;
  meatPixelPercent: number;
  marblingPercent: number | null;
  meanLean: MeanLean | null;
  enoughTissue: boolean;
};

export type ColorRead = {
  tone: "bright" | "dark" | "purple" | "brown";
  label: string;
  note: string;
  concern: boolean;
};

export type LikelyGrade = "Prime" | "Upper Choice" | "Choice" | "Select" | "Below Select";

export type Assessment = {
  status: "ok" | "no_meat" | "mostly_fat";
  headline: string;
  summary: string;
  rating: number | null;
  likelyGrade: LikelyGrade | null;
  degree: string | null;
  marblingPercent: number | null;
  color: ColorRead | null;
  cutNote: string | null;
  cookTip: string | null;
};

export type RankableScan = {
  assessment: Assessment | null;
  pricePerLb?: string | number | null;
};

export function classifyPixel(r: number, g: number, b: number): PixelKind;
export function analyzeRgba(data: Uint8ClampedArray | Uint8Array): Analysis;
export function degreeFor(marblingPercent: number | null): string | null;
export function leanColor(meanLean: MeanLean | null): ColorRead | null;
export function assessSteak(analysis: Analysis | null, cut?: string): Assessment;
export function rankScans<T extends RankableScan>(
  scans: T[],
): { bestMarbling: T | null; bestValue: T | null };
export function buildSampleSteak(
  fatRatio?: number,
  seedStart?: number,
): { data: Uint8ClampedArray; width: number; height: number };
