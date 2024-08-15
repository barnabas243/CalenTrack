import React from 'react';
import {render} from '@testing-library/react-native';
import {ThemeProvider, DefaultTheme} from 'react-native-paper';
import DraggableItemPlaceholder from '../DraggableItemPlaceholder'; // Adjust the import path as needed
import {StyleSheet} from 'react-native';

describe('DraggableItemPlaceholder Component', () => {
  const mockTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      surfaceVariant: '#f0f0f0',
      primary: '#6200ee',
      shadow: '#000000',
    },
  };

  const wrapper = ({children}: any) => <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>;

  it('renders correctly', () => {
    const {toJSON} = render(<DraggableItemPlaceholder />, {wrapper});
    expect(toJSON()).toMatchSnapshot();
  });

  it('applies correct styles based on theme', () => {
    const {getByTestId} = render(<DraggableItemPlaceholder />, {wrapper});

    const view = getByTestId('draggable-item-placeholder');

    const style = StyleSheet.flatten(view.props.style);

    // Check background color
    expect(style.backgroundColor).toBe(mockTheme.colors.surfaceVariant);
    // Check border color
    expect(style.borderColor).toBe(mockTheme.colors.primary);
    // Check shadow color
    expect(style.shadowColor).toBe(mockTheme.colors.shadow);
    // Check other styles like shadowOpacity, shadowRadius, etc.
    expect(style.shadowOpacity).toBe(0.3);
    expect(style.shadowRadius).toBe(4);
  });
});
