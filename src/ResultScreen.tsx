import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CUTS } from "../shared/steak.js";
import type { AssessedScan } from "./scan";
import { colors, radius, space, type } from "./theme";
import { Button, Card, Chips, Field, Notice, Rating, Tag } from "./ui";

export function ResultScreen({
  scan,
  onChange,
  onRemove,
  onRescan,
}: {
  scan: AssessedScan;
  onChange: (partial: { cut?: string; pricePerLb?: string }) => void;
  onRemove: () => void;
  onRescan: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [armed, setArmed] = useState(false);
  const { assessment } = scan;
  const ok = assessment.status === "ok";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {scan.photoUri ? (
          <Image source={{ uri: scan.photoUri }} style={styles.photo} resizeMode="cover" />
        ) : null}

        <View style={styles.verdict}>
          <Rating value={assessment.rating} size={16} />
          <Text style={styles.headline}>{assessment.headline}</Text>
          <Text style={type.body}>{assessment.summary}</Text>
          {ok ? (
            <View style={styles.tags}>
              <Tag label={`Likely ${assessment.likelyGrade}`} tone="accent" />
              <Tag label={`${assessment.degree} marbling`} />
              {assessment.color ? (
                <Tag label={assessment.color.label} tone={assessment.color.concern ? "neutral" : "ok"} />
              ) : null}
            </View>
          ) : null}
        </View>

        {!ok ? <Button label="Scan again" onPress={onRescan} /> : null}

        {ok ? (
          <>
            <Card>
              <Text style={type.section}>WHAT CUT IS IT?</Text>
              <Chips options={CUTS} value={scan.cut} onChange={(cut) => onChange({ cut })} />
              {assessment.cutNote ? <Text style={type.small}>{assessment.cutNote}</Text> : null}
            </Card>

            <Card>
              <Text style={type.section}>HOW TO COOK IT</Text>
              <Text style={type.body}>{assessment.cookTip}</Text>
            </Card>

            {assessment.color ? (
              <Card>
                <Text style={type.section}>COLOR</Text>
                <Text style={styles.cardTitle}>{assessment.color.label}</Text>
                <Text style={type.small}>{assessment.color.note}</Text>
              </Card>
            ) : null}

            <Card>
              <Text style={type.section}>PRICE ON THE TAG</Text>
              <Field
                label="Per pound"
                prefix="$"
                unit="/lb"
                placeholder="0.00"
                value={scan.pricePerLb}
                onChange={(pricePerLb) => onChange({ pricePerLb })}
              />
              <Text style={type.small}>Optional. Scan a couple of steaks and Compare picks the best value.</Text>
            </Card>

            <Notice
              tone="muted"
              text={`The camera saw ${assessment.marblingPercent}% fat inside the meat. Lighting and plastic wrap change that number. The USDA shield on the package is the official grade.`}
            />
          </>
        ) : null}

        <Button
          label={armed ? "Tap again to remove" : "Remove this scan"}
          kind="quiet"
          onPress={() => {
            if (armed) {
              onRemove();
            } else {
              setArmed(true);
              setTimeout(() => setArmed(false), 3000);
            }
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.lg },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
  },
  verdict: { gap: space.sm },
  headline: { fontSize: 30, fontWeight: "800", letterSpacing: -0.8, color: colors.text },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.xs },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
});
