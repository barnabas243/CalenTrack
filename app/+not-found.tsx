import React from 'react';
import {Link, Stack} from 'expo-router';
import {StyleSheet, View} from 'react-native';
import {ActivityIndicator, Text} from 'react-native-paper';
import {useAuth} from '@/hooks/useAuth';

export default function NotFoundScreen() {
  const {user, isLoading} = useAuth();

  if (isLoading) return <ActivityIndicator />;

  return (
    <>
      <Stack.Screen options={{title: 'Oops!'}} />
      <View style={styles.container}>
        <Text>This screen doesn't exist.</Text>
        <Link href={user ? '/(tabs)' : '/(auth)'} style={styles.link}>
          <Text>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
