export type Species = "Beef" | "Pork" | "Lamb";
export type Maturity = "A" | "B" | "C" | "D" | "E";
export type SexClass = "Steer" | "Heifer" | "Cow" | "Bullock";

export type Draft = {
  species: Species;
  carcassId: string;
  maturity: Maturity;
  sexClass: SexClass;
  darkCutter: boolean;
  marblingDegree: string;
  estimatedMarblingPercent: number | null;
  meatPixelPercent: number | null;
  enoughTissue: boolean;
  fatThickness: string;
  ribeyeArea: string;
  hotCarcassWeight: string;
  kphPercent: string;
  colorScore: string;
  porkMarblingScore: string;
  flankStreaking: string;
  photoDataUrl: string | null;
  graderNotes: string;
};

export type SavedSession = Draft & {
  id: string;
  createdAt: string;
  qualityGrade: string | null;
  plantCall: string | null;
  yieldGrade: number | null;
  yieldScore: number | null;
  requiresReview: boolean;
  reviewReason: string;
};

const KEY = "meatgrade.sessions.v1";

export function emptyDraft(): Draft {
  return {
    species: "Beef",
    carcassId: "",
    maturity: "A",
    sexClass: "Steer",
    darkCutter: false,
    marblingDegree: "",
    estimatedMarblingPercent: null,
    meatPixelPercent: null,
    enoughTissue: true,
    fatThickness: "",
    ribeyeArea: "",
    hotCarcassWeight: "",
    kphPercent: "",
    colorScore: "",
    porkMarblingScore: "",
    flankStreaking: "",
    photoDataUrl: null,
    graderNotes: "",
  };
}

export function loadSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as SavedSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SavedSession[]) {
  const payload = JSON.stringify(sessions);
  localStorage.setItem(KEY, payload);
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
