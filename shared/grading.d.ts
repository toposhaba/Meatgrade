export const BEEF_DEGREES: string[];
export const LAMB_STREAKING: string[];

export type PixelKind = "lean" | "fat" | "ignore";

export type Analysis = {
  fatPixels: number;
  leanPixels: number;
  meatPixelPercent: number;
  marblingPercent: number | null;
  meanLeanLuma: number | null;
  suggestedDegree: string | null;
  suggestedPorkColor: number | null;
  suggestedPorkMarbling: number | null;
  enoughTissue: boolean;
};

export type GradeInput = {
  species?: string;
  maturity?: string;
  sexClass?: string;
  darkCutter?: boolean;
  marblingDegree?: string | null;
  fatThickness?: number | string | null;
  ribeyeArea?: number | string | null;
  hotCarcassWeight?: number | string | null;
  kphPercent?: number | string | null;
  colorScore?: number | string | null;
  porkMarblingScore?: number | string | null;
  flankStreaking?: string | null;
};

export type GradeDecision = {
  qualityGrade: string | null;
  plantCall: string | null;
  yieldGrade: number | null;
  yieldScore: number | null;
  requiresReview: boolean;
  reviewReason: string;
};

export function classifyPixel(r: number, g: number, b: number): PixelKind;
export function analyzeRgba(data: Uint8ClampedArray): Analysis;
export function suggestDegree(marblingPercent: number | null): string | null;
export function suggestPorkColor(meanLeanLuma: number | null): number | null;
export function suggestPorkMarbling(marblingPercent: number | null): number | null;
export function degreeAtLeast(degree: string, minimum: string): boolean;
export function gradeSession(input: GradeInput): GradeDecision;
export function gradeBeef(input: GradeInput): { qualityGrade: string | null; review: string[] };
export function beefYield(input: GradeInput): {
  yieldGrade: number | null;
  yieldScore: number | null;
  review: string[];
};
export function buildSampleCut(fatRatio?: number): {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};
