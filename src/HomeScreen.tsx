import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatPrice, formatWhen, type AssessedScan } from "./scan";
import { colors, radius, space, type } from "./theme";
import { Button, Card, Notice, Rating } from "./ui";

export function HomeScreen({
  scans,
  busy,
  error,
  onScan,
  onOpen,
  onCompare,
  onSample,
}: {
  scans: AssessedScan[];
  busy: boolean;
  error: string | null;
  onScan: (source: "camera" | "library") => void;
  onOpen: (id: string) => void;
  onCompare: () => void;
  onSample: (() => void) | null;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
    >
      <View style={styles.hero}>
        <Text style={type.title}>Is this steak any good?</Text>
        <Text style={type.body}>
          Point the camera at the meat, not the label. Meatgrade reads the marbling and the color
          and tells you what you're looking at.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label={busy ? "Reading the steak…" : "Scan a steak"}
          onPress={() => onScan("camera")}
          disabled={busy}
        />
        <Button
          label="Pick a photo"
          kind="secondary"
          onPress={() => onScan("library")}
          disabled={busy}
        />
        {busy ? <ActivityIndicator color={colors.accent} /> : null}
        {error ? <Notice tone="warn" text={error} /> : null}
        {onSample ? <Button label="Try a sample steak" kind="quiet" onPress={onSample} /> : null}
      </View>

      {scans.length > 0 ? (
        <View style={styles.listHead}>
          <Text style={type.section}>SCANNED</Text>
          {scans.length > 1 ? (
            <Pressable accessibilityRole="button" onPress={onCompare}>
              <Text style={styles.link}>Compare {scans.length}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {scans.map((scan) => {
        const price = formatPrice(scan.pricePerLb);
        return (
          <Pressable key={scan.id} accessibilityRole="button" onPress={() => onOpen(scan.id)}>
            <Card style={styles.row}>
              {scan.photoUri ? (
                <Image source={{ uri: scan.photoUri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, { backgroundColor: colors.track }]} />
              )}
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {scan.assessment.headline}
                </Text>
                <Rating value={scan.assessment.rating} size={10} />
                <Text style={type.small} numberOfLines={1}>
                  {scan.cut}
                  {scan.assessment.likelyGrade ? ` · likely ${scan.assessment.likelyGrade}` : ""}
                  {price ? ` · ${price}` : ""}
                </Text>
                <Text style={styles.time}>{formatWhen(scan.createdAt)}</Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.lg },
  hero: { gap: space.sm, paddingTop: space.sm },
  actions: { gap: space.sm },
  listHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space.xs,
    marginTop: space.sm,
  },
  link: { color: colors.accent, fontWeight: "700", fontSize: 15 },
  row: { flexDirection: "row", gap: space.md, padding: space.md, alignItems: "center" },
  thumb: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.ink },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  time: { fontSize: 12, color: colors.faint },
});
