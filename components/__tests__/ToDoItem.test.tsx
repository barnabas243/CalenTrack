import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';

import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import {TodoItem, PriorityType} from '@/store/todo/types';
import ToDoItem, {ToDoItemProps} from '../ToDoItem';
import {SectionItem} from '@/store/section/types';

const mockColors: MD3Colors = {
  primary: '#000',
  background: '#fff',
  surface: '#fff',
  error: '#f00',
  onSurface: '#000',
  backdrop: '#000',
  primaryContainer: '',
  secondary: '',
  secondaryContainer: '',
  tertiary: '',
  tertiaryContainer: '',
  surfaceVariant: '',
  surfaceDisabled: '',
  errorContainer: '',
  onPrimary: '',
  onPrimaryContainer: '',
  onSecondary: '',
  onSecondaryContainer: '',
  onTertiary: '',
  onTertiaryContainer: '',
  onSurfaceVariant: '',
  onSurfaceDisabled: '',
  onError: '',
  onErrorContainer: '',
  onBackground: '',
  outline: '',
  outlineVariant: '',
  inverseSurface: '',
  inverseOnSurface: '',
  inversePrimary: '',
  shadow: '',
  scrim: '',
  elevation: '',
};

const mockTodoItem: TodoItem = {
  id: '1',
  title: 'Test Todo',
  summary: 'This is a test todo item',
  priority: '1' as PriorityType,
  completed: false,
  due_date: '2024-08-12',
  section_id: 1,
  created_by: '1',
  // Add other required fields if necessary
};

const mockSections: SectionItem[] = [
  {
    id: 1,
    name: 'Inbox',
    user_id: '',
    created_at: '',
  },
  {
    id: 2,
    name: 'Work',
    user_id: '',
    created_at: '',
  },
];

const defaultProps: ToDoItemProps = {
  item: mockTodoItem,
  getIndex: jest.fn(),
  drag: jest.fn(),
  isActive: false,
  colors: mockColors,
  enableSwipe: true,
  itemRefs: {current: new Map()},
  onToggleComplete: jest.fn(),
  openEditBottomSheet: jest.fn(),
  deleteTodo: jest.fn(),
  sections: mockSections,
};

describe('ToDoItem Component', () => {
  it('renders correctly with given props', () => {
    const {getByText} = render(<ToDoItem {...defaultProps} />);
    expect(getByText('Test Todo')).toBeTruthy();
    expect(getByText('This is a test todo item')).toBeTruthy();
  });

  it('calls onToggleComplete when checkbox is toggled', () => {
    const {getByRole} = render(<ToDoItem {...defaultProps} />);
    const checkbox = getByRole('checkbox');
    fireEvent(checkbox, 'valueChange');
    expect(defaultProps.onToggleComplete).toHaveBeenCalledWith('1');
  });

  it('opens edit modal when pressed', () => {
    const {getByText} = render(<ToDoItem {...defaultProps} />);
    fireEvent.press(getByText('Test Todo'));
    expect(defaultProps.openEditBottomSheet).toHaveBeenCalledWith(mockTodoItem);
  });

  it('calls drag function when long pressed', () => {
    const {getByText} = render(<ToDoItem {...defaultProps} />);
    fireEvent(getByText('Test Todo'), 'onLongPress');
    expect(defaultProps.drag).toHaveBeenCalled();
  });

  it('displays the correct section name', () => {
    const {getByText} = render(<ToDoItem {...defaultProps} />);
    expect(getByText('Inbox')).toBeTruthy();
  });

  it('calls deleteTodo when delete button is pressed', () => {
    const {getByText} = render(<ToDoItem {...defaultProps} />);
    fireEvent.press(getByText('delete'));
    expect(defaultProps.deleteTodo).toHaveBeenCalledWith('1');
  });
});
