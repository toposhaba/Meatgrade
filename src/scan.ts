import { assessSteak, type Analysis, type Assessment } from "../shared/steak.js";

export type Scan = {
  id: string;
  createdAt: string;
  cut: string;
  pricePerLb: string;
  photoUri: string;
  analysis: Analysis;
};

export type AssessedScan = Scan & { assessment: Assessment };

export function assess(scan: Scan): AssessedScan {
  return { ...scan, assessment: assessSteak(scan.analysis, scan.cut) };
}

export function newId() {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function formatWhen(iso: string) {
  const date = new Date(iso);
  const sameDay = new Date().toDateString() === date.toDateString();
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    ...(sameDay ? {} : { month: "short", day: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatPrice(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return `$${number.toFixed(2)}/lb`;
}
