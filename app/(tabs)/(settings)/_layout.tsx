import {Stack} from 'expo-router';
import React from 'react';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{headerShown: false}}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
      <Stack.Screen name="change_password" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
