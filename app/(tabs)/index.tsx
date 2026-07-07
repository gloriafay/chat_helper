import React, { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '../../src/store';
import ContactCard from '../../src/components/ContactCard';
import EmptyState from '../../src/components/EmptyState';
import { colors, spacing, radius, shadows, typography } from '../../src/theme';

export default function ContactsHome() {
  const { state, actions } = useApp();

  const [showAddMenu, setShowAddMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      actions.loadAll();
    }, [])
  );

  const handleAddManual = () => { setShowAddMenu(false); router.push('/contact/new'); };
  const handleAddParse = () => { setShowAddMenu(false); router.push({ pathname: '/contact/new', params: { mode: 'parse' } }); };

  return (
    <View style={st.container}>
      {/* ★ 调试：contacts count */}
      <View style={st.debugBar}>
        <Text style={st.debugText}>📋 contacts: {state.contacts.length}</Text>
      </View>

      <FlatList
        data={state.contacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={state.contacts.length === 0 ? st.empty : st.list}
        ListEmptyComponent={<EmptyState icon="👋" title="还没有聊天对象" subtitle="点击右下角 ＋ 按钮" />}
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            onView={() => router.push({ pathname: '/contact/[id]', params: { id: item.id } })}
            onChat={() => router.push({ pathname: '/chat/[contactId]', params: { contactId: item.id } })}
          />
        )}
      />

      <TouchableOpacity style={st.fab} onPress={() => setShowAddMenu(!showAddMenu)}>
        <Text style={st.fabText}>{showAddMenu ? '✕' : '＋'}</Text>
      </TouchableOpacity>

      {showAddMenu && (
        <View style={st.addMenu}>
          <TouchableOpacity style={st.menuItem} onPress={handleAddManual}>
            <Text style={st.menuIcon}>✍️</Text>
            <View>
              <Text style={st.menuTitle}>手动填写</Text>
              <Text style={st.menuSub}>逐项填写聊天对象信息</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={st.menuItem} onPress={handleAddParse}>
            <Text style={st.menuIcon}>🔍</Text>
            <View>
              <Text style={st.menuTitle}>智能解析</Text>
              <Text style={st.menuSub}>粘贴文本 / 上传图片自动解析</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  debugBar: {
    backgroundColor: '#FFF3CD', paddingHorizontal: spacing.lg, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#FFE69C',
  },
  debugText: { fontSize: 12, color: '#856404', fontWeight: '600' },
  list: { padding: spacing.lg, paddingBottom: 100 },
  empty: { flexGrow: 1 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', ...shadows.fab,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' },
  addMenu: {
    position: 'absolute', bottom: 90, right: 20, backgroundColor: colors.card,
    borderRadius: radius.lg, padding: 6, minWidth: 220, ...shadows.panel,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, gap: 12 },
  menuIcon: { fontSize: 24 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  menuSub: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
});