import { Stack } from 'expo-router';

export default function SeniorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="home"
        options={{
          title: '피보호인 홈',
        }}
      />
    </Stack>
  );
} 