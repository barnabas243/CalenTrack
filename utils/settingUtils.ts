import AsyncStorage from '@react-native-async-storage/async-storage';
import tinycolor from 'tinycolor2';

/**
 * Type for sorting criteria.
 *
 * This type defines the possible criteria for sorting items. Each value represents a different
 * attribute by which items can be ordered.
 *
 * @typedef {'date' | 'title' | 'section' | 'priority'} SortByType
 */
export type SortByType = 'date' | 'title' | 'section' | 'priority';

/**
 * Type for sorting direction.
 *
 * This type defines the possible directions for sorting items. The direction determines whether
 * items are sorted in ascending or descending order.
 */
export type SortDirectionType = 'asc' | 'desc';

/**
 * Interface for sorting settings.
 *
 * This interface represents the structure of the sorting settings used to determine how items
 * are sorted within the application. It includes the criterion for sorting and the direction
 * of the sort.
 *
 * @interface SortType
 * @property {SortByType} sortBy - The criterion by which items are sorted (e.g., by date, title).
 * @property {SortDirectionType} direction - The direction of sorting (e.g., ascending, descending).
 */
export interface SortType {
  sortBy: SortByType;
  direction: SortDirectionType;
}

export type ColorScheme = 'system' | 'dark' | 'light';
export type Theme = 'default' | 'yellow' | 'blue' | 'green' | 'brown';

// Key for storing all settings
const SETTINGS_KEY = '@app_settings';

/**
 * Get all stored settings from AsyncStorage.
 * @returns {Promise<Record<string, any>>} A promise that resolves to the stored settings object,
 * or an empty object if no settings are found.
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
 * @param {string} settingName - The name of the setting to save.
 * @param {T} value - The value of the setting to save.
 * @returns {Promise<void>} A promise that resolves when the setting is saved.
 * @template T
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
 * @param {string} settingName - The name of the setting to retrieve.
 * @returns {Promise<T | null>} A promise that resolves to the value of the setting, or null if the setting is not found.
 * @template T
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
 * Keys for various application settings.
 *
 * This object contains string constants that represent the keys used for storing and retrieving
 * user settings within the application. Each key corresponds to a specific setting that can be
 * customized by the user.
 *
 * @property {string} THEME - Key for the application's theme setting (e.g., light, dark).
 * @property {string} SORT_BY - Key for the sorting criterion of items (e.g., by date, by priority).
 * @property {string} SORT_DIRECTION - Key for the direction of sorting (e.g., ascending, descending).
 * @property {string} HIDE_COMPLETED - Key for toggling the visibility of completed items.
 */
export const SETTINGS = {
  THEME: 'theme',
  SORT_BY: 'sortBy',
  SORT_DIRECTION: 'sortDirection',
  HIDE_COMPLETED: 'hideCompleted',
  COLOR_SCHEME: 'colorScheme',
};

/**
 * The key for storing section colors in AsyncStorage.
 *
 * @constant {string}
 */
const SECTION_COLORS_KEY = 'sectionColors';

/**
 * Variable to cache section colors.
 *
 * This cache helps in avoiding repeated calls to AsyncStorage for section colors.
 *
 * @type {{[section_id: string]: string}}
 */
let sectionColors: {[section_id: string]: string} = {};

/**
 * Store section colors in AsyncStorage.
 * @param {Object} colors - An object mapping section IDs to colors.
 * @param {string} colors[section_id] - The color associated with the section ID.
 * @returns {Promise<void>} A promise that resolves when the colors are stored.
 */
export const storeSectionColors = async (colors: {[section_id: string]: string}): Promise<void> => {
  try {
    await AsyncStorage.setItem(SECTION_COLORS_KEY, JSON.stringify(colors));
  } catch (error) {
    console.error('Error storing section colors:', error);
  }
};

/**
 * Retrieve stored section colors from AsyncStorage.
 * @returns {Promise<{[section_id: string]: string}>} A promise that resolves to an object mapping section IDs to colors.
 */
export const getStoredSectionColors = async (): Promise<{[section_id: string]: string}> => {
  try {
    const storedColors = await AsyncStorage.getItem(SECTION_COLORS_KEY);
    return storedColors ? JSON.parse(storedColors) : {};
  } catch (error) {
    console.error('Error retrieving section colors:', error);
    return {};
  }
};

/**
 * Loads section colors from AsyncStorage into the cache.
 * @returns {Promise<void>} A promise that resolves when the colors are loaded into the cache.
 */
export const loadSectionColors = async (): Promise<void> => {
  sectionColors = await getStoredSectionColors();
};

/**
 * Generates a random color in hex format.
 * @returns {string} A hex color string.
 */
const generateRandomColor = (): string => {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
};

/**
 * Adjusts the color brightness based on the theme.
 * @param {string} color - The base color in hex format.
 * @param {boolean} isDarkTheme - Boolean indicating if the dark theme is active.
 * @returns {string} The adjusted color in hex format.
 */
const adjustColorBrightness = (color: string, isDarkTheme: boolean): string => {
  const tinyColorInstance = tinycolor(color);
  return isDarkTheme
    ? tinyColorInstance.brighten(30).toString() // Brighten for dark theme
    : tinyColorInstance.darken(20).toString(); // Darken for light theme
};

/**
 * Gets or generates a color for a given section ID and adjusts it based on the theme.
 * @param {string} section_id - The ID of the section.
 * @param {boolean} isDarkTheme - Boolean indicating if the dark theme is active.
 * @returns {Promise<string>} A promise that resolves to the color in hex format.
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
