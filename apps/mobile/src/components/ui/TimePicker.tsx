import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface TimePickerProps {
  value: Date;
  onChange: (next: Date) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  // Hold a draft so iOS spinner changes don't commit until Done is tapped.
  const [draft, setDraft] = useState<Date>(value);

  function openPicker() {
    setDraft(value);
    setOpen(true);
  }

  function handleAndroidChange(_e: DateTimePickerEvent, selected?: Date) {
    setOpen(false);
    if (selected) onChange(selected);
  }

  function handleIosChange(_e: DateTimePickerEvent, selected?: Date) {
    if (selected) setDraft(selected);
  }

  function commitIos() {
    setOpen(false);
    onChange(draft);
  }

  return (
    <>
      <Pressable onPress={openPicker} hitSlop={8} style={styles.trigger}>
        <Text style={styles.triggerText}>{formatTime(value)}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.primary} />
      </Pressable>

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour={false}
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <DateTimePicker
                value={draft}
                mode="time"
                display="spinner"
                onChange={handleIosChange}
                themeVariant="light"
              />
              <View style={styles.actions}>
                <Pressable onPress={() => setOpen(false)} hitSlop={8} style={styles.actionBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={commitIos} hitSlop={8} style={styles.actionBtn}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  triggerText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  actionBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.neutralVariant,
  },
  doneText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primary,
  },
});
