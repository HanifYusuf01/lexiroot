import { Linking, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../constants/theme';
import { PRIVACY_URL, TERMS_URL } from '../../constants/legal';

/** Consent disclaimer shown on every signup path (email, Google, Apple). */
export function LegalDisclaimer() {
  return (
    <Text style={styles.text}>
      By continuing, you agree to our{' '}
      <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>
        Terms
      </Text>{' '}
      &amp;{' '}
      <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  link: {
    fontFamily: fonts.semibold,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
