import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ContactProfile } from '../types';
import { colors, spacing, radius, shadows, typography } from '../theme';
import { SCENE_OPTIONS } from '../constants/options';

interface ContactCardProps {
  contact: ContactProfile;
  onView: () => void;
  onChat: () => void;
}

export default function ContactCard({ contact, onView, onChat }: ContactCardProps) {
  return (
    <View style={s.card}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{contact.nickname.charAt(0)}</Text>
      </View>
      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={s.name}>{contact.nickname}</Text>
          <Text style={s.scene}>{SCENE_OPTIONS.find((o) => o.value === contact.scene)?.label ?? ''}</Text>
        </View>
        <Text style={s.time}>更新于 {formatDate(contact.updatedAt)}</Text>
        <View style={s.actions}>
          <TouchableOpacity style={s.viewBtn} onPress={onView} activeOpacity={0.7}>
            <Text style={s.viewBtnText}>📋 查看</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.chatBtn} onPress={onChat} activeOpacity={0.7}>
            <Text style={s.chatBtnText}>💬 聊天</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function formatDate(iso: string): string {
  if (!iso) return '未知';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.card,
    padding: spacing.md, marginBottom: spacing.md, ...shadows.card, alignItems: 'flex-start',
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md, marginTop: 2 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  scene: { fontSize: 12, color: colors.textTertiary },
  desc: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  time: { fontSize: 11, color: colors.textTertiary, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  viewBtn: { flex: 1, backgroundColor: colors.cardAlt, borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center' },
  viewBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  chatBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center' },
  chatBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
});