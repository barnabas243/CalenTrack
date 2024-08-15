// Import necessary components from React Native
import {View, StyleSheet} from 'react-native';
import React from 'react';
import {useTheme} from 'react-native-paper';

const DraggableItemPlaceholder = () => {
  const {colors} = useTheme();

  const colorsStyle = {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.primary, // Border color
    shadowColor: colors.shadow,
    wOffset: {width: 0, height: 2}, // Shadow offset
    shadowOpacity: 0.3, // Shadow opacity
    shadowRadius: 4, // Shadow radius
  };

  return <View testID="draggable-item-placeholder" style={[styles.container, colorsStyle]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 8, // Added vertical margin for better spacing
    padding: 16, // Padding to make it look like a card
    borderRadius: 8, // Rounded corners
    borderWidth: 1, // Border width
    elevation: 2, // Elevation for Android shadow
  },
});

export default DraggableItemPlaceholder;
