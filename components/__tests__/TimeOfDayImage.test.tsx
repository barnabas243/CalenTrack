import React from 'react';
import {render} from '@testing-library/react-native';
import TimeOfDayImage from '../TimeOfDayImage';
import dayjs from 'dayjs';

// Mock the useTheme hook to return a fixed set of colors
jest.mock('react-native-paper', () => {
  const actual = jest.requireActual('react-native-paper');
  return {
    ...actual,
    useTheme: () => ({
      colors: {
        secondary: 'blue',
        onSurface: 'black',
        onSurfaceVariant: 'gray',
      },
    }),
  };
});

// Mock the expo-image module
jest.mock('expo-image', () => {
  return {
    Image: 'Image',
  };
});

describe('TimeOfDayImage', () => {
  it('renders morning message and image correctly', () => {
    // Mock the current time to be between 6:00 AM and 12:00 PM
    jest.spyOn(dayjs.prototype, 'isBefore').mockReturnValue(true);
    jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(true);

    const {getByText} = render(<TimeOfDayImage />);

    expect(getByText('Good Morning!')).toBeTruthy();
    expect(getByText('Start your day with energy and enthusiasm.')).toBeTruthy();
  });

  it('renders afternoon message and image correctly', () => {
    // Mock the current time to be between 12:00 PM and 6:00 PM
    jest.spyOn(dayjs.prototype, 'isBefore').mockReturnValue(true);
    jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(false);

    const {getByText} = render(<TimeOfDayImage />);

    expect(getByText('Good Afternoon!')).toBeTruthy();
    expect(getByText('Keep up the great work and stay focused.')).toBeTruthy();
  });

  it('renders evening message and image correctly', () => {
    // Mock the current time to be after 6:00 PM
    jest.spyOn(dayjs.prototype, 'isBefore').mockReturnValue(false);
    jest.spyOn(dayjs.prototype, 'isAfter').mockReturnValue(false);

    const {getByText} = render(<TimeOfDayImage />);

    expect(getByText('Good Evening!')).toBeTruthy();
    expect(getByText('Wind down and prepare for a restful night.')).toBeTruthy();
  });
});
