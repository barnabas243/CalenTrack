import '@azure/core-asynciterator-polyfill';
import 'react-native-url-polyfill/auto';

import {Stack} from 'expo-router';
import 'react-native-reanimated';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {DefaultTheme, MD3DarkTheme, PaperProvider} from 'react-native-paper';
import 'expo-dev-client';
import {Appearance, AppState, AppStateStatus, ColorSchemeName} from 'react-native';
import {Provider} from 'react-redux';
import store from './store';
import {AuthProvider} from '@/contexts/UserContext'; // Adjust path as needed
import {AutocompleteDropdownContextProvider} from 'react-native-autocomplete-dropdown';
import {PowerSyncProvider} from '@/powersync/PowerSyncProvider';

import React, {useEffect, useState} from 'react';
import {useSystem} from '@/powersync/system';
import {getSetting, SETTINGS} from '@/utils/settingUtils';
import {NotificationProvider} from '@/contexts/NotificationContext';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  yellowLightTheme,
  yellowDarkTheme,
  blueLightTheme,
  blueDarkTheme,
  greenLightTheme,
  greenDarkTheme,
  brownLightTheme,
  brownDarkTheme,
  pinkDarkTheme,
  pinkLightTheme,
} from '@/constants/theme'; // Adjust path as needed
import useAsyncStorageSubscription from '@/hooks/useAsyncStorageSubscription';

const getTheme = (theme: string, colorScheme: ColorSchemeName) => {
  switch (theme) {
    case 'yellow':
      return colorScheme === 'dark' ? yellowDarkTheme : yellowLightTheme;
    case 'blue':
      return colorScheme === 'dark' ? blueDarkTheme : blueLightTheme;
    case 'green':
      return colorScheme === 'dark' ? greenDarkTheme : greenLightTheme;
    case 'brown':
      return colorScheme === 'dark' ? brownDarkTheme : brownLightTheme;
    case 'pink':
      return colorScheme === 'dark' ? pinkDarkTheme : pinkLightTheme;
    default:
      return colorScheme === 'dark' ? MD3DarkTheme : DefaultTheme;
  }
};

export default function RootLayout() {
  const colorScheme = Appearance.getColorScheme();
  const savedTheme = useAsyncStorageSubscription(SETTINGS.THEME) || 'yellow';
  const [theme, setTheme] = useState(() => getTheme(savedTheme, colorScheme));

  const {supabaseConnector} = useSystem();

  useEffect(() => {
    // AppState listener setup
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        supabaseConnector.client.auth.startAutoRefresh();
      } else {
        supabaseConnector.client.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Clean up listener on component unmount
    return () => {
      subscription.remove();
    };
  }, [supabaseConnector.client.auth]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        //fetch theme setting
        const savedColorScheme = await getSetting(SETTINGS.COLOR_SCHEME);
        if (savedColorScheme) {
          Appearance.setColorScheme(
            savedColorScheme === 'system' ? null : (savedColorScheme as ColorSchemeName),
          );
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    const handleAppearanceChange = ({colorScheme}: {colorScheme: ColorSchemeName}) => {
      console.log('Appearance changed:', colorScheme);
      setTheme(() => getTheme(savedTheme, colorScheme));
    };

    const subscription = Appearance.addChangeListener(handleAppearanceChange);

    setTheme(() => getTheme(savedTheme, colorScheme));

    return () => subscription.remove();
  }, [colorScheme, savedTheme]);

  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <AuthProvider>
            <PowerSyncProvider>
              <NotificationProvider>
                <GestureHandlerRootView>
                  <AutocompleteDropdownContextProvider>
                    <Stack screenOptions={{headerShown: false, animation: 'fade_from_bottom'}} />
                  </AutocompleteDropdownContextProvider>
                </GestureHandlerRootView>
              </NotificationProvider>
            </PowerSyncProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </Provider>
  );
}
