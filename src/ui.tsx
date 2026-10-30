import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius, space } from "./theme";

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({
  label,
  value,
  onChange,
  prefix,
  unit,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  prefix?: string;
  unit?: string;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        {prefix ? <Text style={styles.unit}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          keyboardType="decimal-pad"
          inputMode="decimal"
          style={styles.input}
          accessibilityLabel={label}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
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

export function Rating({ value, size = 14 }: { value: number | null; size?: number }) {
  return (
    <View style={styles.rating} accessibilityLabel={value ? `${value} of 5` : "Not rated"}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View
          key={step}
          style={{
            width: size,
            height: size,
            borderRadius: size,
            backgroundColor: value != null && step <= value ? colors.accent : colors.track,
          }}
        />
      ))}
    </View>
  );
}

export function Tag({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "accent" | "ok" }) {
  return (
    <View
      style={[
        styles.tag,
        tone === "accent" && { backgroundColor: colors.accentSoft },
        tone === "ok" && { backgroundColor: colors.okSoft },
      ]}
    >
      <Text
        style={[
          styles.tagText,
          tone === "accent" && { color: colors.accent },
          tone === "ok" && { color: colors.ok },
        ]}
      >
        {label}
      </Text>
    </View>
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
          styles.noticeText,
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: {
    minHeight: 42,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 15, fontWeight: "600", color: colors.text },
  chipTextActive: { color: colors.onInk },
  field: { gap: 6 },
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
    gap: 6,
  },
  input: { flex: 1, fontSize: 17, color: colors.text, paddingVertical: 0 },
  unit: { fontSize: 15, color: colors.faint },
  button: {
    minHeight: 52,
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
  rating: { flexDirection: "row", gap: 5 },
  tag: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.track,
  },
  tagText: { fontSize: 13, fontWeight: "700", color: colors.muted },
  notice: {
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    backgroundColor: colors.track,
  },
  noticeText: { fontSize: 14, lineHeight: 20, color: colors.muted },
});
