import { useEffect, useRef, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatBubble } from '../../src/components/ui/ChatBubble';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import {
  SUPPORT_EMAIL,
  SUPPORT_TOPICS,
  type FaqEntry,
  type FaqTopic,
} from '../../src/constants/supportFaq';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

/** Which set of options to show in the picker panel below the conversation. */
type PanelView =
  | { kind: 'topics' }
  | { kind: 'questions'; topic: FaqTopic }
  | { kind: 'followup' }
  | { kind: 'contact' };

const GREETING =
  "Hi! I'm the LexiRoot helper. 👋\n\nPick a topic below and I'll answer the most common questions. If you can't find what you need, you can reach a human.";

const CONTACT_REPLY = `No problem — our team is happy to help.\n\nEmail us at ${SUPPORT_EMAIL} and we'll get back to you. Tap the button below to start an email.`;

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([{ id: 'greeting', role: 'bot', text: GREETING }]);
  const [view, setView] = useState<PanelView>({ kind: 'topics' });
  const listRef = useRef<FlatList<Message>>(null);
  const counter = useRef(0);

  function nextId(prefix: string) {
    counter.current += 1;
    return `${prefix}-${counter.current}`;
  }

  function append(...newMessages: Message[]) {
    setMessages((prev) => [...prev, ...newMessages]);
  }

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages]);

  function pickTopic(topic: FaqTopic) {
    setView({ kind: 'questions', topic });
  }

  function pickQuestion(entry: FaqEntry) {
    append(
      { id: nextId('u'), role: 'user', text: entry.question },
      { id: nextId('b'), role: 'bot', text: entry.answer },
    );
    setView({ kind: 'followup' });
  }

  function contactSupport() {
    append(
      { id: nextId('u'), role: 'user', text: 'I need to talk to someone' },
      { id: nextId('b'), role: 'bot', text: CONTACT_REPLY },
    );
    setView({ kind: 'contact' });
  }

  function openEmail() {
    const subject = encodeURIComponent('LexiRoot support request');
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Chat With Us" />
      <View style={styles.flex}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble role={item.role} text={item.text} timestamp="" />}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.panel}>
          <OptionPanel
            view={view}
            onPickTopic={pickTopic}
            onPickQuestion={pickQuestion}
            onBackToTopics={() => setView({ kind: 'topics' })}
            onContact={contactSupport}
            onOpenEmail={openEmail}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

interface OptionPanelProps {
  view: PanelView;
  onPickTopic: (topic: FaqTopic) => void;
  onPickQuestion: (entry: FaqEntry) => void;
  onBackToTopics: () => void;
  onContact: () => void;
  onOpenEmail: () => void;
}

function OptionPanel({
  view,
  onPickTopic,
  onPickQuestion,
  onBackToTopics,
  onContact,
  onOpenEmail,
}: OptionPanelProps) {
  if (view.kind === 'topics') {
    return (
      <>
        <Text style={styles.prompt}>Choose a topic</Text>
        {SUPPORT_TOPICS.map((topic) => (
          <OptionButton
            key={topic.id}
            icon={topic.icon}
            label={topic.label}
            onPress={() => onPickTopic(topic)}
          />
        ))}
        <OptionButton icon="mail-outline" label="Contact a human" variant="muted" onPress={onContact} />
      </>
    );
  }

  if (view.kind === 'questions') {
    return (
      <>
        <Text style={styles.prompt}>{view.topic.label}</Text>
        {view.topic.questions.map((entry) => (
          <OptionButton key={entry.id} label={entry.question} onPress={() => onPickQuestion(entry)} />
        ))}
        <OptionButton icon="arrow-back" label="Back to topics" variant="muted" onPress={onBackToTopics} />
      </>
    );
  }

  if (view.kind === 'contact') {
    return (
      <>
        <OptionButton icon="mail" label={`Email ${SUPPORT_EMAIL}`} onPress={onOpenEmail} />
        <OptionButton icon="arrow-back" label="Back to topics" variant="muted" onPress={onBackToTopics} />
      </>
    );
  }

  // followup
  return (
    <>
      <Text style={styles.prompt}>Did that help?</Text>
      <OptionButton icon="help-circle-outline" label="Ask another question" onPress={onBackToTopics} />
      <OptionButton icon="mail-outline" label="Contact a human" variant="muted" onPress={onContact} />
    </>
  );
}

interface OptionButtonProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'muted';
  onPress: () => void;
}

function OptionButton({ label, icon, variant = 'default', onPress }: OptionButtonProps) {
  const muted = variant === 'muted';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        muted && styles.optionMuted,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={muted ? colors.neutralVariant : colors.primary}
          style={styles.optionIcon}
        />
      ) : null}
      <Text style={[styles.optionLabel, muted && styles.optionLabelMuted]}>{label}</Text>
    </Pressable>
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
  list: {
    paddingVertical: spacing.md,
  },
  panel: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  prompt: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.neutralVariant,
    marginBottom: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySofter,
  },
  optionMuted: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionIcon: {
    marginRight: spacing.sm,
  },
  optionLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.neutral,
  },
  optionLabelMuted: {
    fontFamily: fonts.medium,
    color: colors.neutralVariant,
  },
  pressed: {
    opacity: 0.6,
  },
});
