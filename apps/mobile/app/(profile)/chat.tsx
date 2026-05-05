import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatBubble } from '../../src/components/ui/ChatBubble';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  timestamp: string;
}

const SAMPLE_BOT_REPLY =
  'Thanks for letting me know.\n\nIf you were offline, your progress is saved on your device and will sync automatically when you’re back online.';

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const now = new Date().toISOString();
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text, timestamp: now };
    setMessages((prev) => [...prev, userMsg]);
    setDraft('');

    // Demo bot reply so the bot bubble UI shows up — swap for real chat backend later.
    setTimeout(() => {
      const reply: Message = {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: SAMPLE_BOT_REPLY,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }, 600);
  }

  const isEmpty = messages.length === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Chat With Us" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        {isEmpty ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble" size={28} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Need Help?</Text>
            <Text style={styles.emptySubtitle}>
              Ask us anything about your lessons, progress, or account.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <ChatBubble role={item.role} text={item.text} timestamp={item.timestamp} />
            )}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Enter a message"
              placeholderTextColor={colors.neutralVariant}
              style={styles.input}
              onSubmitEditing={send}
              returnKeyType="send"
            />
          </View>
          <Pressable
            onPress={send}
            disabled={!draft.trim()}
            hitSlop={8}
            style={({ pressed }) => [styles.sendBtn, pressed && styles.pressed]}
          >
            <Ionicons
              name="send"
              size={20}
              color={draft.trim() ? colors.primary : colors.neutralVariant}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primarySofter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.primary,
  },
  emptySubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    textAlign: 'center',
    lineHeight: 19,
  },
  list: {
    paddingVertical: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.neutral,
    padding: 0,
  },
  sendBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
