import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius, space, type } from "./theme";

export function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={type.section}>{title.toUpperCase()}</Text>
        {aside}
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chips({
  options,
  value,
  onChange,
  suggested,
  scroll,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
  suggested?: string | null;
  scroll?: boolean;
}) {
  const content = options.map((option) => {
    const active = option === value;
    const hinted = !active && option === suggested;
    return (
      <Pressable
        key={option}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => onChange(option)}
        style={[styles.chip, active && styles.chipActive, hinted && styles.chipHinted]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
      </Pressable>
    );
  });
  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {content}
      </ScrollView>
    );
  }
  return <View style={styles.chipWrap}>{content}</View>;
}

export function Field({
  label,
  value,
  onChange,
  unit,
  placeholder,
  keyboard = "default",
  multiline,
  style,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  unit?: string;
  placeholder?: string;
  keyboard?: "default" | "decimal-pad" | "number-pad";
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputShell, multiline && styles.inputShellTall]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          keyboardType={keyboard}
          inputMode={keyboard === "default" ? "text" : "decimal"}
          multiline={multiline}
          autoCapitalize={keyboard === "default" ? "characters" : "none"}
          autoCorrect={false}
          style={[styles.input, multiline && styles.inputTall]}
          accessibilityLabel={label}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

export function Toggle({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.toggleRow}
    >
      <View style={{ flex: 1 }}>
        <Text style={type.label}>{label}</Text>
        {detail ? <Text style={type.small}>{detail}</Text> : null}
      </View>
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  kind = "primary",
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary" | "quiet";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        kind === "primary" && styles.buttonPrimary,
        kind === "secondary" && styles.buttonSecondary,
        kind === "quiet" && styles.buttonQuiet,
        disabled && styles.buttonDisabled,
        pressed && !disabled && { opacity: 0.85 },
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          kind === "primary" && styles.buttonTextPrimary,
          kind === "quiet" && styles.buttonTextQuiet,
          disabled && styles.buttonTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Notice({ tone, text }: { tone: "warn" | "ok" | "muted"; text: string }) {
  return (
    <View
      style={[
        styles.notice,
        tone === "warn" && { backgroundColor: colors.warnSoft },
        tone === "ok" && { backgroundColor: colors.okSoft },
      ]}
    >
      <Text
        style={[
          type.small,
          tone === "warn" && { color: colors.warn },
          tone === "ok" && { color: colors.ok },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.lg,
  },
  row: { flexDirection: "row", gap: space.md },
  track: {
    flexDirection: "row",
    backgroundColor: colors.track,
    borderRadius: radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md - 3,
  },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { fontSize: 16, fontWeight: "600", color: colors.muted },
  segmentTextActive: { color: colors.text },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chipScroll: { gap: space.sm, paddingRight: space.lg },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipHinted: { borderColor: colors.accent, borderStyle: "dashed" },
  chipText: { fontSize: 15, fontWeight: "600", color: colors.text },
  chipTextActive: { color: colors.onInk },
  field: { gap: 6, flex: 1 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: colors.muted },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
  },
  inputShellTall: { alignItems: "flex-start", paddingVertical: 10 },
  input: { flex: 1, fontSize: 17, color: colors.text, paddingVertical: 0 },
  inputTall: { minHeight: 60, textAlignVertical: "top" },
  unit: { fontSize: 14, color: colors.faint, marginLeft: 8 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: 44,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    padding: 3,
    justifyContent: "center",
  },
  switchOn: { backgroundColor: colors.accent },
  knob: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  knobOn: { alignSelf: "flex-end" },
  button: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonQuiet: { backgroundColor: "transparent", minHeight: 40 },
  buttonDisabled: { backgroundColor: colors.track, borderColor: colors.track },
  buttonText: { fontSize: 16, fontWeight: "700", color: colors.text },
  buttonTextPrimary: { color: colors.onInk },
  buttonTextQuiet: { color: colors.accent },
  buttonTextDisabled: { color: colors.faint },
  notice: {
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    backgroundColor: colors.track,
  },
});
