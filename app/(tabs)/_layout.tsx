// app/(tabs)/_layout.tsx

import React, {useEffect, useState} from 'react';
import {AuthProvider} from '@/contexts/UserContext';
import {useTheme} from 'react-native-paper';
import {MaterialBottomTabs} from '@/layouts/material-bottom-tabs';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import dayjs from 'dayjs';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

export default function Layout() {
  const {colors} = useTheme();
  const [currentTime, setCurrentTime] = useState(dayjs());

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
    <AuthProvider>
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
            name="settings"
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
    </AuthProvider>
  );
}
