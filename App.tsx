import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { GradeScreen } from "./src/GradeScreen";
import { SavedScreen } from "./src/SavedScreen";
import { newId, type SavedSession } from "./src/draft";
import { loadSessions, saveSessions } from "./src/storage";
import { colors, radius, space, type } from "./src/theme";

type Tab = "grade" | "saved";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Shell />
    </SafeAreaProvider>
  );
}

function Shell() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("grade");
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  useEffect(() => {
    let active = true;
    void loadSessions().then((stored) => {
      if (active) setSessions(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  async function persist(next: SavedSession[]) {
    setSessions(next);
    await saveSessions(next);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={type.title}>{tab === "grade" ? "Grade a carcass" : "Saved grades"}</Text>
          <Text style={type.small}>
            {tab === "grade"
              ? "Confirm what you see. The chart stamps the call."
              : `${sessions.length} on this phone`}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setTab(tab === "grade" ? "saved" : "grade")}
          style={styles.switch}
        >
          <Text style={styles.switchText}>
            {tab === "grade" ? `Saved · ${sessions.length}` : "Grade"}
          </Text>
        </Pressable>
      </View>
      {tab === "grade" ? (
        <GradeScreen
          onSave={async (session) => {
            await persist([
              { ...session, id: newId(), createdAt: new Date().toISOString() },
              ...sessions,
            ]);
          }}
        />
      ) : (
        <SavedScreen
          sessions={sessions}
          onRemove={(id) => void persist(sessions.filter((session) => session.id !== id))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    gap: space.md,
  },
  switch: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    justifyContent: "center",
  },
  switchText: { color: colors.onInk, fontSize: 14, fontWeight: "700" },
});
