// ============================================================
// 核心数据模型
// ============================================================

/** 性别 */
export type Gender = 'male' | 'female' | '';

/** 星座 */
export type ZodiacSign =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces'
  | '';

/** MBTI 四维拆解 */
export interface MBTIDimensions {
  ei: 'E' | 'I' | '';
  sn: 'S' | 'N' | '';
  tf: 'T' | 'F' | '';
  jp: 'J' | 'P' | '';
}

export type AgeRange = '18-24' | '25-30' | '31-40' | '41-50' | '50+' | '';
export type CommunicationStyle =
  | 'direct' | 'gentle' | 'professional' | 'humorous'
  | 'restrained' | 'proactive' | 'boundary-aware';
export type ReplyPreference =
  | 'short' | 'gentle' | 'professional' | 'humorous'
  | 'restrained' | 'proactive' | 'boundary-aware';

/** 用户基础设定 */
export interface UserSettings {
  id: string;
  occupation: string;
  gender: Gender;
  ageRange: AgeRange;
  zodiac: ZodiacSign;
  mbtiDimensions: MBTIDimensions;
  mbti: string;
  personality: string[];
  communicationStyle: CommunicationStyle[];
  tabooTopics: string[];
  persona: string;
  replyPreferences: ReplyPreference[];
  createdAt: string;
  updatedAt: string;
}

/** 聊天对象 Profile（已移除 values、chatStyle 低价值字段） */
export interface ContactProfile {
  id: string;
  nickname: string;
  scene: Scene;
  gender: Gender;
  ageRange: AgeRange;
  zodiac: ZodiacSign;
  mbtiDimensions: MBTIDimensions;
  mbti: string;
  occupation: string;
  interests: string[];
  personalityTraits: string[];
  dangerZones: string[];
  conversationGoal: string;
  chatBoundary: string;
  /** 备注：偏好、长期记忆与补充信息 */
  notes: string;
  createdAt: string;
  updatedAt: string;
  /** 距离上次记忆更新后累计的有效对话轮数；达到 10 轮后触发 LLM 判断 */
  memoryTurnCountSinceLastUpdate: number;
  /** 记忆最近更新时间，ISO 字符串 */
  memoryUpdatedAt: string;
  sceneExtensions?: Record<string, string>;
}

export type Scene = 'work' | 'romance' | '';

/** 聊天消息 */
export interface ChatMessage {
  id: string;
  contactId: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  emotion?: string;
  importance?: 'low' | 'medium' | 'high';
  source?: string;
}

export type MessageRole = 'me' | 'them';

/** LLM 回复建议 */
export interface ReplySuggestion {
  reply: string;
  tone: string;
  reason: string;
}

/** 回复策略层 */
export interface ReplyStrategy {
  mainGoal: string;
  approach: string;
  mustKeep: string[];
  riskControl: string[];
}

/** LLM 结构化响应（strategy 为可选，兼容旧数据） */
export interface LLMResponse {
  strategy?: ReplyStrategy;
  suggestions: ReplySuggestion[];
}

/** 长期记忆 LLM 更新结果 */
export interface MemoryUpdateResult {
  shouldUpdate: boolean;
  memoryPatch: {
    add: string[];
    update: string[];
    remove: string[];
  };
  mergedMemory: string;
  reason: string;
}

/** Profile 解析结果（已移除 values、chatStyle） */
export interface ParsedProfile {
  nickname: string;
  scene: Scene;
  gender: Gender;
  ageRange: AgeRange;
  zodiac: ZodiacSign;
  mbtiDimensions: MBTIDimensions;
  mbti: string;
  occupation: string;
  interests: string[];
  personalityTraits: string[];
  dangerZones: string[];
  conversationGoal: string;
  chatBoundary: string;
  notes: string;
  confidence: number;
  rawText: string;
}

/** 文本解析输入 */
export interface ParseInput {
  type: 'text' | 'image';
  content: string;
}

/** 存储键名常量 */
export const STORAGE_KEYS = {
  USER_SETTINGS: '@chat_helper_user_settings',
  CONTACTS: '@chat_helper_contacts',
  MESSAGES: '@chat_helper_messages',
} as const;

/** 拼接 MBTI 字符串 */
export function combineMBTI(dims: MBTIDimensions): string {
  return [dims.ei, dims.sn, dims.tf, dims.jp].filter(Boolean).join('') || '';
}

/** 默认 MBTI 维度 */
export const DEFAULT_MBTI_DIMENSIONS: MBTIDimensions = {
  ei: '', sn: '', tf: '', jp: '',
};