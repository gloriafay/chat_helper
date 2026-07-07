import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, UserSettings, ContactProfile, ChatMessage } from '../types';
import { migrateUserSettings, migrateContacts, migrateMessages } from './migration';

// ============================================================
// 通用存储工具
// ============================================================

async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

// ============================================================
// 用户设定
// ============================================================

export async function getUserSettings(): Promise<UserSettings | null> {
  const raw = await getItem<any>(STORAGE_KEYS.USER_SETTINGS);
  return migrateUserSettings(raw);
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  await setItem(STORAGE_KEYS.USER_SETTINGS, {
    ...settings,
    updatedAt: new Date().toISOString(),
  });
}

// ============================================================
// 聊天对象
// ============================================================

export async function getContacts(): Promise<ContactProfile[]> {
  const raw = await getItem<any[]>(STORAGE_KEYS.CONTACTS);
  return migrateContacts(raw ?? []);
}

export async function saveContacts(contacts: ContactProfile[]): Promise<void> {
  await setItem(STORAGE_KEYS.CONTACTS, contacts);
}

export async function getContactById(id: string): Promise<ContactProfile | undefined> {
  const contacts = await getContacts();
  return contacts.find((c) => c.id === id);
}

export async function addContact(contact: ContactProfile): Promise<ContactProfile[]> {
  const contacts = await getContacts();
  contacts.push(contact);
  await saveContacts(contacts);
  return contacts;
}

export async function updateContact(updated: ContactProfile): Promise<ContactProfile[]> {
  const contacts = await getContacts();
  const idx = contacts.findIndex((c) => c.id === updated.id);
  if (idx !== -1) {
    contacts[idx] = { ...updated, updatedAt: new Date().toISOString() };
    await saveContacts(contacts);
  }
  return contacts;
}

// ============================================================
// ★ 删除聊天对象（含日志）
// ============================================================

export async function deleteContact(contactId: string): Promise<ContactProfile[]> {
  console.log('[storage.deleteContact] START contactId=', contactId);

  // 读取删除前数据
  const beforeContacts = await getContacts();
  const beforeMsgs = await getMessages(contactId);
  console.log('[storage.deleteContact] 删除前 profiles=', beforeContacts.length, 'messages=', beforeMsgs.length);

  // 过滤并保存 contacts
  const afterContacts = beforeContacts.filter((c) => c.id !== contactId);
  await setItem(STORAGE_KEYS.CONTACTS, afterContacts);
  console.log('[storage.deleteContact] 已写入 filtered profiles=', afterContacts.length);

  // 删除关联消息
  await removeItem(messagesKey(contactId));
  const verifyMsgs = await getMessages(contactId);
  console.log('[storage.deleteContact] 已删除消息, 验证 messages=', verifyMsgs.length);

  // 验证 contacts
  const verifyContacts = await getContacts();
  console.log('[storage.deleteContact] DONE 删除后 profiles=', verifyContacts.length, 'persist 成功=', verifyContacts.length === afterContacts.length);
  return afterContacts;
}

// ============================================================
// 聊天消息
// ============================================================

function messagesKey(contactId: string): string {
  return `${STORAGE_KEYS.MESSAGES}_${contactId}`;
}

export async function getMessages(contactId: string): Promise<ChatMessage[]> {
  const raw = await getItem<any[]>(messagesKey(contactId));
  return migrateMessages(raw ?? []);
}

export async function addMessage(msg: ChatMessage): Promise<ChatMessage[]> {
  const msgs = await getMessages(msg.contactId);
  msgs.push(msg);
  await setItem(messagesKey(msg.contactId), msgs);
  return msgs;
}

export async function updateMessage(contactId: string, updated: ChatMessage): Promise<ChatMessage[]> {
  const msgs = await getMessages(contactId);
  const idx = msgs.findIndex((m) => m.id === updated.id);
  if (idx !== -1) {
    msgs[idx] = updated;
    await setItem(messagesKey(contactId), msgs);
  }
  return msgs;
}

// ============================================================
// ★ 删除单条消息（含日志）
// ============================================================

export async function deleteMessage(contactId: string, messageId: string): Promise<ChatMessage[]> {
  console.log('[storage.deleteMessage] contactId=', contactId, 'messageId=', messageId);
  const before = await getMessages(contactId);
  console.log('[storage.deleteMessage] 删除前 messages=', before.length);

  const after = before.filter((m) => m.id !== messageId);
  await setItem(messagesKey(contactId), after);

  const verify = await getMessages(contactId);
  console.log('[storage.deleteMessage] 删除后 messages=', after.length, 'persist验证=', verify.length);
  return after;
}

/** 批量删除消息 */
export async function deleteMessages(contactId: string, messageIds: string[]): Promise<ChatMessage[]> {
  console.log('[storage.deleteMessages] contactId=', contactId, '要删除=', messageIds.length, '条');
  const idSet = new Set(messageIds);
  const before = await getMessages(contactId);
  console.log('[storage.deleteMessages] 删除前 messages=', before.length);

  const after = before.filter((m) => !(m.contactId === contactId && idSet.has(m.id)));
  await setItem(messagesKey(contactId), after);

  const verify = await getMessages(contactId);
  console.log('[storage.deleteMessages] 删除后 messages=', after.length, '删除=', before.length - after.length, 'persist验证=', verify.length);
  return after;
}

export async function deleteMessagesByContact(contactId: string): Promise<void> {
  console.log('[storage.deleteMessagesByContact] contactId=', contactId);
  await removeItem(messagesKey(contactId));
}

/** 获取最近 N 条消息 */
export async function getRecentMessages(contactId: string, limit = 20): Promise<ChatMessage[]> {
  const msgs = await getMessages(contactId);
  return msgs.slice(-limit);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}