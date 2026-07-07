// ============================================================
// 数据迁移与兼容旧 schema 数据
// ============================================================
//
// 每次字段新增/删除时提升 SCHEMA_VERSION
// 在 migrate() 中集中处理旧数据兼容
//
// 迁移记录
//   v1 -> v2: 增加 memoryTurnCountSinceLastUpdate、memoryUpdatedAt
//          移除 shortDescription、values、chatStyle

import { UserSettings, ContactProfile, ChatMessage } from "../types";

export const SCHEMA_VERSION = 2;

// ============================================================
// 用户设定迁移
// ============================================================

export function migrateUserSettings(data: any): UserSettings | null {
  if (!data) return null;
  // 兼容旧数据
  return {
    id: data.id || "",
    occupation: data.occupation || "",
    gender: data.gender || "",
    ageRange: data.ageRange || "",
    zodiac: data.zodiac || "",
    mbtiDimensions: data.mbtiDimensions || { ei: "", sn: "", tf: "", jp: "" },
    mbti: data.mbti || "",
    personality: Array.isArray(data.personality) ? data.personality : [],
    communicationStyle: Array.isArray(data.communicationStyle) ? data.communicationStyle : [],
    tabooTopics: Array.isArray(data.tabooTopics) ? data.tabooTopics : [],
    persona: data.persona || "",
    replyPreferences: Array.isArray(data.replyPreferences) ? data.replyPreferences : [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

export function migrateContacts(data: any[]): ContactProfile[] {
  if (!Array.isArray(data)) return [];
  return data.map((c) => migrateContact(c));
}

export function migrateContact(data: any): ContactProfile {
  // 清理已废弃字段
  const { shortDescription, values, chatStyle, ...clean } = data;

  return {
    id: clean.id || "",
    nickname: clean.nickname || "",
    scene: clean.scene || "",
    gender: clean.gender || "",
    ageRange: clean.ageRange || "",
    zodiac: clean.zodiac || "",
    mbtiDimensions: clean.mbtiDimensions || { ei: "", sn: "", tf: "", jp: "" },
    mbti: clean.mbti || "",
    occupation: clean.occupation || "",
    interests: Array.isArray(clean.interests) ? clean.interests : [],
    personalityTraits: Array.isArray(clean.personalityTraits) ? clean.personalityTraits : [],
    dangerZones: Array.isArray(clean.dangerZones) ? clean.dangerZones : [],
    conversationGoal: clean.conversationGoal || "",
    chatBoundary: clean.chatBoundary || "",
    notes: clean.notes || "",
    createdAt: clean.createdAt || new Date().toISOString(),
    updatedAt: clean.updatedAt || new Date().toISOString(),
    memoryTurnCountSinceLastUpdate: clean.memoryTurnCountSinceLastUpdate ?? 0,
    memoryUpdatedAt: clean.memoryUpdatedAt || "",
  };
}

export function migrateMessages(data: any[]): ChatMessage[] {
  if (!Array.isArray(data)) return [];
  return data.map((m) => ({
    id: m.id || "",
    contactId: m.contactId || "",
    role: m.role === "me" || m.role === "them" ? m.role : "me",
    content: m.content || "",
    timestamp: m.timestamp || new Date().toISOString(),
    emotion: m.emotion || undefined,
    importance: m.importance || undefined,
    source: m.source || undefined,
  }));
}
