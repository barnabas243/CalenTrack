import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import AddTodoFAB from '@/components/addTodoFAB'; // Adjust the import path as needed

describe('AddTodoFAB Component', () => {
  it('renders the FAB correctly', async () => {
    // Render the component
    const {getByTestId} = render(<AddTodoFAB onPress={() => {}} />);

    // Perform any interactions inside act() if necessary
    await act(async () => {
      // If the FAB triggers state updates, interact with it here
      const fabButton = getByTestId('fab-button');
      fireEvent.press(fabButton);
    });

    // Assertions should be made after act() has processed all updates
    await act(async () => {
      const fabButton = getByTestId('fab-button');
      expect(fabButton).toBeTruthy();
    });
  });

  it('calls onPress when the FAB is pressed', async () => {
    const onPressMock = jest.fn();
    const {getByTestId} = render(<AddTodoFAB onPress={onPressMock} />);

    await act(async () => {
      const fabButton = getByTestId('fab-button');
      fireEvent.press(fabButton);
    });

    // Verify after all updates have been processed
    await act(async () => {
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });
  });
});
