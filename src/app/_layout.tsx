import '../global.css';

import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#000000' : '#ffffff',
        },
        headerTintColor: isDark ? '#ffffff' : '#000000',
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="movie/[id]" options={{ title: '' }} />
      <Stack.Screen name="person/[id]" options={{ title: '' }} />
      <Stack.Screen name="genre/[id]" options={{ title: '' }} />
    </Stack>
  );
}
