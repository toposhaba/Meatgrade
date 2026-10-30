import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { callFor, formatWhen, type SavedSession } from "./draft";
import { colors, radius, space, type } from "./theme";

export function SavedScreen({
  sessions,
  onRemove,
}: {
  sessions: SavedSession[];
  onRemove: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [arming, setArming] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Nothing graded yet</Text>
        <Text style={[type.small, { textAlign: "center" }]}>
          Grades you save stay on this phone until you remove them.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.xl }]}
      renderItem={({ item }) => {
        const call = callFor(item);
        const armed = arming === item.id;
        return (
          <View style={styles.card}>
            <View style={styles.head}>
              <Text style={styles.id}>{item.carcassId}</Text>
              <Text style={type.small}>{formatWhen(item.createdAt)}</Text>
            </View>
            <Text style={[styles.call, item.requiresReview && { color: colors.warn }]}>{call}</Text>
            <Text style={type.small}>
              {item.species}
              {item.species === "Beef" ? ` · ${item.marblingDegree} · ${item.maturity} maturity` : ""}
              {item.yieldGrade != null ? ` · Yield ${item.yieldGrade}` : ""}
            </Text>
            {item.reviewReason ? (
              <Text style={[type.small, { color: colors.warn }]}>{item.reviewReason}</Text>
            ) : null}
            {item.notes ? <Text style={type.body}>{item.notes}</Text> : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (armed) {
                  setArming(null);
                  onRemove(item.id);
                } else {
                  setArming(item.id);
                  setTimeout(() => setArming((current) => (current === item.id ? null : current)), 3000);
                }
              }}
              style={styles.remove}
            >
              <Text style={[styles.removeText, armed && { color: colors.accent }]}>
                {armed ? "Tap again to remove" : "Remove"}
              </Text>
            </Pressable>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, gap: space.md },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
    gap: space.sm,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.xs,
  },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  id: { fontSize: 16, fontWeight: "700", color: colors.text },
  call: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, color: colors.text },
  remove: { alignSelf: "flex-start", minHeight: 40, justifyContent: "center", marginTop: space.xs },
  removeText: { fontSize: 15, fontWeight: "600", color: colors.muted },
});
