// app/(tabs)/_layout.tsx

import React, {useEffect, useState} from 'react';
import {useTheme} from 'react-native-paper';
import {MaterialBottomTabs} from '@/layouts/material-bottom-tabs';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import {BackHandler} from 'react-native';
import {router} from 'expo-router';

dayjs.extend(advancedFormat);

export default function TabsIndexScreen() {
  const {colors} = useTheme();
  const [currentTime, setCurrentTime] = useState(dayjs());

  const handleBackButton = () => {
    console.log('Back action');
    if (router.canGoBack()) {
      console.log('Can go back');

      router.back();
    } else {
      console.log('Cannot go back');
      // Handle the case where there is no screen to go back to
      BackHandler.exitApp();
    }
    return true;
  };

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
    <MaterialBottomTabs
      safeAreaInsets={{bottom: 0}}
      activeColor={colors.primary}
      barStyle={{backgroundColor: colors.background}}
      activeIndicatorStyle={{backgroundColor: colors.primaryContainer}}
      screenListeners={{
        focus: () => BackHandler.addEventListener('hardwareBackPress', handleBackButton),
        blur: () => BackHandler.removeEventListener('hardwareBackPress', handleBackButton),
      }}
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
  );
}
