import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows, typography } from '../theme';

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
  multi?: boolean;
}

export default function ChipSelector({ options, selected, onChange, label, multi = true }: ChipSelectorProps) {
  const toggle = (opt: string) => {
    if (multi) {
      onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
    } else {
      onChange(selected.includes(opt) ? [] : [opt]);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.chipRow}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <TouchableOpacity key={opt} style={[s.chip, active && s.chipActive]} onPress={() => toggle(opt)}>
              <Text style={[s.chipText, active && s.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.chip,
    backgroundColor: colors.cardAlt,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 2,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});