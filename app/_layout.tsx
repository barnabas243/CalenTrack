import 'react-native-url-polyfill/auto';
import {Stack} from 'expo-router';
import 'react-native-reanimated';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {DefaultTheme, MD3DarkTheme, PaperProvider} from 'react-native-paper';
import React, {useEffect} from 'react';
import 'expo-dev-client';
import {Alert, Appearance, BackHandler} from 'react-native';
import {Provider} from 'react-redux';
import store from './store';

export default function RootLayout() {
  const colorScheme = Appearance.getColorScheme();
  const [theme, setTheme] = React.useState(colorScheme === 'dark' ? MD3DarkTheme : DefaultTheme);
  Appearance.addChangeListener(({colorScheme}) => {
    setTheme(colorScheme === 'dark' ? MD3DarkTheme : DefaultTheme);
  });

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to go back?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        {text: 'YES', onPress: () => BackHandler.exitApp()},
      ]);
      return true; // Indicate that we've handled the back press
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
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
      </PaperProvider>
    </Provider>
  );
}
