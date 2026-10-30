import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { CompareScreen } from "./src/CompareScreen";
import { HomeScreen } from "./src/HomeScreen";
import { ResultScreen } from "./src/ResultScreen";
import { capturePhoto, sampleSteak, type CapturedPhoto } from "./src/photo";
import { assess, newId, type Scan } from "./src/scan";
import { loadScans, saveScans } from "./src/storage";
import { colors, space } from "./src/theme";

type Route = { name: "home" } | { name: "result"; id: string } | { name: "compare" };

const SAMPLES: [number, number][] = [
  [0.055, 7],
  [0.12, 11],
  [0.035, 3],
];

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
  const [route, setRoute] = useState<Route>({ name: "home" });
  const [scans, setScans] = useState<Scan[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleIndex, setSampleIndex] = useState(0);

  useEffect(() => {
    let active = true;
    void loadScans().then((stored) => {
      if (active) setScans(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const assessed = useMemo(() => scans.map(assess), [scans]);

  async function persist(next: Scan[]) {
    setScans(next);
    try {
      await saveScans(next);
    } catch {
      setError("This phone could not store the scan. It will stay until the app closes.");
    }
  }

  function addPhoto(photo: CapturedPhoto) {
    const scan: Scan = {
      id: newId(),
      createdAt: new Date().toISOString(),
      cut: "Other",
      pricePerLb: "",
      photoUri: photo.uri,
      analysis: photo.analysis,
    };
    void persist([scan, ...scans]);
    setRoute({ name: "result", id: scan.id });
  }

  async function onScan(source: "camera" | "library") {
    setBusy(true);
    setError(null);
    try {
      const photo = await capturePhoto(source);
      if (photo) addPhoto(photo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The photo could not be read.");
    } finally {
      setBusy(false);
    }
  }

  function onSample() {
    const [ratio, seed] = SAMPLES[sampleIndex % SAMPLES.length];
    setSampleIndex(sampleIndex + 1);
    addPhoto(sampleSteak(ratio, seed));
  }

  const current =
    route.name === "result" ? assessed.find((scan) => scan.id === route.id) ?? null : null;

  useEffect(() => {
    if (route.name === "result" && !current) setRoute({ name: "home" });
  }, [route, current]);

  const title =
    route.name === "home" ? "Meatgrade" : route.name === "compare" ? "Compare" : "Your steak";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {route.name !== "home" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => setRoute({ name: "home" })}
            style={styles.back}
          >
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.back} />
      </View>

      {route.name === "home" ? (
        <HomeScreen
          scans={assessed}
          busy={busy}
          error={error}
          onScan={(source) => void onScan(source)}
          onOpen={(id) => setRoute({ name: "result", id })}
          onCompare={() => setRoute({ name: "compare" })}
          onSample={__DEV__ ? onSample : null}
        />
      ) : null}

      {route.name === "result" && current ? (
        <ResultScreen
          scan={current}
          onChange={(partial) =>
            void persist(scans.map((scan) => (scan.id === current.id ? { ...scan, ...partial } : scan)))
          }
          onRemove={() => {
            void persist(scans.filter((scan) => scan.id !== current.id));
            setRoute({ name: "home" });
          }}
          onRescan={() => {
            void persist(scans.filter((scan) => scan.id !== current.id));
            setRoute({ name: "home" });
            void onScan("camera");
          }}
        />
      ) : null}

      {route.name === "compare" ? (
        <CompareScreen scans={assessed} onOpen={(id) => setRoute({ name: "result", id })} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.sm,
    minHeight: 48,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  back: { minWidth: 72, minHeight: 44, justifyContent: "center", paddingHorizontal: space.sm },
  backText: { fontSize: 17, fontWeight: "600", color: colors.accent },
});
