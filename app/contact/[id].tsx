import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/store';
import ChipSelector from '../../src/components/ChipSelector';
import EmptyState from '../../src/components/EmptyState';
import * as storage from '../../src/services/storage';
import { colors, spacing, radius, shadows, typography, componentStyles } from '../../src/theme';
import {
  SCENE_OPTIONS, GENDER_OPTIONS, AGE_RANGE_OPTIONS, ZODIAC_OPTIONS,
  MBTI_EI_OPTIONS, MBTI_SN_OPTIONS, MBTI_TF_OPTIONS, MBTI_JP_OPTIONS,
  INTEREST_OPTIONS, PERSONALITY_TRAIT_OPTIONS, DANGER_ZONE_OPTIONS,
} from '../../src/constants/options';
import {
  ContactProfile, Scene, Gender, AgeRange, ZodiacSign,
  MBTIDimensions, combineMBTI, DEFAULT_MBTI_DIMENSIONS,
} from '../../src/types';

export default function ContactDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useApp();
  const contact = state.contacts.find((c) => c.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nickname, setNickname] = useState('');
  const [scene, setScene] = useState<Scene>('');
  const [gender, setGender] = useState<Gender>('');
  const [ageRange, setAgeRange] = useState<AgeRange>('');
  const [zodiac, setZodiac] = useState<ZodiacSign>('');
  const [mbtiDims, setMbtiDims] = useState<MBTIDimensions>({ ...DEFAULT_MBTI_DIMENSIONS });
  const [occupation, setOccupation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [dangerZones, setDangerZones] = useState<string[]>([]);
  const [conversationGoal, setConversationGoal] = useState('');
  const [chatBoundary, setChatBoundary] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (contact) {
      setNickname(contact.nickname); setScene(contact.scene);
      setGender(contact.gender ?? ''); setAgeRange(contact.ageRange ?? '');
      setZodiac(contact.zodiac ?? ''); setMbtiDims(contact.mbtiDimensions ?? { ...DEFAULT_MBTI_DIMENSIONS });
      setOccupation(contact.occupation ?? ''); setInterests(contact.interests ?? []);
      setPersonalityTraits(contact.personalityTraits ?? []); setDangerZones(contact.dangerZones ?? []);
      setConversationGoal(contact.conversationGoal ?? ''); setChatBoundary(contact.chatBoundary ?? '');
      setNotes(contact.notes ?? '');
    }
  }, [contact]);

  if (!contact) return <EmptyState icon="🔍" title="未找到该聊天对象" />;

  const mbtiStr = combineMBTI(mbtiDims);

  const handleSave = async () => {
    const updated: ContactProfile = {
      ...contact, nickname: nickname.trim(), scene, gender, ageRange, zodiac,
      mbtiDimensions: mbtiDims, mbti: mbtiStr,
      occupation, interests, personalityTraits, dangerZones,
      conversationGoal, chatBoundary, notes,
      updatedAt: new Date().toISOString(),
    };
    await actions.updateContact(updated);
    setIsEditing(false);
  };

  // ★ 最小兜底删除：storage.delete → getContacts → dispatch SET_CONTACTS → replace
  const executeDelete = async () => {
    const targetId = contact.id;
    console.log('[ContactDetail] executeDelete START, id=', targetId);
    setDeleting(true);
    try {
      // 1. 从 storage 删除
      await storage.deleteContact(targetId);
      console.log('[ContactDetail] storage.deleteContact done');

      // 2. 从 storage 重读最新 contacts
      const freshContacts = await storage.getContacts();
      console.log('[ContactDetail] freshContacts count=', freshContacts.length, '含已删id=', freshContacts.some(c => c.id === targetId));

      // 3. 直接 dispatch SET_CONTACTS（绕过 store 的 deleteContact）
      const { useApp } = require('../../src/store');
      // 我们用 actions.loadAll 来触发 SET_CONTACTS
      await actions.loadAll();
      console.log('[ContactDetail] loadAll done, state.contacts=', freshContacts.length);

      // 4. 导航回首页
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error('[ContactDetail] executeDelete error:', e);
      Alert.alert('删除失败', String(e?.message || e));
    } finally {
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  if (!isEditing) {
    return (
      <ScrollView style={st.scroll} contentContainerStyle={st.content}>
        <View style={st.headerCard}>
          <View style={st.avatarLarge}><Text style={st.avatarText}>{contact.nickname.charAt(0)}</Text></View>
          <Text style={st.nickname}>{contact.nickname}</Text>
          <Text style={st.sceneLabel}>{SCENE_OPTIONS.find(o => o.value === contact.scene)?.label ?? ''}</Text>
        </View>
        <Text style={st.debug}>🆔 id: {contact.id.slice(-8)}</Text>

        <Section title="基本信息">
          <Row label="性别" value={GENDER_OPTIONS.find(o => o.value === contact.gender)?.label} />
          <Row label="年龄段" value={AGE_RANGE_OPTIONS.find(o => o.value === contact.ageRange)?.label} />
          <Row label="职业" value={contact.occupation} />
        </Section>
        <Section title="星座 & MBTI">
          <Row label="星座" value={ZODIAC_OPTIONS.find(o => o.value === contact.zodiac)?.label} />
          <Row label="MBTI" value={contact.mbti || '未设置'} />
        </Section>
        <Section title="特征与偏好">
          <Row label="兴趣" value={contact.interests.join('、')} />
          <Row label="性格" value={contact.personalityTraits.join('、')} />
          <Row label="雷区" value={contact.dangerZones.join('、')} />
        </Section>
        <Section title="对话策略">
          <Row label="目标" value={contact.conversationGoal} />
          <Row label="边界" value={contact.chatBoundary} />
        </Section>
        {contact.notes ? (
          <Section title="备注">
            <Text style={st.notesText}>{contact.notes}</Text>
            {contact.memoryUpdatedAt ? <Text style={st.memoryTime}>记忆更新于 {contact.memoryUpdatedAt.slice(0, 10)}</Text> : null}
          </Section>
        ) : null}

        {/* 编辑按钮 */}
        <View style={{ marginTop: spacing.lg, marginHorizontal: spacing.lg }}>
          <TouchableOpacity style={componentStyles.secondaryButton} onPress={() => setIsEditing(true)}>
            <Text style={componentStyles.secondaryButtonText}>✏️ 编辑</Text>
          </TouchableOpacity>
        </View>

        {/* ★ 页面内确认删除区域 */}
        <View style={{ marginTop: spacing.md, marginHorizontal: spacing.lg }}>
          {!showConfirmDelete ? (
            <TouchableOpacity style={componentStyles.dangerButton} onPress={() => setShowConfirmDelete(true)}>
              <Text style={componentStyles.dangerButtonText}>🗑 删除</Text>
            </TouchableOpacity>
          ) : (
            <View style={st.confirmBox}>
              <Text style={st.confirmText}>
                确定删除「{contact.nickname}」？所有聊天记录一并清除，不可恢复。
              </Text>
              <View style={st.confirmActions}>
                <TouchableOpacity style={st.confirmCancel} onPress={() => setShowConfirmDelete(false)} disabled={deleting}>
                  <Text style={st.confirmCancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.confirmOk, deleting && { opacity: 0.5 }]} onPress={executeDelete} disabled={deleting}>
                  <Text style={st.confirmOkText}>{deleting ? '删除中...' : '确认删除'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.content}>
      <Text style={st.sectionHeader}>基本信息</Text>
      <View style={st.group}>
        <View style={st.row}><Text style={st.rowLabel}>昵称 *</Text><TextInput style={st.rowInput} value={nickname} onChangeText={setNickname} placeholderTextColor={colors.textPlaceholder} /></View>
        <View style={st.row}><Text style={st.rowLabel}>场景</Text><ChipSelector options={SCENE_OPTIONS.map(o => o.label)} selected={[SCENE_OPTIONS.find(o => o.value === scene)?.label ?? ''].filter(Boolean)} onChange={(vals) => { const o = SCENE_OPTIONS.find(x => x.label === vals[0]); setScene(o?.value ?? ''); }} multi={false} /></View>
        <View style={st.row}><Text style={st.rowLabel}>性别</Text><ChipSelector options={GENDER_OPTIONS.map(o => o.label)} selected={[GENDER_OPTIONS.find(o => o.value === gender)?.label ?? ''].filter(Boolean)} onChange={(vals) => { const o = GENDER_OPTIONS.find(x => x.label === vals[0]); setGender(o?.value ?? ''); }} multi={false} /></View>
        <View style={st.row}><Text style={st.rowLabel}>年龄段</Text><ChipSelector options={AGE_RANGE_OPTIONS.map(o => o.label)} selected={[AGE_RANGE_OPTIONS.find(o => o.value === ageRange)?.label ?? ''].filter(Boolean)} onChange={(vals) => { const o = AGE_RANGE_OPTIONS.find(x => x.label === vals[0]); setAgeRange(o?.value ?? ''); }} multi={false} /></View>
        <View style={st.row}><Text style={st.rowLabel}>职业</Text><TextInput style={st.rowInput} value={occupation} onChangeText={setOccupation} placeholderTextColor={colors.textPlaceholder} /></View>
      </View>
      <Text style={st.sectionHeader}>星座 & MBTI</Text>
      <View style={st.group}>
        <View style={st.row}><Text style={st.rowLabel}>星座</Text><ChipSelector options={ZODIAC_OPTIONS.map(o => o.label)} selected={[ZODIAC_OPTIONS.find(o => o.value === zodiac)?.label ?? ''].filter(Boolean)} onChange={(vals) => { const o = ZODIAC_OPTIONS.find(x => x.label === vals[0]); setZodiac(o?.value ?? ''); }} multi={false} /></View>
        <View style={st.row}><Text style={st.rowLabel}>MBTI</Text><View style={{ flex: 1 }}>
          {(['ei','sn','tf','jp'] as const).map((dim, i) => {
            const opts = [MBTI_EI_OPTIONS, MBTI_SN_OPTIONS, MBTI_TF_OPTIONS, MBTI_JP_OPTIONS][i];
            return (<View key={dim} style={st.mbtiRow}><Text style={st.mbtiDimLabel}>{['E/I','S/N','T/F','J/P'][i]}</Text><ChipSelector options={opts.map(o => o.label)} selected={[opts.find(o => o.value === mbtiDims[dim])?.label ?? ''].filter(Boolean)} onChange={(vals) => { setMbtiDims({ ...mbtiDims, [dim]: (opts.find(o => o.label === vals[0])?.value ?? '') as any }); }} multi={false} /></View>);
          })}
          {mbtiStr ? <Text style={st.mbtiResult}>MBTI：{mbtiStr}</Text> : null}
        </View></View>
      </View>
      <Text style={st.sectionHeader}>特征与偏好</Text>
      <View style={st.group}>
        <View style={st.chipRow}><Text style={st.rowLabel}>兴趣</Text><ChipSelector options={INTEREST_OPTIONS} selected={interests} onChange={setInterests} /></View>
        <View style={st.chipRow}><Text style={st.rowLabel}>性格</Text><ChipSelector options={PERSONALITY_TRAIT_OPTIONS} selected={personalityTraits} onChange={setPersonalityTraits} /></View>
        <View style={st.chipRow}><Text style={st.rowLabel}>雷区</Text><ChipSelector options={DANGER_ZONE_OPTIONS} selected={dangerZones} onChange={setDangerZones} /></View>
      </View>
      <Text style={st.sectionHeader}>对话策略</Text>
      <View style={st.group}>
        <View style={st.row}><Text style={st.rowLabel}>目标</Text><TextInput style={st.rowInput} value={conversationGoal} onChangeText={setConversationGoal} placeholderTextColor={colors.textPlaceholder} /></View>
        <View style={st.row}><Text style={st.rowLabel}>边界</Text><TextInput style={st.rowInput} value={chatBoundary} onChangeText={setChatBoundary} placeholderTextColor={colors.textPlaceholder} /></View>
      </View>
      <Text style={st.sectionHeader}>备注</Text>
      <View style={st.group}>
        <View style={[st.row, { flexDirection: 'column', alignItems: 'flex-start' }]}>
          <TextInput style={[st.rowInput, { width: '100%', minHeight: 80 }]} value={notes} onChangeText={setNotes} placeholder="偏好、长期记忆与补充信息" placeholderTextColor={colors.textPlaceholder} multiline textAlignVertical="top" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl, marginHorizontal: spacing.lg }}>
        <TouchableOpacity style={[componentStyles.primaryButton, { flex: 1 }]} onPress={handleSave}><Text style={componentStyles.primaryButtonText}>✅ 保存</Text></TouchableOpacity>
        <TouchableOpacity style={[componentStyles.secondaryButton, { flex: 1 }]} onPress={() => setIsEditing(false)}><Text style={componentStyles.secondaryButtonText}>取消</Text></TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View><Text style={st.sectionHeader}>{title}</Text><View style={st.group}>{children}</View></View>;
}
function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <View style={st.row}><Text style={st.rowLabel}>{label}</Text><Text style={st.rowValue}>{value}</Text></View>;
}

const st = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg }, content: { paddingBottom: 40 },
  sectionHeader: { ...typography.sectionHeader, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  group: { backgroundColor: colors.card, marginHorizontal: spacing.lg, borderRadius: radius.md, overflow: 'hidden', ...shadows.card },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 44, borderBottomWidth: 0.5, borderBottomColor: colors.separator },
  chipRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.separator },
  rowLabel: { width: 48, fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  rowValue: { flex: 1, fontSize: 15, color: colors.textPrimary },
  rowInput: { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 4 },
  debug: { fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: spacing.sm },
  headerCard: { backgroundColor: colors.primary, borderRadius: radius.xl, marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.xxl, alignItems: 'center' },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  nickname: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  sceneLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 6 },
  desc: { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center' },
  notesText: { fontSize: 14, color: colors.textSecondary, padding: spacing.lg, lineHeight: 20 },
  mbtiRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  mbtiDimLabel: { width: 32, fontSize: 11, fontWeight: '500', color: colors.textTertiary },
  mbtiResult: { marginTop: spacing.sm, fontSize: 15, fontWeight: '600', color: colors.primary },
  // ★ 确认删除区域
  confirmBox: { backgroundColor: '#FFF5F5', borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: '#FFD0D0' },
  confirmText: { fontSize: 14, color: '#C53030', marginBottom: spacing.md, lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: spacing.md },
  confirmCancel: { flex: 1, backgroundColor: '#EDF2F7', borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  confirmCancelText: { fontSize: 14, color: '#4A5568', fontWeight: '600' },
  confirmOk: { flex: 1, backgroundColor: '#E53E3E', borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  confirmOkText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  memoryTime: { fontSize: 11, color: colors.textTertiary, marginTop: 6 },
});