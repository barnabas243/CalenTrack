import {debounce} from 'lodash';
import React, {useRef, useState} from 'react';
import {Dimensions, StyleSheet, View, ViewStyle} from 'react-native';
import {Snackbar, useTheme, Text} from 'react-native-paper';
import {clamp} from 'react-native-reanimated';

const {width} = Dimensions.get('window');
interface AlertSnackbarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
  position?: 'top' | 'bottom';
}

const AlertSnackbar = ({
  visible,
  message,
  onDismiss,
  duration = 2000, // default duration for snackbar
  actionText,
  onAction,
  position = 'bottom', // default position is bottom
}: AlertSnackbarProps) => {
  const {colors} = useTheme();
  const [textWidth, setTextWidth] = useState(0);

  const MAX_WIDTH = width - 20; // Maximum width for the Snackbar
  const MIN_WIDTH = width / 1.5; // Minimum width for the Snackbar

  const getPositionStyle = (): ViewStyle => {
    switch (position) {
      case 'top':
        return {top: 20};
      case 'bottom':
      default:
        return {bottom: 20};
    }
  };

  // Create a debounced function
  const debouncedSetTextWidth = useRef(
    debounce((width: number) => setTextWidth(width), 100),
  ).current;

  // Handle text layout to accumulate width of all lines
  const handleTextLayout = (event: any) => {
    const {lines} = event.nativeEvent;
    let totalWidth = 0;

    // Sum the width of all lines
    if (lines.length > 0) {
      totalWidth = lines.reduce((sum: number, line: {width: number}) => sum + line.width, 0);
    }

    debouncedSetTextWidth(totalWidth);
  };

  const snackbarWidth = clamp(textWidth, MIN_WIDTH, MAX_WIDTH);

  return (
    <>
      <Snackbar
        testID="alert-snackbar"
        visible={visible}
        onDismiss={onDismiss}
        duration={duration}
        style={[
          styles.snackbar,
          getPositionStyle(),
          {backgroundColor: colors.inverseOnSurface, width: snackbarWidth},
        ]}
        action={
          actionText && onAction
            ? {
                label: actionText,
                onPress: onAction,
                textColor: colors.onBackground,
              }
            : undefined
        }>
        <Text
          testID="snackbar-message"
          variant="bodyMedium"
          style={{textAlign: 'center'}}
          onTextLayout={handleTextLayout}>
          {message}
        </Text>
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  snackbar: {
    borderRadius: 30,
    position: 'absolute',
    alignSelf: 'center', // Centers the snackbar horizontally
  },
});

export default AlertSnackbar;
