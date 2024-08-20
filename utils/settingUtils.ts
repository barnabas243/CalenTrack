import AsyncStorage from '@react-native-async-storage/async-storage';
import tinycolor from 'tinycolor2';

// Define types
export type SortByType = 'date' | 'title' | 'section' | 'priority';
export type SortDirectionType = 'asc' | 'desc';

export interface SortType {
  sortBy: SortByType;
  direction: SortDirectionType;
}

export type Theme = 'system' | 'dark' | 'light';

// Key for storing all settings
const SETTINGS_KEY = '@app_settings';

/**
 * Get all stored settings from AsyncStorage.
 * @returns A promise that resolves to the stored settings object, or an empty object if no settings are found.
 */
const getStoredSettings = async (): Promise<Record<string, any>> => {
  try {
    const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
    return storedSettings ? JSON.parse(storedSettings) : {};
  } catch (error) {
    console.error('Error retrieving settings:', error);
    return {};
  }
};

/**
 * Save a setting to AsyncStorage.
 * @param settingName the name of the setting to save
 * @param value the value of the setting to save
 */
export const saveSetting = async <T>(settingName: string, value: T): Promise<void> => {
  try {
    const settings = await getStoredSettings();
    settings[settingName] = value;
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error(`Error saving ${settingName} setting:`, error);
  }
};

/**
 * Retrieve a specific setting from AsyncStorage.
 * @param settingName the name of the setting to retrieve
 * @returns A promise that resolves to the value of the setting, or null if the setting is not found.
 */
export const getSetting = async <T>(settingName: string): Promise<T | null> => {
  try {
    const settings = await getStoredSettings();
    return settings[settingName] || null;
  } catch (error) {
    console.error(`Error retrieving ${settingName} setting:`, error);
    return null;
  }
};

/**
 * Keys for all settings.
 */
export const SETTINGS = {
  THEME: 'theme',
  SORT_BY: 'sortBy',
  SORT_DIRECTION: 'sortDirection',
  HIDE_COMPLETED: 'hideCompleted',
};

/**
 * The key for storing section colors.
 */
const SECTION_COLORS_KEY = 'sectionColors';

/**
 * Variable to cache section colors.
 */
let sectionColors: {[section_id: string]: string} = {};

/**
 * Store section colors in AsyncStorage.
 * @param colors - An object mapping section IDs to colors.
 * @returns A promise that resolves when the colors are stored.
 */
export const storeSectionColors = async (colors: {[section_id: string]: string}) => {
  try {
    await AsyncStorage.setItem(SECTION_COLORS_KEY, JSON.stringify(colors));
  } catch (error) {
    console.error('Error storing section colors:', error);
  }
};

/**
 * Retrieve stored section colors from AsyncStorage.
 * @returns An object mapping section IDs to colors.
 */
export const getStoredSectionColors = async (): Promise<{[section_id: string]: string}> => {
  try {
    const storedColors = await AsyncStorage.getItem(SECTION_COLORS_KEY);

    console.log('storedColors');
    console.log(storedColors);
    return storedColors ? JSON.parse(storedColors) : {};
  } catch (error) {
    console.error('Error retrieving section colors:', error);
    return {};
  }
};

/**
 * Loads section colors from AsyncStorage into the cache.
 * @returns A promise that resolves when the colors are loaded.
 */
export const loadSectionColors = async () => {
  console.log('loadSectionColors');
  sectionColors = await getStoredSectionColors();
};

/**
 * Generates a random color in hex format.
 * @returns A hex color string.
 */
const generateRandomColor = (): string => {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
};

/**
 * Adjusts the color brightness based on the theme.
 * @param color - The base color in hex format.
 * @param isDarkTheme - Boolean indicating if the dark theme is active.
 * @returns The adjusted color in hex format.
 */
const adjustColorBrightness = (color: string, isDarkTheme: boolean): string => {
  const tinyColorInstance = tinycolor(color);
  console.log('isDarkTheme: ', isDarkTheme);
  if (isDarkTheme) {
    return tinyColorInstance.brighten(30).toString(); // Brighten for dark theme
  } else {
    return tinyColorInstance.darken(20).toString(); // Darken for light theme
  }
};

/**
 * Gets or generates a color for a given section ID and adjusts it based on the theme.
 * @param section_id - The ID of the section.
 * @param isDarkTheme - Boolean indicating if the dark theme is active.
 * @returns The color in hex format.
 */
export const getColorForSection = async (
  section_id: string,
  isDarkTheme: boolean,
): Promise<string> => {
  // Check if color is already cached
  if (sectionColors[section_id]) {
    return sectionColors[section_id];
  }

  // Generate a new color
  let color = generateRandomColor();

  // Adjust color brightness based on theme
  color = adjustColorBrightness(color, isDarkTheme);

  // Cache the color for future use
  sectionColors[section_id] = color;

  // Store the updated colors in AsyncStorage
  await storeSectionColors(sectionColors);

  return color;
};
