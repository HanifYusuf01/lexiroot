import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { colors, fonts } from '../../src/constants/theme';

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutralVariant,
        tabBarStyle: {
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingTop: 6,
          paddingBottom: 14,
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
      <Tabs.Screen name="lessons" options={{ href: null }} />
    </Tabs>
  );
}
