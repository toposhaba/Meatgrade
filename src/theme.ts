export const colors = {
  bg: "#F3F0E9",
  card: "#FFFFFF",
  border: "#DCD6C9",
  track: "#E8E3D8",
  text: "#1B1917",
  muted: "#6E675C",
  faint: "#9B948A",
  accent: "#8A2B25",
  accentSoft: "#F6E7E4",
  warn: "#8C5410",
  warnSoft: "#F7EBD9",
  ok: "#2F6B3A",
  okSoft: "#E3EFE4",
  ink: "#1B1917",
  onInk: "#FFFFFF",
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const type = {
  title: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.5, color: colors.text },
  section: { fontSize: 13, fontWeight: "700" as const, letterSpacing: 0.8, color: colors.muted },
  label: { fontSize: 15, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 16, color: colors.text, lineHeight: 22 },
  small: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  grade: { fontSize: 36, fontWeight: "800" as const, letterSpacing: -1, color: colors.text },
};
