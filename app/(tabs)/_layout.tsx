// app/(tabs)/_layout.tsx

import React, {useEffect, useRef, useState} from 'react';
import {useTheme} from 'react-native-paper';
import {MaterialBottomTabs} from '@/layouts/material-bottom-tabs';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import dayjs from 'dayjs';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import advancedFormat from 'dayjs/plugin/advancedFormat';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {Platform} from 'react-native';
import {useAuth} from '@/hooks/useAuth';
import {useSystem} from '@/powersync/system';

dayjs.extend(advancedFormat);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const {status: existingStatus} = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const {status} = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
  }
}

export default function Layout() {
  const {colors} = useTheme();
  const [currentTime, setCurrentTime] = useState(dayjs());

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined,
  );
  const {user} = useAuth();

  const {supabaseConnector} = useSystem();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!user) return;
    supabaseConnector
      .fetchProfile(user.id)
      .then(profile => {
        if (!profile.expoPushToken) {
          registerForPushNotificationsAsync()
            .then(async token => {
              setExpoPushToken(token ?? '');

              await supabaseConnector.updateProfile({id: user.id, expoPushToken: token});
              console.log(token);
            })
            .catch((error: any) => console.error(error));
        } else {
          console.log('Expo push token already exists:', profile.expoPushToken);
          setExpoPushToken(profile.expoPushToken);
        }
      })
      .catch(error => {
        console.error(error);
      });
  }, [supabaseConnector, user]);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });
    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Update current time every hour
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 3600000); // Update every 1 hour (3600000 milliseconds)
    return () => clearInterval(interval);
  }, []);

  // Function to convert hour number to text representation
  const hourToText = (hour: number) => {
    const hoursText = [
      'twelve',
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
      'ten',
      'eleven',
    ];
    return hoursText[hour % 12]; // Ensure hour cycles from 1 to 12
  };

  // Determine which clock icon to display based on the current hour
  const currentHourText = hourToText(currentTime.hour());
  const clockIcon = `clock-time-${currentHourText}` as 'clock'; // Example icons: clock-time-one, clock-time-two, ..., clock-time-twelve
  return (
    <GestureHandlerRootView>
      <MaterialBottomTabs
        safeAreaInsets={{bottom: 0}}
        activeColor={colors.primary}
        barStyle={{backgroundColor: colors.background}}
        activeIndicatorStyle={{backgroundColor: colors.primaryContainer}}
        initialRouteName="index">
        <MaterialBottomTabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarLabel: `Today (${currentTime.format('Do')})`, // Include current day in label. Example: Today (23rd)
            tabBarIcon: ({color, focused}) => (
              <MaterialCommunityIcons
                color={color}
                size={24}
                name={focused ? clockIcon : `${clockIcon}-outline`}
              />
            ),
          }}
        />
        <MaterialBottomTabs.Screen
          name="inbox"
          options={{
            tabBarLabel: 'Inbox',
            tabBarIcon: ({color, focused}) => (
              <MaterialCommunityIcons
                color={color}
                size={24}
                name={focused ? 'inbox' : 'inbox-outline'}
              />
            ),
          }}
        />
        <MaterialBottomTabs.Screen
          name="calendar"
          options={{
            tabBarLabel: 'calendar',
            tabBarIcon: ({color, focused}) => (
              <MaterialCommunityIcons
                color={color}
                size={24}
                name={focused ? 'calendar-clock' : 'calendar-clock-outline'}
              />
            ),
          }}
        />
        <MaterialBottomTabs.Screen
          name="(settings)"
          options={{
            tabBarLabel: 'settings',
            tabBarIcon: ({color, focused}) => (
              <MaterialCommunityIcons
                color={color}
                size={24}
                name={focused ? 'cog' : 'cog-outline'}
              />
            ),
          }}
        />
      </MaterialBottomTabs>
    </GestureHandlerRootView>
  );
}
