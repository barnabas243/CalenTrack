import {Stack} from 'expo-router';
import React from 'react';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        animationTypeForReplace: 'pop',
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
      <Stack.Screen name="change_password" />
      <Stack.Screen name="about" />
      <Stack.Screen name="activity_log" />
    </Stack>
  );
}
