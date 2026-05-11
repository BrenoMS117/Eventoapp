import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../utils/theme';

export function FieldInput({
  label, value, onChangeText, error, placeholder, icon,
  secureTextEntry, onToggleSecure, keyboardType,
  autoCapitalize = 'sentences', autoCorrect = false,
  multiline = false, maxLength, editable = true,
  hint, required = false,
}) {
  const hasError = !!error;
  return (
    <View style={s.wrapper}>
      {label ? (
        <View style={s.labelRow}>
          <Text style={s.label}>
            {label}{required ? <Text style={{ color: COLORS.primary }}> *</Text> : ''}
          </Text>
          {hint ? <Text style={s.hint}>{hint}</Text> : null}
        </View>
      ) : null}

      <View style={[
        s.inputBox,
        hasError && s.inputBoxError,
        !editable && s.inputBoxDisabled,
        multiline && s.inputBoxMulti,
      ]}>
        {icon ? <Ionicons name={icon} size={17} color={hasError ? COLORS.danger : COLORS.textMuted} style={s.icon} /> : null}
        <TextInput
          style={[s.input, multiline && s.inputMulti]}
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
          <TouchableOpacity onPress={onToggleSecure} style={{ padding: 4 }}>
            <Ionicons name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
        {maxLength && value ? (
          <Text style={s.counter}>{value.length}/{maxLength}</Text>
        ) : null}
      </View>

      {hasError ? (
        <View style={s.errorRow}>
          <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSub },
  hint: { fontSize: 11, color: COLORS.textMuted },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, minHeight: 50,
  },
  inputBoxError: { borderColor: COLORS.danger, backgroundColor: COLORS.danger + '11' },
  inputBoxDisabled: { opacity: 0.5 },
  inputBoxMulti: { alignItems: 'flex-start', paddingVertical: 10 },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  counter: { fontSize: 11, color: COLORS.textMuted, marginLeft: 4 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  errorText: { fontSize: 12, color: COLORS.danger, flex: 1 },
});
