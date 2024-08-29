import {DefaultTheme, MD3DarkTheme} from 'react-native-paper';
import yellow from '@/constants/material-theme-yellow.json';
import blue from '@/constants/material-theme-blue.json';
import green from '@/constants/material-theme-green.json';
import brown from '@/constants/material-theme-brown.json';
import pink from '@/constants/material-theme-pink.json';

export const yellowLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...yellow.schemes.light,
  },
};

export const yellowDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...yellow.schemes.dark,
  },
};

export const blueLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...blue.schemes.light,
  },
};

export const blueDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...blue.schemes.dark,
  },
};

export const greenLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...green.schemes.light,
  },
};

export const greenDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...green.schemes.dark,
  },
};

export const brownLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...brown.schemes.light,
  },
};

export const brownDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...brown.schemes.dark,
  },
};

export const pinkLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...pink.schemes.light,
  },
};

export const pinkDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...pink.schemes.dark,
  },
};
