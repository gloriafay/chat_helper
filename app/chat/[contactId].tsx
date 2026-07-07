import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useApp } from '../../src/store';
import MessageBubble from '../../src/components/MessageBubble';
import ReplyCard, { StrategyPanel } from '../../src/components/ReplyCard';
import EmptyState from '../../src/components/EmptyState';
import * as storage from '../../src/services/storage';
import { SCENE_OPTIONS } from '../../src/constants/options';
import { generateReplies, generateMockReplies } from '../../src/services/replyGenerator';
import { REPLY_PROMPT_VERSION } from '../../src/services/prompt';
import { generateId } from '../../src/services/storage';
import { ReplySuggestion, ReplyStrategy } from '../../src/types';
import { colors, spacing, radius, shadows, typography } from '../../src/theme';

export default function UnifiedChatPage() {
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  const { state, actions } = useApp();

  const contact = state.contacts.find((c) => c.id === contactId);
  const messages = (state.messages[contactId ?? ''] ?? []).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedRef = useRef<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showReplyPanel, setShowReplyPanel] = useState(false);
  const [incomingMessage, setIncomingMessage] = useState('');
  const [userIntent, setUserIntent] = useState('');
  const [suggestions, setSuggestions] = useState<ReplySuggestion[]>([]);
  const [strategy, setStrategy] = useState<ReplyStrategy | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(useCallback(() => { if (contactId) actions.loadMessages(contactId); }, [contactId]));

  if (!contact) return <EmptyState icon="🔍" title="未找到聊天对象" />;

  // ==================== 选择 ====================
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      selectedRef.current = Array.from(n);
      if (n.size === 0) { setSelectMode(false); setShowConfirmDelete(false); }
      return n;
    });
  };
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); selectedRef.current = []; setShowConfirmDelete(false); };

  // ==================== ★ 删除消息（最小兜底） ====================
  const executeDeleteMessages = async () => {
    const ids = [...selectedRef.current]; // 拷贝
    console.log('[ChatPage] executeDeleteMessages, ids=', ids);
    if (ids.length === 0) return;
    setDeleting(true);
    try {
      // 1. storage 批量删除
      await storage.deleteMessages(contactId!, ids);
      console.log('[ChatPage] storage.deleteMessages done');

      // 2. 从 storage 重读
      const fresh = await storage.getMessages(contactId!);
      console.log('[ChatPage] fresh messages count=', fresh.length);

      // 3. dispatch 最新数据
      const { useApp } = require('../../src/store');
      await actions.loadMessages(contactId!);

      // 4. 清空选择
      exitSelectMode();
    } catch (e: any) {
      console.error('[ChatPage] executeDeleteMessages error:', e);
    } finally {
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRef.current.length === 0) return;
    setShowConfirmDelete(true);
  };

  // ==================== 生成 ====================
  const handleGenerate = async () => {
    if (!state.userSettings) { router.push('/(tabs)/profile'); return; }
    if (!userIntent.trim()) return;
    setIsLoading(true); setError(null); setSuggestions([]); setStrategy(undefined);
    try {
      await actions.loadMessages(contactId!);
      const latestMessages = state.messages[contactId!] ?? [];
      const result = await generateReplies({
        userSettings: state.userSettings,
        contactProfile: contact,
        recentMessages: latestMessages.slice(-10),
        incomingMessage,
        userIntent,
      });
      setStrategy(result.strategy);
      setSuggestions(result.suggestions);
    } catch (e: any) { setError(e.message || '生成失败'); }
    finally { setIsLoading(false); }
  };

  const handleAdopt = async (suggestion: ReplySuggestion) => {
    try {
      if (incomingMessage.trim()) await actions.addMessage({ id: generateId(), contactId: contactId!, role: 'them', content: incomingMessage.trim(), timestamp: new Date().toISOString() });
      await actions.addMessage({ id: generateId(), contactId: contactId!, role: 'me', content: suggestion.reply, timestamp: new Date().toISOString() });
      await actions.loadMessages(contactId!);
      setIncomingMessage(''); setUserIntent(''); setSuggestions([]); setStrategy(undefined); setShowReplyPanel(false);
      setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 200);

      // ==================== 长期记忆 MVP ====================
      console.log('[handleAdopt] memory check: incomingMessage=', !!incomingMessage.trim(), 'contact=', !!contact, 'count=', contact?.memoryTurnCountSinceLastUpdate || 0);
      // 每采纳一次“对方消息 + 我的回复”，计为 1 轮有效对话
      if (incomingMessage.trim() && contact) {
        const newCount = (contact.memoryTurnCountSinceLastUpdate || 0) + 1;
        const updatedContact = { ...contact, memoryTurnCountSinceLastUpdate: newCount };
        await actions.updateContact(updatedContact);

        if (newCount >= 10) {
          try {
            console.log('[handleAdopt] triggering memory update for contact=', contactId?.slice(-6));
            const { updateContactMemory } = await import('../../src/services/memoryUpdater') as any;
            console.log('[handleAdopt] dynamic import succeeded');
            const latestMsgs = await storage.getMessages(contactId!);
            const recent = latestMsgs.slice(-20);

            const memoryResult = await updateContactMemory({
              contactProfile: contact,
              existingMemory: contact.notes || '',
              recentMessages: recent,
            });

            console.log('[handleAdopt] memoryResult:', JSON.stringify({ shouldUpdate: memoryResult?.shouldUpdate, reason: memoryResult?.reason?.slice(0, 80) }));
            if (memoryResult?.shouldUpdate && memoryResult.mergedMemory) {
              await actions.updateContact({
                ...updatedContact,
                notes: memoryResult.mergedMemory,
                memoryTurnCountSinceLastUpdate: 0,
                memoryUpdatedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              console.log('[memory] updated notes for contact=', contactId?.slice(-6));
            } else {
              await actions.updateContact({
                ...updatedContact,
                memoryTurnCountSinceLastUpdate: 0,
                updatedAt: new Date().toISOString(),
              });
              console.log('[memory] no update needed for contact=', contactId?.slice(-6));
            }
          } catch (memErr: any) {
            console.error('[memory] update error:', memErr?.message || memErr);
          }
        }
      }
    } catch (e: any) { console.error('[handleAdopt] outer error:', e?.message || e); }
  };;

  return (
    <KeyboardAvoidingView style={st.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={st.header}>
        {selectMode ? (
          <View>
            <View style={st.selectHeader}>
              <TouchableOpacity onPress={exitSelectMode}><Text style={st.cancelText}>取消</Text></TouchableOpacity>
              <Text style={st.selectCount}>已选 {selectedIds.size} 条</Text>
              <TouchableOpacity onPress={handleDeleteSelected}><Text style={st.deleteText}>🗑 删除</Text></TouchableOpacity>
            </View>
            {/* ★ 页面内确认区域 */}
            {showConfirmDelete && (
              <View style={st.confirmBar}>
                <Text style={st.confirmBarText}>确定删除选中的 {selectedIds.size} 条消息？</Text>
                <View style={st.confirmBarActions}>
                  <TouchableOpacity style={st.confirmBarCancel} onPress={() => setShowConfirmDelete(false)} disabled={deleting}>
                    <Text style={st.confirmBarCancelText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[st.confirmBarOk, deleting && { opacity: 0.5 }]} onPress={executeDeleteMessages} disabled={deleting}>
                    <Text style={st.confirmBarOkText}>{deleting ? '删除中...' : '确认删除'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <>
            <TouchableOpacity onPress={() => router.back()} style={st.backBtn}><Text style={st.backText}>← 返回</Text></TouchableOpacity>
            <View style={st.headerCenter}><Text style={st.headerTitle}>{contact.nickname}</Text><Text style={st.headerScene}>{SCENE_OPTIONS.find(o => o.value === contact.scene)?.label ?? ''}</Text></View>
            <TouchableOpacity onPress={() => setSelectMode(true)}><Text style={st.selectBtnText}>选择</Text></TouchableOpacity>
          </>
        )}
      </View>

      {/* ★ 调试条 */}
      <View style={st.debugBar}>
        <Text style={st.debugText}>💬 msgs: {messages.length} | 已选: {selectedIds.size} | cId: {contactId?.slice(-6)}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef} data={messages} keyExtractor={(item) => item.id}
        contentContainerStyle={messages.length === 0 ? st.empty : st.list}
        ListEmptyComponent={<EmptyState icon="💬" title="开始聊天吧" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={selectMode ? () => toggleSelect(item.id) : undefined}
            onLongPress={!selectMode ? () => { setSelectMode(true); toggleSelect(item.id); } : undefined}
            activeOpacity={selectMode ? 0.6 : 1}
          >
            <View>
              {/* ★ 开发环境显示 message.id */}
              <Text style={st.msgId}>#{item.id.slice(-6)}</Text>
              <View style={selectMode && selectedIds.has(item.id) ? st.selectedMsg : undefined}>
                {selectMode && (
                  <View style={[st.checkbox, selectedIds.has(item.id) && st.checkboxActive]}>
                    {selectedIds.has(item.id) && <Text style={st.checkmark}>✓</Text>}
                  </View>
                )}
                <MessageBubble message={item} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        onContentSizeChange={() => { if (messages.length > 0 && !showReplyPanel) flatListRef.current?.scrollToEnd?.({ animated: false }); }}
      />

      {/* Reply Panel */}
      {showReplyPanel && (
        <View style={st.replyPanel}>
          <View style={st.handleBarWrap}><View style={st.handleBar} /></View>
          <ScrollView style={st.replyScroll} contentContainerStyle={st.replyScrollContent} bounces={false}>
            <Text style={st.label}>📩 对方发来的消息</Text>
            <TextInput style={st.input} value={incomingMessage} onChangeText={setIncomingMessage} placeholder="粘贴..." placeholderTextColor={colors.textPlaceholder} multiline numberOfLines={2} textAlignVertical="top" />
            <Text style={st.label}>💡 我想表达的核心意思</Text>
            <TextInput style={st.input} value={userIntent} onChangeText={setUserIntent} placeholder="输入你想表达的内容" placeholderTextColor={colors.textPlaceholder} multiline numberOfLines={3} textAlignVertical="top" />
            <TouchableOpacity style={[st.genBtn, isLoading && st.genBtnDisabled]} onPress={handleGenerate} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={st.genBtnText}>✨ 生成回复建议</Text>}
            </TouchableOpacity>
            {error && <View style={st.errorBox}><Text style={st.errorText}>❌ {error}</Text></View>}
            {strategy && <StrategyPanel strategy={strategy} />}
            {suggestions.map((s, i) => <ReplyCard key={i} suggestion={s} index={i} onAdopt={handleAdopt} />)}
            <View style={{ height: 16 }} />
          </ScrollView>
        </View>
      )}

      {!showReplyPanel && (
        <TouchableOpacity style={st.replyFab} onPress={() => { setShowReplyPanel(true); setError(null); setSuggestions([]); setStrategy(undefined); }}>
          <Text style={st.replyFabText}>✨ 生成回复</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.card, paddingHorizontal: spacing.lg, paddingTop: Platform.OS === 'ios' ? 50 : 12, paddingBottom: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.separator },
  backBtn: { paddingRight: 12 }, backText: { fontSize: 16, color: colors.primary },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.headline }, headerScene: { ...typography.caption, marginTop: 1 },
  selectBtnText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  selectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelText: { fontSize: 14, color: colors.primary },
  selectCount: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  deleteText: { fontSize: 14, color: colors.danger },
  // ★ 确认条
  confirmBar: { backgroundColor: '#FFF5F5', marginTop: spacing.sm, borderRadius: radius.sm, padding: spacing.md, borderWidth: 1, borderColor: '#FFD0D0' },
  confirmBarText: { fontSize: 13, color: '#C53030', marginBottom: spacing.sm },
  confirmBarActions: { flexDirection: 'row', gap: spacing.sm },
  confirmBarCancel: { flex: 1, backgroundColor: '#fff', borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  confirmBarCancelText: { fontSize: 13, color: '#666', fontWeight: '600' },
  confirmBarOk: { flex: 1, backgroundColor: '#E53E3E', borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center' },
  confirmBarOkText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  // ★ 调试
  debugBar: { backgroundColor: '#FFF3CD', paddingHorizontal: spacing.lg, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#FFE69C' },
  debugText: { fontSize: 11, color: '#856404', fontWeight: '600' },
  list: { padding: spacing.md, paddingBottom: 20 }, empty: { flexGrow: 1 },
  msgId: { fontSize: 9, color: '#ddd', marginLeft: 6, marginBottom: -2 },
  selectedMsg: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary }, checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  replyPanel: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '60%', ...shadows.panel },
  replyScroll: { flex: 1 }, replyScrollContent: { padding: spacing.lg, paddingBottom: 40 },
  handleBarWrap: { alignItems: 'center', marginBottom: spacing.md, paddingTop: spacing.sm },
  handleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.separator },
  label: { ...typography.subhead, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.cardAlt, borderRadius: radius.input, padding: spacing.md, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.md, minHeight: 50, textAlignVertical: 'top', borderWidth: 0.5, borderColor: colors.border },
  genBtn: { backgroundColor: colors.primary, borderRadius: radius.button, padding: 14, alignItems: 'center' },
  genBtnDisabled: { opacity: 0.6 }, genBtnText: { ...typography.button },
  errorBox: { backgroundColor: colors.dangerLight, borderRadius: radius.sm, padding: spacing.md, marginTop: spacing.md },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18 },
  replyFab: { backgroundColor: colors.primary, marginHorizontal: spacing.lg, marginBottom: 12, borderRadius: radius.button, padding: 14, alignItems: 'center', ...shadows.button },
  replyFabText: { ...typography.button },
});