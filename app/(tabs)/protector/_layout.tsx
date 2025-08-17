import { Stack } from 'expo-router';

export default function ProtectorLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: '돋보길 - 보호인',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}
