import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COUNTRIES,
  COUNTRY_CODES,
  COUNTRY_REGIONS,
  COUNTRY_REGION_LABELS,
  type CountryCode,
  type CountryRegion,
} from '@lexiroot/shared';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface Props {
  visible: boolean;
  selected?: CountryCode;
  onSelect: (code: CountryCode) => void;
  onClose: () => void;
}

type ListItem =
  | { type: 'region'; key: string; label: string }
  | { type: 'country'; key: string; code: CountryCode };

function buildList(filter: string): ListItem[] {
  const trimmed = filter.trim().toLowerCase();
  const items: ListItem[] = [];
  COUNTRY_REGIONS.forEach((region: CountryRegion) => {
    const codesInRegion = COUNTRY_CODES.filter((c) => COUNTRIES[c].region === region).filter((c) => {
      if (!trimmed) return true;
      const info = COUNTRIES[c];
      return (
        info.name.toLowerCase().includes(trimmed) ||
        info.dialCode.includes(trimmed) ||
        c.toLowerCase().includes(trimmed)
      );
    });
    if (codesInRegion.length === 0) return;
    items.push({ type: 'region', key: `region:${region}`, label: COUNTRY_REGION_LABELS[region] });
    codesInRegion.forEach((code) => {
      items.push({ type: 'country', key: `country:${code}`, code });
    });
  });
  return items;
}

export function CountryPickerModal({ visible, selected, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const items = useMemo(() => buildList(search), [search]);

  function handleSelect(code: CountryCode) {
    onSelect(code);
    setSearch('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Select country</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.neutral} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.neutralVariant} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search country or code"
            placeholderTextColor={colors.neutralVariant}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            if (item.type === 'region') {
              return <Text style={styles.regionHeader}>{item.label}</Text>;
            }
            const info = COUNTRIES[item.code];
            const isSelected = item.code === selected;
            return (
              <Pressable
                onPress={() => handleSelect(item.code)}
                style={({ pressed }) => [
                  styles.row,
                  isSelected && styles.rowSelected,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.flag}>{info.flag}</Text>
                <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>
                  {info.name}
                </Text>
                <Text style={styles.dial}>{info.dialCode}</Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
          contentContainerStyle={items.length === 0 ? styles.emptyWrap : undefined}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.neutralSoft,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutral,
    paddingVertical: 0,
  },
  regionHeader: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.neutralVariant,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowSelected: {
    backgroundColor: colors.primarySofter,
  },
  rowPressed: {
    backgroundColor: colors.neutralSoft,
  },
  flag: {
    fontSize: 22,
  },
  name: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.neutral,
  },
  nameSelected: {
    color: colors.primary,
  },
  dial: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
  },
  empty: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  emptyWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
