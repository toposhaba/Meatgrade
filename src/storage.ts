import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Scan } from "./scan";

const KEY = "meatgrade.scans.v3";
const MAX_SCANS = 30;

export async function loadScans(): Promise<Scan[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Scan[]) : [];
  } catch {
    return [];
  }
}

export async function saveScans(scans: Scan[]) {
  const trimmed = scans.slice(0, MAX_SCANS);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify(trimmed.map((scan) => ({ ...scan, photoUri: "" }))),
    );
  }
}
