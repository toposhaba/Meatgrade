import type { GradeDecision, GradeInput } from "../shared/grading.js";

export type Species = "Beef" | "Pork" | "Lamb";
export type Maturity = "A" | "B" | "C" | "D" | "E";
export type SexClass = "Steer" | "Heifer" | "Cow" | "Bullock";

export const SPECIES: Species[] = ["Beef", "Pork", "Lamb"];
export const MATURITIES: Maturity[] = ["A", "B", "C", "D", "E"];
export const SEX_CLASSES: SexClass[] = ["Steer", "Heifer", "Cow", "Bullock"];

export type Draft = {
  species: Species;
  carcassId: string;
  maturity: Maturity;
  sexClass: SexClass;
  darkCutter: boolean;
  marblingDegree: string;
  fatThickness: string;
  ribeyeArea: string;
  hotCarcassWeight: string;
  kphPercent: string;
  colorScore: string;
  porkMarblingScore: string;
  flankStreaking: string;
  notes: string;
  estimatedMarblingPercent: number | null;
  photoCaptured: boolean;
};

export type SavedSession = Draft &
  GradeDecision & {
    id: string;
    createdAt: string;
  };

export function emptyDraft(): Draft {
  return {
    species: "Beef",
    carcassId: "",
    maturity: "A",
    sexClass: "Steer",
    darkCutter: false,
    marblingDegree: "",
    fatThickness: "",
    ribeyeArea: "",
    hotCarcassWeight: "",
    kphPercent: "",
    colorScore: "",
    porkMarblingScore: "",
    flankStreaking: "",
    notes: "",
    estimatedMarblingPercent: null,
    photoCaptured: false,
  };
}

export function toInput(draft: Draft): GradeInput {
  return {
    species: draft.species,
    maturity: draft.maturity,
    sexClass: draft.sexClass,
    darkCutter: draft.darkCutter,
    marblingDegree: draft.marblingDegree || null,
    fatThickness: draft.fatThickness,
    ribeyeArea: draft.ribeyeArea,
    hotCarcassWeight: draft.hotCarcassWeight,
    kphPercent: draft.kphPercent,
    colorScore: draft.colorScore,
    porkMarblingScore: draft.porkMarblingScore,
    flankStreaking: draft.flankStreaking || null,
  };
}

export function callFor(decision: GradeDecision) {
  return decision.qualityGrade ?? decision.plantCall;
}

export function isWaitingOnInput(decision: GradeDecision) {
  return !callFor(decision) && decision.reviewReason.startsWith("Enter");
}

export function newId() {
  const stamp = Date.now().toString(36);
  const salt = Math.floor(Math.random() * 1e9).toString(36);
  return `${stamp}-${salt}`;
}

export function formatWhen(iso: string) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
  return `${formatted} CT`;
}
