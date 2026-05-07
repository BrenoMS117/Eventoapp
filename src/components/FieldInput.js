import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../utils/theme";

export function FieldInput({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  icon,
  secureTextEntry,
  onToggleSecure,
  keyboardType,
  autoCapitalize = "sentences",
  autoCorrect = false,
  multiline = false,
  maxLength,
  editable = true,
  hint,
  required = false,
}) {
  const hasError = !!error;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : ""}
          </Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          hasError && styles.inputWrapperError,
          !editable && styles.inputWrapperDisabled,
          multiline && styles.inputWrapperMulti,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={17}
            color={hasError ? COLORS.danger : COLORS.textMuted}
            style={styles.icon}
          />
        ) : null}

        <TextInput
          style={[styles.input, multiline && styles.inputMulti]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          maxLength={maxLength}
          editable={editable}
        />

        {onToggleSecure ? (
          <TouchableOpacity onPress={onToggleSecure} style={styles.eyeBtn}>
            <Ionicons
              name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
              size={17}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        ) : null}

        {maxLength && value ? (
          <Text style={styles.counter}>
            {value.length}/{maxLength}
          </Text>
        ) : null}
      </View>

      {hasError ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  required: { color: COLORS.danger },
  hint: { fontSize: 11, color: COLORS.textMuted },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  inputWrapperError: { borderColor: COLORS.danger, backgroundColor: "#FFF8F8" },
  inputWrapperDisabled: { backgroundColor: COLORS.surfaceAlt, opacity: 0.7 },
  inputWrapperMulti: { alignItems: "flex-start", paddingVertical: 10 },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  eyeBtn: { padding: 4 },
  counter: { fontSize: 11, color: COLORS.textMuted, marginLeft: 4 },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  errorText: { fontSize: 12, color: COLORS.danger, flex: 1 },
});
