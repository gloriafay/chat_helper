import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../types';
import { colors, spacing, radius } from '../theme';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isMe = message.role === 'me';
  return (
    <View style={[s.row, isMe ? s.rowRight : s.rowLeft]}>
      <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
        <Text style={[s.content, isMe ? s.contentMe : s.contentThem]}>{message.content}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 6, paddingHorizontal: 0 },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.bubble,
  },
  bubbleMe: { backgroundColor: colors.bubbleMe, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: colors.bubbleThem, borderBottomLeftRadius: 4 },
  content: { fontSize: 15, lineHeight: 21 },
  contentMe: { color: colors.bubbleMeText },
  contentThem: { color: colors.bubbleThemText },
});