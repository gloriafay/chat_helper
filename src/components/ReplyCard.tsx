import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ReplySuggestion, ReplyStrategy } from '../types';
import { colors, spacing, radius, shadows } from '../theme';

interface ReplyCardProps {
  suggestion: ReplySuggestion;
  index: number;
  onAdopt?: (suggestion: ReplySuggestion) => void;
}

/** 全局策略面板 */
export function StrategyPanel({ strategy }: { strategy?: ReplyStrategy }) {
  if (!strategy) return null;
  return (
    <View style={s.strategyBox}>
      <Text style={s.strategyTitle}>🧠 AI 策略分析</Text>
      <View style={s.strategyRow}>
        <Text style={s.strategyLabel}>核心目标</Text>
        <Text style={s.strategyValue}>{strategy.mainGoal}</Text>
      </View>
      <View style={s.strategyRow}>
        <Text style={s.strategyLabel}>沟通策略</Text>
        <Text style={s.strategyValue}>{strategy.approach}</Text>
      </View>
      {strategy.mustKeep?.length > 0 && (
        <View style={s.strategyRow}>
          <Text style={s.strategyLabel}>保留要点</Text>
          <Text style={s.strategyValue}>{strategy.mustKeep.join('；')}</Text>
        </View>
      )}
      {strategy.riskControl?.length > 0 && (
        <View style={s.strategyRow}>
          <Text style={s.strategyLabel}>规避风险</Text>
          <Text style={s.strategyValue}>{strategy.riskControl.join('；')}</Text>
        </View>
      )}
    </View>
  );
}

export default function ReplyCard({ suggestion, index, onAdopt }: ReplyCardProps) {
  const [adopted, setAdopted] = useState(false);

  return (
    <View style={[s.card, adopted && s.cardAdopted]}>
      <View style={s.header}>
        <View style={s.badge}><Text style={s.badgeText}>#{index + 1}</Text></View>
        <View style={s.toneBadge}><Text style={s.toneText}>{suggestion.tone}</Text></View>
        {adopted && <View style={s.adoptedBadge}><Text style={s.adoptedText}>✓ 已采用</Text></View>}
      </View>
      <Text style={s.reply}>{suggestion.reply}</Text>
      <Text style={s.reason}>💡 {suggestion.reason}</Text>
      <View style={s.actions}>
        <TouchableOpacity style={s.copyBtn} onPress={() => Alert.alert('已复制', suggestion.reply)}>
          <Text style={s.copyBtnText}>📋 复制</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.adoptBtn, adopted && s.adoptBtnDone]} onPress={() => { setAdopted(true); onAdopt?.(suggestion); }} disabled={adopted}>
          <Text style={[s.adoptBtnText, adopted && s.adoptBtnTextDone]}>{adopted ? '✓ 已采用' : '✅ 采用并保存'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  strategyBox: {
    backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  strategyTitle: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  strategyRow: { marginBottom: spacing.xs },
  strategyLabel: { fontSize: 11, fontWeight: '600', color: colors.primaryDark, marginBottom: 2 },
  strategyValue: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.primary, ...shadows.card,
  },
  cardAdopted: { borderLeftColor: colors.success, backgroundColor: colors.successLight },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  badge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  toneBadge: { backgroundColor: colors.primaryLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  toneText: { color: colors.primary, fontSize: 12, fontWeight: '500' },
  adoptedBadge: { backgroundColor: colors.successLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  adoptedText: { color: colors.success, fontSize: 12, fontWeight: '600' },
  reply: { fontSize: 15, color: colors.textPrimary, lineHeight: 22, marginBottom: 8 },
  reason: { fontSize: 12, color: colors.textTertiary, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  copyBtn: { flex: 1, backgroundColor: colors.cardAlt, borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  copyBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  adoptBtn: { flex: 1, backgroundColor: colors.success, borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  adoptBtnDone: { backgroundColor: colors.successLight },
  adoptBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  adoptBtnTextDone: { color: colors.success },
});