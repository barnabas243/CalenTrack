import React from 'react';
import {View, Text} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {type IconProps} from '@expo/vector-icons/build/createIconSet';
import {type ComponentProps} from 'react';
import {Colors} from '@/constants/Colors';
import {useColorScheme} from '@/hooks/useColorScheme';

export function CalendarTabBarIcon({
  style,
  ...rest
}: IconProps<ComponentProps<typeof Ionicons>['name']>) {
  const colorScheme = useColorScheme();

  // Get the current date
  const currentDate = new Date();
  // Get the day of the month
  const currentDay = currentDate.getDate();

  const fontColor = rest.name === 'calendar-clear' ? 'white' : Colors[colorScheme ?? 'light'].tint;
  return (
    <View style={{alignItems: 'center', justifyContent: 'center'}}>
      <Ionicons size={28} style={[{marginBottom: -3}, style]} {...rest} />
      <Text
        style={[
          {
            fontSize: 12,
            position: 'absolute',
            fontWeight: 'bold',
            color: fontColor,
            bottom: 0,
          },
        ]}>
        {currentDay}
      </Text>
    </View>
  );
}
