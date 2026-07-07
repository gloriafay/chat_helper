import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: colors.card },
      headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.textPrimary },
      tabBarActiveTintColor: colors.tabActive,
      tabBarInactiveTintColor: colors.tabInactive,
      tabBarStyle: { borderTopColor: colors.tabBarBorder, backgroundColor: colors.tabBarBg },
    }}>
      <Tabs.Screen name="index" options={{
        title: '聊天对象', headerTitle: '聊天对象',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text>,
      }} />
      <Tabs.Screen name="profile" options={{
        title: '我的设定', headerTitle: '我的设定',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
      }} />
    </Tabs>
  );
}