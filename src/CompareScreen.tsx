import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { rankScans } from "../shared/steak.js";
import { formatPrice, type AssessedScan } from "./scan";
import { colors, radius, space, type } from "./theme";
import { Card, Rating, Tag } from "./ui";

export function CompareScreen({
  scans,
  onOpen,
}: {
  scans: AssessedScan[];
  onOpen: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { bestMarbling, bestValue } = rankScans(scans);
  const ordered = [...scans].sort(
    (a, b) => (b.assessment.marblingPercent ?? -1) - (a.assessment.marblingPercent ?? -1),
  );
  const anyPrice = scans.some((scan) => formatPrice(scan.pricePerLb));

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
    >
      <Text style={type.body}>
        Most marbling first.
        {anyPrice
          ? " Best value weighs the rating against the price you entered."
          : " Add a price on each steak to see which one is the best value."}
      </Text>
      {ordered.map((scan, index) => {
        const price = formatPrice(scan.pricePerLb);
        return (
          <Pressable key={scan.id} accessibilityRole="button" onPress={() => onOpen(scan.id)}>
            <Card style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              {scan.photoUri ? (
                <Image source={{ uri: scan.photoUri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, { backgroundColor: colors.track }]} />
              )}
              <View style={styles.body}>
                <Text style={styles.title}>{scan.assessment.headline}</Text>
                <Rating value={scan.assessment.rating} size={10} />
                <Text style={type.small}>
                  {scan.cut}
                  {scan.assessment.marblingPercent != null
                    ? ` · ${scan.assessment.marblingPercent}% marbling`
                    : ""}
                  {price ? ` · ${price}` : ""}
                </Text>
                <View style={styles.tags}>
                  {bestMarbling?.id === scan.id ? <Tag label="Most marbling" tone="accent" /> : null}
                  {bestValue?.id === scan.id ? <Tag label="Best value" tone="ok" /> : null}
                </View>
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
  content: { padding: space.lg, gap: space.md },
  row: { flexDirection: "row", gap: space.md, padding: space.md, alignItems: "center" },
  rank: { width: 20, fontSize: 18, fontWeight: "800", color: colors.faint, textAlign: "center" },
  thumb: { width: 68, height: 68, borderRadius: radius.md, backgroundColor: colors.ink },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
});
