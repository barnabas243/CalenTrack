import React from 'react';
import {Dimensions, StyleSheet} from 'react-native';
import {Image} from 'expo-image';
import dayjs from 'dayjs';
import {useTheme, Text} from 'react-native-paper';

const {width, height} = Dimensions.get('window'); // Get screen dimensions

const TimeOfDayImage = () => {
  // Define the times for start, middle, and end of the day
  const {colors} = useTheme();
  const startOfDayTime = dayjs().set('hour', 6).set('minute', 0); // 6:00 AM
  const middleOfDayTime = dayjs().set('hour', 12).set('minute', 0); // 12:00 PM
  const endOfDayTime = dayjs().set('hour', 18).set('minute', 0); // 6:00 PM

  // Get current time
  const now = dayjs();

  // Determine which time period we're in and set image and text accordingly
  let imageSource;
  let mainText;
  let subText;

  if (now.isBefore(middleOfDayTime) && now.isAfter(startOfDayTime)) {
    imageSource = require('@/assets/images/lights-sunlight-svgrepo-com.svg');
    mainText = 'Good Morning!';
    subText = 'Start your day with energy and enthusiasm.';
  } else if (now.isBefore(endOfDayTime)) {
    imageSource = require('@/assets/images/afternoon-sunlight-svgrepo-com.svg');
    mainText = 'Good Afternoon!';
    subText = 'Keep up the great work and stay focused.';
  } else {
    imageSource = require('@/assets/images/night-svgrepo-com.svg');
    mainText = 'Good Evening!';
    subText = 'Wind down and prepare for a restful night.';
  }

  return (
    <>
      <Image
        style={styles.image}
        source={imageSource}
        // placeholder={{blurhash}}
        contentFit="cover"
        tintColor={colors.secondary}
      />
      <Text variant="titleLarge" style={{color: colors.onSurface}}>
        {mainText}
      </Text>
      <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>
        {subText}
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width * 0.6,
    height: height * 0.3,
    marginBottom: 20,
  },
});

export default TimeOfDayImage;
