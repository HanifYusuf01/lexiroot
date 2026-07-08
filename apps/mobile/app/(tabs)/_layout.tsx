import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../src/constants/theme';

const TAB_BAR_HEIGHT = 66;
const TAB_BAR_GAP = 12;
// Horizontal breathing room so the pill doesn't hug the screen edges.
const TAB_BAR_SIDE_MARGIN = 36;

interface TabLabelProps {
  focused: boolean;
  color: string;
  label: string;
}

function TabLabel({ focused, color, label }: TabLabelProps) {
  if (!focused) return null;
  return (
    <Text style={{ color, fontFamily: fonts.semibold, fontSize: 11, marginTop: 2 }}>{label}</Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Float the pill a fixed gap ABOVE the system safe area (gesture bar / nav
  // buttons) so the OS controls never overlap it. On devices with no bottom
  // inset this falls back to just the gap.
  const tabBarBottom = insets.bottom + TAB_BAR_GAP;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutralVariant,
        // Let content scroll UNDER the pill so the blur has something to frost
        // (a floating glass bar over fully-padded content just looks white).
        sceneStyle: {
          paddingBottom: tabBarBottom + TAB_BAR_GAP,
        },
        // Frosted-glass fill, clipped to the pill's rounding. Faint white tint
        // keeps icon/label contrast; Android needs the experimental method for a
        // real blur (else it renders as a plain translucent).
        tabBarBackground: () => (
          <BlurView
            tint="light"
            intensity={40}
            experimentalBlurMethod="dimezisBlurView"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: radius.xl,
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
              },
            ]}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          left: TAB_BAR_SIDE_MARGIN,
          right: TAB_BAR_SIDE_MARGIN,
          bottom: tabBarBottom,
          height: TAB_BAR_HEIGHT,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: 'rgba(255, 255, 255, 0.9)',
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.72)',
          borderRadius: radius.xl,
          // Transparent so the BlurView shows through (see tabBarBackground).
          backgroundColor: 'transparent',
          ...(Platform.OS === 'android'
            ? { elevation: 12 }
            : {
                shadowColor: '#1A1A1A',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.14,
                shadowRadius: 16,
              }),
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
          tabBarLabel: (props) => <TabLabel {...props} label="Home" />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
          ),
          tabBarLabel: (props) => <TabLabel {...props} label="Practice" />,
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'library' : 'library-outline'} size={24} color={color} />
          ),
          tabBarLabel: (props) => <TabLabel {...props} label="Lessons" />,
        }}
      />
      <Tabs.Screen
        name="culture"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="drama-masks" size={26} color={color} />
          ),
          tabBarLabel: (props) => <TabLabel {...props} label="Culture" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
          tabBarLabel: (props) => <TabLabel {...props} label="Profile" />,
        }}
      />
    </Tabs>
  );
}
