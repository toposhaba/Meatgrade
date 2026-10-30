import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BEEF_DEGREES, gradeSession, LAMB_STREAKING } from "../shared/grading.js";
import {
  MATURITIES,
  SEX_CLASSES,
  SPECIES,
  callFor,
  emptyDraft,
  isWaitingOnInput,
  toInput,
  type Draft,
  type SavedSession,
} from "./draft";
import { capturePhoto, sampleCut, type CapturedPhoto } from "./photo";
import { colors, radius, space, type } from "./theme";
import { Button, Chips, Field, Notice, Row, Section, Segmented, Toggle } from "./ui";

const PORK_COLORS = ["1", "2", "3", "4", "5", "6"];
const PORK_MARBLING = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

type Message = { tone: "warn" | "ok"; text: string };

export function GradeScreen({
  onSave,
}: {
  onSave: (session: Omit<SavedSession, "id" | "createdAt">) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [degreeLocked, setDegreeLocked] = useState(false);

  const decision = useMemo(() => gradeSession(toInput(draft)), [draft]);
  const call = callFor(decision);
  const waiting = isWaitingOnInput(decision);
  const canSave = Boolean(call) && draft.carcassId.trim().length > 0;

  function patch(partial: Partial<Draft>) {
    setMessage(null);
    setDraft((current) => ({ ...current, ...partial }));
  }

  function applyPhoto(next: CapturedPhoto) {
    setPhoto(next);
    const { analysis } = next;
    const partial: Partial<Draft> = {
      photoCaptured: true,
      estimatedMarblingPercent: analysis.marblingPercent,
    };
    if (draft.species === "Beef" && analysis.suggestedDegree && !degreeLocked) {
      partial.marblingDegree = analysis.suggestedDegree;
    }
    if (draft.species === "Pork") {
      if (analysis.suggestedPorkColor) partial.colorScore = String(analysis.suggestedPorkColor);
      if (analysis.suggestedPorkMarbling) {
        partial.porkMarblingScore = String(analysis.suggestedPorkMarbling);
      }
    }
    if (draft.species === "Lamb" && analysis.suggestedDegree && !degreeLocked) {
      partial.flankStreaking = LAMB_STREAKING.includes(analysis.suggestedDegree)
        ? analysis.suggestedDegree
        : "Slightly Abundant";
    }
    patch(partial);
    if (!analysis.enoughTissue) {
      setMessage({
        tone: "warn",
        text: "Not enough lean or fat in the frame. Move closer to the ribeye face.",
      });
    }
  }

  async function onPhoto(source: "camera" | "library") {
    setBusy(true);
    try {
      const next = await capturePhoto(source);
      if (next) applyPhoto(next);
    } catch (error) {
      setMessage({
        tone: "warn",
        text: error instanceof Error ? error.message : "The photo could not be read.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onSavePress() {
    if (!canSave || !call) return;
    const carcassId = draft.carcassId.trim();
    try {
      await onSave({ ...draft, carcassId, ...decision });
      reset();
      setMessage({ tone: "ok", text: `${carcassId} saved as ${call}.` });
    } catch {
      setMessage({ tone: "warn", text: "This phone could not store the grade." });
    }
  }

  function reset() {
    setDraft(emptyDraft());
    setPhoto(null);
    setDegreeLocked(false);
  }

  const suggestion = photo?.analysis.suggestedDegree ?? null;
  const estimate = draft.estimatedMarblingPercent;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: 180 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <Segmented
          options={SPECIES}
          value={draft.species}
          onChange={(species) => {
            setDegreeLocked(false);
            patch({ species });
          }}
        />

        <Section title="Carcass">
          <Field
            label="Carcass ID"
            value={draft.carcassId}
            onChange={(carcassId) => patch({ carcassId })}
            placeholder="Lot or tag number"
          />
        </Section>

        <Section title="Photo">
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photoEmpty}>
              <Text style={styles.photoEmptyTitle}>Ribeye face</Text>
              <Text style={[type.small, { textAlign: "center" }]}>
                {draft.species === "Beef"
                  ? "Shoot straight on between the 12th and 13th ribs, in even light."
                  : "Shoot the cut surface straight on, in even light."}
              </Text>
            </View>
          )}
          <Row>
            <Button
              label={busy ? "Reading…" : "Take photo"}
              onPress={() => void onPhoto("camera")}
              disabled={busy}
              style={styles.flex}
            />
            <Button
              label="Library"
              kind="secondary"
              onPress={() => void onPhoto("library")}
              disabled={busy}
              style={styles.flex}
            />
          </Row>
          {busy ? <ActivityIndicator color={colors.accent} /> : null}
          {estimate != null ? (
            <Text style={type.small}>
              Camera reads {estimate.toFixed(1)}% fat in the meat pixels
              {suggestion && draft.species === "Beef" ? ` and suggests ${suggestion}.` : "."} It
              is a sorting aid, not a USDA measurement.
            </Text>
          ) : null}
          {__DEV__ ? (
            <Button
              label="Use a sample cut"
              kind="quiet"
              onPress={() => applyPhoto(sampleCut(0.055))}
              disabled={busy}
            />
          ) : null}
        </Section>

        {draft.species === "Beef" ? (
          <>
            <Section title="Marbling">
              <Chips
                options={BEEF_DEGREES}
                value={draft.marblingDegree}
                suggested={suggestion}
                onChange={(marblingDegree) => {
                  setDegreeLocked(true);
                  patch({ marblingDegree });
                }}
              />
              <Text style={type.small}>
                Confirm the degree you see. A dashed red outline is the camera's suggestion.
              </Text>
            </Section>

            <Section title="Carcass maturity">
              <View style={{ gap: space.sm }}>
                <Text style={styles.subLabel}>Maturity group</Text>
                <Segmented
                  options={MATURITIES}
                  value={draft.maturity}
                  onChange={(maturity) => patch({ maturity })}
                />
              </View>
              <View style={{ gap: space.sm }}>
                <Text style={styles.subLabel}>Sex class</Text>
                <Chips
                  options={SEX_CLASSES}
                  value={draft.sexClass}
                  onChange={(sexClass) => patch({ sexClass: sexClass as Draft["sexClass"] })}
                />
              </View>
              <Toggle
                label="Dark cutter"
                detail="Prime, Choice, and Select drop one full grade."
                value={draft.darkCutter}
                onChange={(darkCutter) => patch({ darkCutter })}
              />
            </Section>

            <Section
              title="Yield grade"
              aside={<Text style={type.small}>Optional</Text>}
            >
              <Row>
                <Field
                  label="Fat thickness"
                  unit="in"
                  keyboard="decimal-pad"
                  value={draft.fatThickness}
                  onChange={(fatThickness) => patch({ fatThickness })}
                />
                <Field
                  label="Ribeye area"
                  unit="sq in"
                  keyboard="decimal-pad"
                  value={draft.ribeyeArea}
                  onChange={(ribeyeArea) => patch({ ribeyeArea })}
                />
              </Row>
              <Row>
                <Field
                  label="Hot carcass weight"
                  unit="lb"
                  keyboard="decimal-pad"
                  value={draft.hotCarcassWeight}
                  onChange={(hotCarcassWeight) => patch({ hotCarcassWeight })}
                />
                <Field
                  label="KPH fat"
                  unit="%"
                  keyboard="decimal-pad"
                  value={draft.kphPercent}
                  onChange={(kphPercent) => patch({ kphPercent })}
                />
              </Row>
            </Section>
          </>
        ) : null}

        {draft.species === "Pork" ? (
          <Section title="Pork scores">
            <View style={{ gap: space.sm }}>
              <Text style={styles.subLabel}>Color, 1 pale to 6 dark</Text>
              <Chips
                options={PORK_COLORS}
                value={draft.colorScore}
                onChange={(colorScore) => patch({ colorScore })}
              />
            </View>
            <View style={{ gap: space.sm }}>
              <Text style={styles.subLabel}>Marbling, 1 to 10</Text>
              <Chips
                options={PORK_MARBLING}
                value={draft.porkMarblingScore}
                onChange={(porkMarblingScore) => patch({ porkMarblingScore })}
              />
            </View>
          </Section>
        ) : null}

        {draft.species === "Lamb" ? (
          <Section title="Flank streaking">
            <Chips
              options={LAMB_STREAKING}
              value={draft.flankStreaking}
              suggested={suggestion && LAMB_STREAKING.includes(suggestion) ? suggestion : null}
              onChange={(flankStreaking) => {
                setDegreeLocked(true);
                patch({ flankStreaking });
              }}
            />
          </Section>
        ) : null}

        <Section title="Notes">
          <Field
            label="Grader notes"
            value={draft.notes}
            onChange={(notes) => patch({ notes })}
            placeholder="Anything the office should know"
            multiline
          />
        </Section>
        <Button label="Clear form" kind="quiet" onPress={reset} />
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        {message ? <Notice tone={message.tone} text={message.text} /> : null}
        <View style={styles.barRow}>
          <View style={styles.flex}>
            <Text style={type.section}>
              {draft.species === "Beef" ? "QUALITY GRADE" : "PLANT SORT"}
            </Text>
            <Text
              style={[
                type.grade,
                !call && { color: colors.faint },
                decision.requiresReview && call ? { color: colors.warn } : null,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {call ?? "—"}
            </Text>
            {decision.yieldGrade != null ? (
              <Text style={type.small}>
                Yield grade {decision.yieldGrade}
                {decision.yieldScore != null ? ` · scored ${decision.yieldScore.toFixed(2)}` : ""}
              </Text>
            ) : null}
          </View>
          <Button label="Save" onPress={() => void onSavePress()} disabled={!canSave} />
        </View>
        {decision.requiresReview ? (
          <Text style={[type.small, !waiting && { color: colors.warn }]}>
            {decision.reviewReason}
          </Text>
        ) : !draft.carcassId.trim() && call ? (
          <Text style={type.small}>Add the carcass ID to save.</Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: space.lg,
    gap: space.xl,
  },
  subLabel: { fontSize: 14, fontWeight: "600", color: colors.muted },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
  },
  photoEmpty: {
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
    gap: space.xs,
  },
  photoEmptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.sm,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
});
