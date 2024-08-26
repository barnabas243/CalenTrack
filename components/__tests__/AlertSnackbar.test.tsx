import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import AlertSnackbar from '../AlertSnackbar';
import {SafeAreaProvider} from 'react-native-safe-area-context';

jest.mock('react-native-safe-area-context', () => {
  const inset = {top: 0, right: 0, bottom: 0, left: 0};
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({children}) => children),
    SafeAreaConsumer: jest.fn().mockImplementation(({children}) => children(inset)),
    SafeAreaView: jest.fn().mockImplementation(({children}) => children),
    useSafeAreaInsets: jest.fn().mockImplementation(() => inset),
  };
});

// Mock the useTheme hook to return a fixed set of colors
jest.mock('react-native-paper', () => {
  const actual = jest.requireActual('react-native-paper');
  return {
    ...actual,
    useTheme: () => ({
      colors: {
        inverseOnSurface: 'white',
        onBackground: 'black',
      },
    }),
  };
});

describe('AlertSnackbar', () => {
  it('renders correctly when visible', async () => {
    const {findByText} = render(
      <SafeAreaProvider>
        <AlertSnackbar visible={true} message="Test message" onDismiss={() => {}} />
      </SafeAreaProvider>,
    );

    const message = await findByText('Test message');
    expect(message).toBeTruthy();
  });

  it('does not render when not visible', async () => {
    const {queryByText} = render(
      <SafeAreaProvider>
        <AlertSnackbar visible={false} message="Test message" onDismiss={() => {}} />
      </SafeAreaProvider>,
    );

    expect(queryByText('Test message')).toBeNull();
  });

  it('calls onDismiss when dismissed', async () => {
    const onDismissMock = jest.fn();
    const {findByTestId} = render(
      <SafeAreaProvider>
        <AlertSnackbar visible={true} message="Test message" onDismiss={onDismissMock} />
      </SafeAreaProvider>,
    );

    const message = await findByTestId('snackbar-message');

    act(() => {
      fireEvent(message, 'onDismiss');
    });

    expect(onDismissMock).toHaveBeenCalled();
  });

  it('renders action text and calls onAction when pressed', () => {
    const onActionMock = jest.fn();
    const {getByText} = render(
      <SafeAreaProvider>
        <AlertSnackbar
          visible={true}
          message="Test message"
          onDismiss={() => {}}
          actionText="Action"
          onAction={onActionMock}
        />
      </SafeAreaProvider>,
    );

    fireEvent.press(getByText('Action'));
    expect(onActionMock).toHaveBeenCalled();
  });
});
