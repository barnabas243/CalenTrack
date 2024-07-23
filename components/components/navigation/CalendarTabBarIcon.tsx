import React from 'react';
import {View} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {type IconProps} from '@expo/vector-icons/build/createIconSet';
import {type ComponentProps} from 'react';
import {Colors} from '@/constants/Colors';
import {useColorScheme} from '@/hooks/useColorScheme';
import {ThemedText} from '../ThemedText';

export function CalendarTabBarIcon({
  style,
  ...rest
}: IconProps<ComponentProps<typeof Ionicons>['name']>) {
  const colorScheme = useColorScheme();

  // Get the current date
  const currentDate = new Date();
  // Get the day of the month
  const currentDay = currentDate.getDate();

  const fontColor =
    rest.name === 'calendar-clear'
      ? colorScheme === 'dark'
        ? 'black'
        : 'white'
      : Colors[colorScheme === 'dark' ? 'dark' : 'light'].icon;
  return (
    <View style={{alignItems: 'center', justifyContent: 'center'}}>
      <Ionicons size={28} style={[{marginBottom: -3}, style]} {...rest} />
      <ThemedText
        style={[
          {
            fontSize: 12,
            position: 'absolute',
            fontWeight: 'bold',
            color: fontColor,
            top: 4,
          },
        ]}>
        {currentDay}
      </ThemedText>
    </View>
  );
}
