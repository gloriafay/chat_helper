import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useApp } from '../../src/store';
import ChipSelector from '../../src/components/ChipSelector';
import {
  GENDER_OPTIONS,
  AGE_RANGE_OPTIONS,
  ZODIAC_OPTIONS,
  MBTI_EI_OPTIONS,
  MBTI_SN_OPTIONS,
  MBTI_TF_OPTIONS,
  MBTI_JP_OPTIONS,
  PERSONALITY_OPTIONS,
  COMMUNICATION_STYLE_OPTIONS,
  REPLY_PREFERENCE_OPTIONS,
  TABOO_TOPIC_OPTIONS,
} from '../../src/constants/options';
import { generateId } from '../../src/services/storage';
import { colors, spacing, radius, shadows, typography, componentStyles } from '../../src/theme';
import {
  UserSettings,
  Gender,
  AgeRange,
  ZodiacSign,
  MBTIDimensions,
  CommunicationStyle,
  ReplyPreference,
  DEFAULT_MBTI_DIMENSIONS,
  combineMBTI,
} from '../../src/types';

export default function UserProfilePage() {
  const { state, actions } = useApp();
  const existing = state.userSettings;

  const [occupation, setOccupation] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [ageRange, setAgeRange] = useState<AgeRange>('');
  const [zodiac, setZodiac] = useState<ZodiacSign>('');
  const [mbtiDims, setMbtiDims] = useState<MBTIDimensions>({ ...DEFAULT_MBTI_DIMENSIONS });
  const [personality, setPersonality] = useState<string[]>([]);
  const [commStyle, setCommStyle] = useState<CommunicationStyle[]>([]);
  const [tabooTopics, setTabooTopics] = useState<string[]>([]);
  const [persona, setPersona] = useState('');
  const [replyPrefs, setReplyPrefs] = useState<ReplyPreference[]>([]);

  useEffect(() => {
    if (existing) {
      setOccupation(existing.occupation ?? '');
      setGender(existing.gender ?? '');
      setAgeRange(existing.ageRange ?? '');
      setZodiac(existing.zodiac ?? '');
      setMbtiDims(existing.mbtiDimensions ?? { ...DEFAULT_MBTI_DIMENSIONS });
      setPersonality(existing.personality ?? []);
      setCommStyle(existing.communicationStyle ?? []);
      setTabooTopics(existing.tabooTopics ?? []);
      setPersona(existing.persona ?? '');
      setReplyPrefs(existing.replyPreferences ?? []);
    }
  }, [existing]);

  const mbtiStr = combineMBTI(mbtiDims);

  const handleSave = async () => {
    const settings: UserSettings = {
      id: existing?.id ?? generateId(),
      occupation,
      gender,
      ageRange,
      zodiac,
      mbtiDimensions: mbtiDims,
      mbti: mbtiStr,
      personality,
      communicationStyle: commStyle,
      tabooTopics,
      persona,
      replyPreferences: replyPrefs,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await actions.saveUserSettings(settings);
    Alert.alert('✅', '设定已保存');
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>

      {/* 基本信息 */}
      <Text style={s.sectionHeader}>基本信息</Text>
      <View style={s.group}>
        <View style={s.row}>
          <Text style={s.rowLabel}>职业</Text>
          <TextInput
            style={s.rowInput}
            value={occupation}
            onChangeText={setOccupation}
            placeholder="如：产品经理"
            placeholderTextColor={colors.textPlaceholder}
          />
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>性别</Text>
          <ChipSelector
            options={GENDER_OPTIONS.map((o) => o.label)}
            selected={[GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? ''].filter(Boolean)}
            onChange={(vals) => {
              const opt = GENDER_OPTIONS.find((o) => o.label === vals[0]);
              setGender(opt?.value ?? '');
            }}
            multi={false}
          />
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>年龄段</Text>
          <ChipSelector
            options={AGE_RANGE_OPTIONS.map((o) => o.label)}
            selected={[AGE_RANGE_OPTIONS.find((o) => o.value === ageRange)?.label ?? ''].filter(Boolean)}
            onChange={(vals) => {
              const opt = AGE_RANGE_OPTIONS.find((o) => o.label === vals[0]);
              setAgeRange(opt?.value ?? '');
            }}
            multi={false}
          />
        </View>
      </View>

      {/* 星座 & MBTI */}
      <Text style={s.sectionHeader}>星座 & MBTI</Text>
      <View style={s.group}>
        <View style={s.row}>
          <Text style={s.rowLabel}>星座</Text>
          <ChipSelector
            options={ZODIAC_OPTIONS.map((o) => o.label)}
            selected={[ZODIAC_OPTIONS.find((o) => o.value === zodiac)?.label ?? ''].filter(Boolean)}
            onChange={(vals) => {
              const opt = ZODIAC_OPTIONS.find((o) => o.label === vals[0]);
              setZodiac(opt?.value ?? '');
            }}
            multi={false}
          />
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>MBTI</Text>
          <View style={{ flex: 1 }}>
            <View style={s.mbtiRow}>
              <Text style={s.mbtiDimLabel}>第一维</Text>
              <ChipSelector
                options={MBTI_EI_OPTIONS.map((o) => o.label)}
                selected={[MBTI_EI_OPTIONS.find((o) => o.value === mbtiDims.ei)?.label ?? ''].filter(Boolean)}
                onChange={(vals) => setMbtiDims({ ...mbtiDims, ei: (MBTI_EI_OPTIONS.find((o) => o.label === vals[0])?.value ?? '') as 'E' | 'I' | '' })}
                multi={false}
              />
            </View>
            <View style={s.mbtiRow}>
              <Text style={s.mbtiDimLabel}>第二维</Text>
              <ChipSelector
                options={MBTI_SN_OPTIONS.map((o) => o.label)}
                selected={[MBTI_SN_OPTIONS.find((o) => o.value === mbtiDims.sn)?.label ?? ''].filter(Boolean)}
                onChange={(vals) => setMbtiDims({ ...mbtiDims, sn: (MBTI_SN_OPTIONS.find((o) => o.label === vals[0])?.value ?? '') as 'S' | 'N' | '' })}
                multi={false}
              />
            </View>
            <View style={s.mbtiRow}>
              <Text style={s.mbtiDimLabel}>第三维</Text>
              <ChipSelector
                options={MBTI_TF_OPTIONS.map((o) => o.label)}
                selected={[MBTI_TF_OPTIONS.find((o) => o.value === mbtiDims.tf)?.label ?? ''].filter(Boolean)}
                onChange={(vals) => setMbtiDims({ ...mbtiDims, tf: (MBTI_TF_OPTIONS.find((o) => o.label === vals[0])?.value ?? '') as 'T' | 'F' | '' })}
                multi={false}
              />
            </View>
            <View style={s.mbtiRow}>
              <Text style={s.mbtiDimLabel}>第四维</Text>
              <ChipSelector
                options={MBTI_JP_OPTIONS.map((o) => o.label)}
                selected={[MBTI_JP_OPTIONS.find((o) => o.value === mbtiDims.jp)?.label ?? ''].filter(Boolean)}
                onChange={(vals) => setMbtiDims({ ...mbtiDims, jp: (MBTI_JP_OPTIONS.find((o) => o.label === vals[0])?.value ?? '') as 'J' | 'P' | '' })}
                multi={false}
              />
            </View>
            {mbtiStr ? (
              <Text style={s.mbtiResult}>你的 MBTI：{mbtiStr}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* 性格与风格 */}
      <Text style={s.sectionHeader}>性格与风格</Text>
      <View style={s.group}>
        <View style={s.chipRow}>
          <Text style={s.rowLabel}>性格</Text>
          <ChipSelector options={PERSONALITY_OPTIONS} selected={personality} onChange={setPersonality} />
        </View>
        <View style={s.chipRow}>
          <Text style={s.rowLabel}>沟通风格</Text>
          <ChipSelector
            options={COMMUNICATION_STYLE_OPTIONS.map((o) => o.label)}
            selected={commStyle.map((v) => COMMUNICATION_STYLE_OPTIONS.find((o) => o.value === v)?.label ?? '')}
            onChange={(labels) => setCommStyle(labels.map((l) => COMMUNICATION_STYLE_OPTIONS.find((o) => o.label === l)?.value).filter(Boolean) as CommunicationStyle[])}
          />
        </View>
        <View style={s.chipRow}>
          <Text style={s.rowLabel}>回复偏好</Text>
          <ChipSelector
            options={REPLY_PREFERENCE_OPTIONS.map((o) => o.label)}
            selected={replyPrefs.map((v) => REPLY_PREFERENCE_OPTIONS.find((o) => o.value === v)?.label ?? '')}
            onChange={(labels) => setReplyPrefs(labels.map((l) => REPLY_PREFERENCE_OPTIONS.find((o) => o.label === l)?.value).filter(Boolean) as ReplyPreference[])}
          />
        </View>
      </View>

      {/* 边界与禁忌 */}
      <Text style={s.sectionHeader}>边界与禁忌</Text>
      <View style={s.group}>
        <View style={s.chipRow}>
          <Text style={s.rowLabel}>禁忌话题</Text>
          <ChipSelector options={TABOO_TOPIC_OPTIONS} selected={tabooTopics} onChange={setTabooTopics} />
        </View>
        <View style={[s.row, { flexDirection: 'column', alignItems: 'flex-start' }]}>
          <Text style={s.rowLabel}>希望维持的人设</Text>
          <TextInput
            style={[s.rowInput, { width: '100%', minHeight: 50 }]}
            value={persona}
            onChangeText={setPersona}
            placeholder="如：幽默但靠谱的前辈"
            placeholderTextColor={colors.textPlaceholder}
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>

      <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
        <Text style={s.saveBtnText}>保存设定</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  sectionHeader: {
    ...typography.sectionHeader,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  group: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.separator,
  },
  rowLabel: {
    width: 72,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  rowInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 4,
  },
  chipRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.separator,
  },
  mbtiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  mbtiDimLabel: {
    width: 52,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  mbtiResult: {
    marginTop: spacing.sm,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  saveBtn: {
    ...componentStyles.primaryButton,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  saveBtnText: { ...typography.button },
});