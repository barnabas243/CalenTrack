import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack} from 'expo-router';
import 'react-native-reanimated';

import {useColorScheme} from '@/hooks/useColorScheme';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider} from 'react-native-paper';
import React from 'react';

export default function RootLayout() {
  const ColorScheme = useColorScheme();

  return (
    <PaperProvider theme={{version: 3}}>
      <ThemeProvider value={ColorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SafeAreaProvider>
          <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </SafeAreaProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}
