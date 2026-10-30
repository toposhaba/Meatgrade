import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SavedSession } from "./draft";

const KEY = "meatgrade.sessions.v2";

export async function loadSessions(): Promise<SavedSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SavedSession[]) : [];
  } catch {
    return [];
  }
}

export async function saveSessions(sessions: SavedSession[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
}
