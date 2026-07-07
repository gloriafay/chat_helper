import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/store';
import ChipSelector from '../../src/components/ChipSelector';
import {
  SCENE_OPTIONS, GENDER_OPTIONS, AGE_RANGE_OPTIONS, ZODIAC_OPTIONS,
  MBTI_EI_OPTIONS, MBTI_SN_OPTIONS, MBTI_TF_OPTIONS, MBTI_JP_OPTIONS,
  INTEREST_OPTIONS, PERSONALITY_TRAIT_OPTIONS, DANGER_ZONE_OPTIONS,
} from '../../src/constants/options';
import { generateId } from '../../src/services/storage';
import { parseContactProfileWithLLM } from '../../src/services/parser';
import { colors, spacing, radius, shadows, typography, componentStyles } from '../../src/theme';
import {
  ContactProfile, Scene, Gender, AgeRange, ZodiacSign,
  MBTIDimensions, ParsedProfile, DEFAULT_MBTI_DIMENSIONS, combineMBTI,
} from '../../src/types';

export default function NewContactPage() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { actions } = useApp();
  const isParseMode = params.mode === 'parse';
  const [mode, setMode] = useState<'manual' | 'parse'>(isParseMode ? 'parse' : 'manual');

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

  const [parseText, setParseText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const mbtiStr = combineMBTI(mbtiDims);

  const applyParsed = (r: ParsedProfile) => {
    if (r.nickname) setNickname(r.nickname);
    if (r.scene) setScene(r.scene);
    if (r.gender) setGender(r.gender);
    if (r.ageRange) setAgeRange(r.ageRange);
    if (r.zodiac) setZodiac(r.zodiac);
    if (r.mbtiDimensions) setMbtiDims(r.mbtiDimensions);
    if (r.occupation) setOccupation(r.occupation);
    if (r.interests.length) setInterests(r.interests);
    if (r.personalityTraits.length) setPersonalityTraits(r.personalityTraits);
    if (r.dangerZones.length) setDangerZones(r.dangerZones);
    if (r.conversationGoal) setConversationGoal(r.conversationGoal);
    if (r.chatBoundary) setChatBoundary(r.chatBoundary);
    if (r.notes) setNotes(r.notes);
  };

  const handleParse = async () => {
    if (!parseText.trim()) { Alert.alert('提示', '请先粘贴文本'); return; }
    setIsParsing(true);
    try {
      const result = await parseContactProfileWithLLM(parseText);
      applyParsed(result);
      setMode('manual');
      Alert.alert('解析完成', `已提取（置信度 ${Math.round(result.confidence * 100)}%），请确认并修改后保存。`);
    } catch (e: any) { Alert.alert('解析失败', e.message || '请重试'); }
    finally { setIsParsing(false); }
  };

  const handleSave = async () => {
    if (!nickname.trim()) { Alert.alert('提示', '请至少填写昵称'); return; }
    const c: ContactProfile = {
      id: generateId(), nickname: nickname.trim(), scene, gender, ageRange,
      zodiac, mbtiDimensions: mbtiDims, mbti: mbtiStr, occupation,
      interests, personalityTraits, dangerZones,
      conversationGoal, chatBoundary, notes,
      memoryTurnCountSinceLastUpdate: 0,
      memoryUpdatedAt: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await actions.addContact(c);
    router.back();
  };

  if (mode === 'parse') {
    return (
      <ScrollView style={st.scroll} contentContainerStyle={st.content}>
        <View style={st.modeToggle}>
          <TouchableOpacity style={[st.modeBtn, mode === 'parse' && st.modeBtnActive]} onPress={() => setMode('parse')}>
            <Text style={[st.modeText, mode === 'parse' && st.modeTextActive]}>🔍 智能解析</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.modeBtn, mode === 'manual' && st.modeBtnActive]} onPress={() => setMode('manual')}>
            <Text style={[st.modeText, mode === 'manual' && st.modeTextActive]}>✍️ 手动填写</Text>
          </TouchableOpacity>
        </View>
        <Text style={st.sectionHeader}>粘贴文本解析</Text>
        <View style={st.group}>
          <Text style={st.hint}>粘贴聊天截图文字或介绍文本，系统将通过 DeepSeek 自动提取 Profile 信息。</Text>
          <TextInput style={st.textArea} value={parseText} onChangeText={setParseText}
            placeholder={`如：\n他叫小明，28岁，做设计的\n喜欢电影和旅行，性格理性\n注意别提收入话题`}
            placeholderTextColor={colors.textPlaceholder} multiline numberOfLines={8} textAlignVertical="top" />
        </View>
        <TouchableOpacity style={st.primaryBtn} onPress={handleParse} disabled={isParsing}>
          {isParsing ? <ActivityIndicator color="#fff" /> : <Text style={st.primaryBtnText}>🔍 开始解析</Text>}
        </TouchableOpacity>
        <View style={st.divider}><View style={st.dividerLine} /><Text style={st.dividerText}>或</Text><View style={st.dividerLine} /></View>
        <TouchableOpacity style={st.outlineBtn} onPress={() => Alert.alert('图片解析', 'MVP 阶段图片 OCR 尚未接入。')}>
          <Text style={st.outlineBtnText}>📷 上传图片识别（即将支持）</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.content}>
      <View style={st.modeToggle}>
        <TouchableOpacity style={[st.modeBtn, mode === 'parse' && st.modeBtnActive]} onPress={() => setMode('parse')}>
          <Text style={[st.modeText, mode === 'parse' && st.modeTextActive]}>🔍 智能解析</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.modeBtn, mode === 'manual' && st.modeBtnActive]} onPress={() => setMode('manual')}>
          <Text style={[st.modeText, mode === 'manual' && st.modeTextActive]}>✍️ 手动填写</Text>
        </TouchableOpacity>
      </View>

      <Text style={st.sectionHeader}>基本信息</Text>
      <View style={st.group}>
        <View style={st.row}><Text style={st.rowLabel}>昵称 *</Text><TextInput style={st.rowInput} value={nickname} onChangeText={setNickname} placeholder="给对方起个名字" placeholderTextColor={colors.textPlaceholder} /></View>
        <View style={st.row}><Text style={st.rowLabel}>场景</Text><ChipSelector options={SCENE_OPTIONS.map(o => o.label)} selected={[SCENE_OPTIONS.find(o => o.value === scene)?.label ?? ''].filter(Boolean)} onChange={(vals) => { const o = SCENE_OPTIONS.find(x => x.label === vals[0]); setScene(o?.value ?? ''); }} multi={false} /></View>
        <View style={st.row}><Text style={st.rowLabel}>性别</Text><ChipSelector options={GENDER_OPTIONS.map(o => o.label)} selected={[GENDER_OPTIONS.find(o => o.value === gender)?.label ?? ''].filter(Boolean)} onChange={(vals) => { const o = GENDER_OPTIONS.find(x => x.label === vals[0]); setGender(o?.value ?? ''); }} multi={false} /></View>
        <View style={st.row}><Text style={st.rowLabel}>年龄段</Text><ChipSelector options={AGE_RANGE_OPTIONS.map(o => o.label)} selected={[AGE_RANGE_OPTIONS.find(o => o.value === ageRange)?.label ?? ''].filter(Boolean)} onChange={(vals) => { const o = AGE_RANGE_OPTIONS.find(x => x.label === vals[0]); setAgeRange(o?.value ?? ''); }} multi={false} /></View>
        <View style={st.row}><Text style={st.rowLabel}>职业</Text><TextInput style={st.rowInput} value={occupation} onChangeText={setOccupation} placeholder="如：设计师" placeholderTextColor={colors.textPlaceholder} /></View>
      </View>

      <Text style={st.sectionHeader}>星座 & MBTI</Text>
      <View style={st.group}>
        <View style={st.row}><Text style={st.rowLabel}>星座</Text><ChipSelector options={ZODIAC_OPTIONS.map(o => o.label)} selected={[ZODIAC_OPTIONS.find(o => o.value === zodiac)?.label ?? ''].filter(Boolean)} onChange={(vals) => { const o = ZODIAC_OPTIONS.find(x => x.label === vals[0]); setZodiac(o?.value ?? ''); }} multi={false} /></View>
        <View style={st.row}><Text style={st.rowLabel}>MBTI</Text><View style={{ flex: 1 }}>
          {(['ei','sn','tf','jp'] as const).map((dim, i) => {
            const opts = [MBTI_EI_OPTIONS, MBTI_SN_OPTIONS, MBTI_TF_OPTIONS, MBTI_JP_OPTIONS][i];
            return (<View key={dim} style={st.mbtiRow}><Text style={st.mbtiDimLabel}>{['第一维','第二维','第三维','第四维'][i]}</Text><ChipSelector options={opts.map(o => o.label)} selected={[opts.find(o => o.value === mbtiDims[dim])?.label ?? ''].filter(Boolean)} onChange={(vals) => { setMbtiDims({ ...mbtiDims, [dim]: (opts.find(o => o.label === vals[0])?.value ?? '') as any }); }} multi={false} /></View>);
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
        <View style={st.row}><Text style={st.rowLabel}>目标</Text><TextInput style={st.rowInput} value={conversationGoal} onChangeText={setConversationGoal} placeholder="如：推进项目" placeholderTextColor={colors.textPlaceholder} /></View>
        <View style={st.row}><Text style={st.rowLabel}>边界</Text><TextInput style={st.rowInput} value={chatBoundary} onChangeText={setChatBoundary} placeholder="如：仅聊工作" placeholderTextColor={colors.textPlaceholder} /></View>
      </View>

      <Text style={st.sectionHeader}>备注（偏好、长期记忆与补充信息）</Text>
      <View style={st.group}>
        <View style={[st.row, { flexDirection: 'column', alignItems: 'flex-start' }]}>
          <TextInput style={[st.rowInput, { width: '100%', minHeight: 80 }]} value={notes} onChangeText={setNotes}
            placeholder="例如：对方不喜欢被催回复；最近在准备考试；更喜欢轻松自然的表达；之前提到过想换工作。"
            placeholderTextColor={colors.textPlaceholder} multiline textAlignVertical="top" />
        </View>
      </View>

      <TouchableOpacity style={[st.primaryBtn, { marginTop: spacing.xxl }]} onPress={handleSave}>
        <Text style={st.primaryBtnText}>✅ 保存聊天对象</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  modeToggle: { flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: radius.md, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.lg, padding: 3 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.card, ...shadows.card },
  modeText: { fontSize: 14, color: colors.textTertiary, fontWeight: '500' },
  modeTextActive: { color: colors.primary, fontWeight: '700' },
  sectionHeader: { ...typography.sectionHeader, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  group: { backgroundColor: colors.card, marginHorizontal: spacing.lg, borderRadius: radius.md, overflow: 'hidden', ...shadows.card },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 44, borderBottomWidth: 0.5, borderBottomColor: colors.separator },
  chipRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.separator },
  rowLabel: { width: 56, fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  rowInput: { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 4 },
  hint: { fontSize: 13, color: colors.textTertiary, padding: spacing.lg, lineHeight: 18 },
  textArea: { backgroundColor: colors.cardAlt, margin: spacing.lg, marginTop: 0, borderRadius: radius.input, padding: spacing.md, fontSize: 14, color: colors.textPrimary, minHeight: 140, textAlignVertical: 'top', borderWidth: 0.5, borderColor: colors.border },
  primaryBtn: { ...componentStyles.primaryButton, marginHorizontal: spacing.lg, marginTop: spacing.md },
  primaryBtnText: { ...typography.button },
  outlineBtn: { ...componentStyles.secondaryButton, marginHorizontal: spacing.lg },
  outlineBtnText: { ...componentStyles.secondaryButtonText },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl, marginHorizontal: spacing.lg },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: colors.separator },
  dividerText: { marginHorizontal: 14, color: colors.textTertiary, fontSize: 13 },
  mbtiRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  mbtiDimLabel: { width: 48, fontSize: 11, fontWeight: '500', color: colors.textTertiary },
  mbtiResult: { marginTop: spacing.sm, fontSize: 15, fontWeight: '600', color: colors.primary },
});