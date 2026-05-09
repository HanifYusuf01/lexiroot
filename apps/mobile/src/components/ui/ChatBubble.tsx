import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

type Role = 'bot' | 'user';

interface ChatBubbleProps {
  role: Role;
  /** Plain text — for richer content (lists, etc.) pass children instead. */
  text?: string;
  children?: ReactNode;
  /** ISO date string or formatted timestamp. */
  timestamp: string;
}

function formatTime(input: string): string {
  // If it parses as a date, format; otherwise return as-is.
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function ChatBubble({ role, text, children, timestamp }: ChatBubbleProps) {
  const isUser = role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowBot]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        {children ?? <Text style={styles.text}>{text}</Text>}
        <Text style={styles.time}>{formatTime(timestamp)}</Text>
        <View style={[styles.tail, isUser ? styles.tailUser : styles.tailBot]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rowBot: {
    justifyContent: 'flex-start',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: colors.primarySofter,
    position: 'relative',
  },
  bubbleBot: {
    borderColor: colors.primaryBorder,
    borderTopLeftRadius: radius.sm,
  },
  bubbleUser: {
    backgroundColor: colors.chatBubbleUser,
    borderColor: colors.chatBubbleUser,
    borderTopRightRadius: radius.sm,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.neutral,
    lineHeight: 20,
  },
  time: {
    alignSelf: 'flex-end',
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.neutralVariant,
    marginTop: 2,
  },
  tail: {
    position: 'absolute',
    bottom: -7,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: colors.primarySofter,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
  },
  tailBot: {
    left: 12,
  },
  tailUser: {
    right: 12,
    borderTopColor: colors.chatBubbleUser,
  },
});
