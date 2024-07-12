import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {useEffect, useState} from 'react';
import 'react-native-reanimated';
// import * as Notifications from 'expo-notifications';

import {useColorScheme} from '@/hooks/useColorScheme';
import {Session} from '@supabase/supabase-js';
import {supabase} from '@/utils/supabase';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// function useNotificationObserver() {
//   useEffect(() => {
//     let isMounted = true;

//     function redirect(notification: Notifications.Notification) {
//       const url = notification.request.content.data?.url;
//       if (url) {
//         router.push(url);
//       }
//     }

//     Notifications.getLastNotificationResponseAsync().then(response => {
//       if (!isMounted || !response?.notification) {
//         return;
//       }
//       redirect(response?.notification);
//     });

//     const subscription = Notifications.addNotificationResponseReceivedListener(response => {
//       redirect(response.notification);
//     });

//     return () => {
//       isMounted = false;
//       subscription.remove();
//     };
//   }, []);
// }

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);

  // useNotificationObserver();

  useEffect(() => {
    supabase.auth.getSession().then(({data: {session}}) => {
      setSession(session);

      SplashScreen.hideAsync();
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <Stack>
          {session ? (
            <Stack.Screen name="(tabs)" options={{headerShown: false}} />
          ) : (
            <Stack.Screen name="(auth)" options={{headerShown: false}} />
          )}
          <Stack.Screen name="+not-found" />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
