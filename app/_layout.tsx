import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../src/store';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="contact/new"
          options={{ presentation: 'modal', headerShown: true, title: '新建聊天对象' }}
        />
        <Stack.Screen
          name="contact/[id]"
          options={{ headerShown: true, title: '聊天对象详情' }}
        />
        <Stack.Screen
          name="chat/[contactId]"
          options={{ headerShown: false, title: '聊天' }}
        />
      </Stack>
    </AppProvider>
  );
}