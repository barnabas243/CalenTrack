import React from 'react';
import {render} from '@testing-library/react-native';
import {ThemeProvider, DefaultTheme} from 'react-native-paper';
import PageLoadingActivityIndicator from '../PageLoadingActivityIndicator'; // Adjust the import path as needed

describe('PageLoadingActivityIndicator Component', () => {
  const mockTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#ffffff',
      primary: '#6200ee',
    },
  };

  const wrapper = ({children}: any) => <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>;

  it('renders correctly', () => {
    const {toJSON} = render(<PageLoadingActivityIndicator />, {wrapper});
    expect(toJSON()).toMatchSnapshot();
  });

  it('applies correct styles based on theme', () => {
    const {getByTestId} = render(<PageLoadingActivityIndicator />, {wrapper});

    const container = getByTestId('activity-indicator-container');
    const activityIndicator = getByTestId('activity-indicator');

    const containerStyle = container.props.style[1];
    const activityIndicatorProps = activityIndicator.props;

    // Check container background color
    expect(containerStyle.backgroundColor).toBe(mockTheme.colors.background);
    // Check ActivityIndicator color
    expect(activityIndicatorProps.color).toBe(mockTheme.colors.primary);
  });

  it('renders an ActivityIndicator with large size', () => {
    const {getByTestId} = render(<PageLoadingActivityIndicator />, {wrapper});

    const activityIndicator = getByTestId('activity-indicator');
    const activityIndicatorProps = activityIndicator.props;

    // Check ActivityIndicator size
    expect(activityIndicatorProps.size).toBe('large');
  });
});
