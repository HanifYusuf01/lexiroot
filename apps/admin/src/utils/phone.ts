import { COUNTRIES, COUNTRY_CODES, type CountryCode } from '@lexiroot/shared';

interface SplitPhone {
  country: CountryCode;
  digits: string;
}

/** Split a stored international phone (e.g. "+2348012345678") into its dial-code country and local digits. */
export function splitPhone(phone: string | null | undefined, fallbackCountry: CountryCode): SplitPhone {
  if (!phone) return { country: fallbackCountry, digits: '' };
  // Match by longest dial-code prefix so e.g. +234 wins over +2.
  const sorted = COUNTRY_CODES.slice().sort(
    (a, b) => COUNTRIES[b].dialCode.length - COUNTRIES[a].dialCode.length,
  );
  for (const code of sorted) {
    const dial = COUNTRIES[code].dialCode;
    if (phone.startsWith(dial)) {
      return { country: code, digits: phone.slice(dial.length) };
    }
  }
  return { country: fallbackCountry, digits: phone.replace(/^\+/, '') };
}

export function composePhone(country: CountryCode, digits: string): string {
  return `${COUNTRIES[country].dialCode}${digits}`;
}
