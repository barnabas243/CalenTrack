import {Stack} from 'expo-router';
import React from 'react';

export default function AppStack() {
  return (
    <Stack screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="_prototype-feedback" />
      <Stack.Screen name="_feature-feedback" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
