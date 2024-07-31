import 'react-native-url-polyfill/auto';
import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack} from 'expo-router';
import 'react-native-reanimated';

import {useColorScheme} from '@/hooks/useColorScheme';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider} from 'react-native-paper';
import React from 'react';
import 'expo-dev-client';
export default function RootLayout() {
  const ColorScheme = useColorScheme();

  return (
    <PaperProvider theme={{version: 3}}>
      <ThemeProvider value={ColorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SafeAreaProvider>
          <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="(auth)" options={{title: 'Login'}} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="_prototype-feedback"
              options={{
                title: 'CalenTrack Prototype feedback',
                headerBackButtonMenuEnabled: true,
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="_feature-feedback"
              options={{
                title: 'CalenTrack Feedback',
                headerBackButtonMenuEnabled: true,
                headerShown: true,
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
        </SafeAreaProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}
