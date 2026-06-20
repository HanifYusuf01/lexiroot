import Svg, { Path } from 'react-native-svg';

interface LexiRootLogoProps {
  /** Width in px; height scales to keep the 97:88 aspect ratio. */
  size?: number;
  color?: string;
}

// LexiRoot brand "L" mark. Used on the splash and any branding slot. Artwork
// viewBox is 0 0 97 88; rendered with preserveAspectRatio so it never distorts.
export function LexiRootLogo({ size = 97, color = '#FFFFFF' }: LexiRootLogoProps) {
  const height = (size * 88) / 97;
  return (
    <Svg
      width={size}
      height={height}
      viewBox="0 0 97 88"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <Path
        d="M52.973 0H76.8583L44.6393 70.6116C43.9058 72.2194 45.0808 74.0472 46.8481 74.0472H87.1764C92.5397 74.0472 96.8875 78.395 96.8875 83.7583V87.4H3.64193C1.54536 87.4 -0.118209 85.6342 0.00673705 83.5413L0.153997 81.0747C0.396431 77.0139 3.7603 73.8449 7.8283 73.8449H10.8925C14.7159 73.8449 18.1835 71.6014 19.7505 68.1139L49.2821 2.38794C49.9351 0.934791 51.3799 0 52.973 0Z"
        fill={color}
      />
    </Svg>
  );
}
