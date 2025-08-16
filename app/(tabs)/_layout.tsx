import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useSession } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const { user } = useSession();
  const role = (user as any)?.role ?? 'guest';
  const colorScheme = useColorScheme();

  const tabsKey = `tabs-${role}`;

  console.log('TabLayout');
  return (
    <Tabs
      key={tabsKey}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '돋보길',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
