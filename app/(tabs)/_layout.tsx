import { Tabs } from 'expo-router';
import { User } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: user ? {
          backgroundColor: isDark ? '#000000' : '#ffffff',
          borderTopColor: isDark ? '#1a1a1a' : '#e5e5e5',
          borderTopWidth: 1,
        } : { display: 'none' },
        tabBarActiveTintColor: '#1DA1F2',
        tabBarInactiveTintColor: isDark ? '#666666' : '#999999',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Login',
          href: null,
        }}
      />
      <Tabs.Screen
        name="main"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}