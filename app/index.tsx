import {Stack} from 'expo-router';
import React from 'react';

export default function AppStack() {
  return (
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
  );
}
