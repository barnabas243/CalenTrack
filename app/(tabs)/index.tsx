import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Text, useTheme, Divider, Appbar, Menu, Button} from 'react-native-paper';
import ToDoItem from '@/components/ToDoItem';
import {StatusBar} from 'expo-status-bar';
import {useTodo} from '@/hooks/useTodo';
import AddTodoFAB from '@/components/addTodoFAB';
import dayjs from 'dayjs';

import {MaterialCommunityIcons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import {
  NestableScrollContainer,
  NestableDraggableFlatList,
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import EditTodoModal from '@/components/modals/EditTodoModal';
import {BottomSheetDefaultBackdropProps} from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import {isEqual} from 'lodash';
import EditTodoModalContent from '@/components/modals/EditTodoModalContent';
import DraggableItemPlaceholder from '@/components/DraggableItemPlaceholder';
import AddTodoModal from '@/components/modals/addTodoModal';
import {useAuth} from '@/hooks/useAuth';
import PageLoadingActivityIndicator from '@/components/PageLoadingActivityIndicator';
import {action_type, ActivityLog, entity_type, Todo} from '@/powersync/AppSchema';
import TimeOfDayImage from '@/components/TimeOfDayImage';
import {
  getSetting,
  saveSetting,
  SETTINGS,
  SortByType,
  SortDirectionType,
} from '@/utils/settingUtils';
import AlertSnackbar from '@/components/AlertSnackbar';
import {useNotification} from '@/contexts/NotificationContext';
import {Host} from 'react-native-portalize';

export type sortByType = 'date' | 'title' | 'section' | 'priority';
export type sortDirectionType = 'asc' | 'desc';

export interface SortType {
  sortBy: sortByType;
  direction: sortDirectionType;
}

const filterTodos = (sortedTodos: Todo[], filterType: 'overdue' | 'today' | 'completed') => {
  const todayDate = dayjs();
  const yesterday = todayDate.subtract(1, 'day');

  switch (filterType) {
    case 'overdue':
      return sortedTodos.filter(
        todo =>
          dayjs(todo.due_date).isValid() &&
          todo.completed === 0 &&
          dayjs(todo.due_date).isBefore(yesterday, 'day'),
      );
    case 'today':
      return sortedTodos.filter(
        todo =>
          dayjs(todo.due_date).isValid() &&
          todo.completed === 0 &&
          dayjs(todo.due_date).isSame(todayDate, 'day'),
      );
    case 'completed':
      return sortedTodos.filter(todo => todo.completed === 1);
    default:
      return [];
  }
};

const sortTodos = (todos: Todo[], sortBy: sortByType, direction: sortDirectionType = 'asc') => {
  const sortedTodos = todos.slice(); // Make a copy of the array to avoid mutating the original

  switch (sortBy) {
    case 'date':
      sortedTodos.sort((a, b) => dayjs(a.due_date).diff(dayjs(b.due_date)));
      break;
    case 'title':
      sortedTodos.sort((a, b) => a.title!.localeCompare(b.title!));
      break;
    case 'section':
      sortedTodos.sort((a, b) => {
        const idA = a.section_id ?? '';
        const idB = b.section_id ?? '';

        if (idA < idB) return -1;
        if (idA > idB) return 1;
        return 0;
      });
      break;
    case 'priority':
      sortedTodos.sort((a, b) => (Number(a.priority) ?? 0) - (Number(b.priority) ?? 0));
      break;
    default:
      break;
  }

  if (direction === 'desc') {
    sortedTodos.reverse();
  }
  return sortedTodos;
};

const TodayScreen = () => {
  // Hooks and Context
  const {colors} = useTheme();

  const {user} = useAuth();
  const {
    todos,
    sections,
    deleteExistingTodos,
    updateExistingTodos,
    addNewSection,
    addNewTodo,
    createActivityLogs,
    toggleBatchCompleteTodo,
  } = useTodo();
  const {updateTodoWithNotification, scheduleTodoNotification} = useNotification();

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [overdueTodos, setOverdueTodos] = useState<Todo[]>([]);
  const [todayTodos, setTodayTodos] = useState<Todo[]>([]);
  const [completedTodos, setCompletedTodos] = useState<Todo[]>([]);

  const [isAlertSnackbarVisible, setIsAlertSnackbarVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [sortBy, setSortBy] = useState<sortByType>('date');
  const [sortDirection, setSortDirection] = useState<sortDirectionType>('asc');
  const [hideCompleted, setHideCompleted] = useState(false);

  const [parentId, setParentId] = useState('');

  const [isOverdueVisible, setIsOverdueVisible] = useState(true);
  const [isTodayVisible, setIsTodayVisible] = useState(true);
  const [isCompletedVisible, setIsCompletedVisible] = useState(true);
  const [isFABVisible, setIsFABVisible] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isAddTodoModalVisible, setIsAddTodoModalVisible] = useState(false);

  // Refs
  const itemRefs = React.useRef(new Map());
  const sortBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const editBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ['25%', '40%', '75%'], []);

  // Shared Values and Animated Styles
  const overdueHeight = useSharedValue(0);
  const todayHeight = useSharedValue(0);
  const completedHeight = useSharedValue(0);

  const animatedOverdueHeight = useSharedValue(0);
  const animatedTodayHeight = useSharedValue(0);
  const animatedCompletedHeight = useSharedValue(0);

  const animatedOverdueStyle = useAnimatedStyle(
    () => ({
      height: animatedOverdueHeight.value,
    }),
    [animatedOverdueHeight],
  );

  const animatedTodayStyle = useAnimatedStyle(
    () => ({
      height: animatedTodayHeight.value,
    }),
    [animatedTodayHeight],
  );

  const animatedCompletedStyle = useAnimatedStyle(
    () => ({
      height: animatedCompletedHeight.value,
    }),
    [animatedCompletedHeight],
  );

  // Callbacks
  const showAlertSnackbar = (message: string) => {
    setAlertMessage(message);
    setIsAlertSnackbarVisible(true);
  };

  const hideAlertSnackbar = () => {
    setAlertMessage('');
    setIsAlertSnackbarVisible(false);
  };

  const saveSortBy = useCallback(async (newSortBy: SortByType) => {
    setSortBy(newSortBy);
    try {
      await saveSetting(SETTINGS.SORT_BY, newSortBy);
    } catch (error) {
      console.error('Failed to save sort by setting:', error);
    }
  }, []);

  const saveSortDirection = useCallback(async (newSortDirection: SortDirectionType) => {
    setSortDirection(newSortDirection);
    try {
      await saveSetting(SETTINGS.SORT_DIRECTION, newSortDirection);
    } catch (error) {
      console.error('Failed to save sort direction setting:', error);
    }
  }, []);

  const saveHideCompleted = useCallback(async (value: boolean) => {
    setIsMenuVisible(false);
    setHideCompleted(value);
    try {
      await saveSetting(SETTINGS.HIDE_COMPLETED, value);
    } catch (error) {
      showAlertSnackbar('Failed to save hide completed setting');
      console.error('Failed to save hide completed setting:', error);
    }
  }, []);

  const changeHeight = useCallback(
    (height: number, type: string) => {
      switch (type) {
        case 'overdue':
          overdueHeight.value = height;
          break;
        case 'today':
          todayHeight.value = height;
          break;
        case 'completed':
          completedHeight.value = height;
          break;
      }
    },
    [overdueHeight, todayHeight, completedHeight],
  );

  const sortedTodos = useMemo(() => {
    return sortTodos(todos, sortBy, sortDirection);
  }, [sortBy, sortDirection, todos]);

  // Update state based on sortedTodos
  useEffect(() => {
    setOverdueTodos(filterTodos(sortedTodos, 'overdue'));
    setTodayTodos(filterTodos(sortedTodos, 'today'));
    setCompletedTodos(filterTodos(sortedTodos, 'completed'));

    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, [sortedTodos]);

  // Load settings when the component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Fetch individual settings for index page
        const savedSortBy = await getSetting<SortByType>(SETTINGS.SORT_BY);
        const savedSortDirection = await getSetting<SortDirectionType>(SETTINGS.SORT_DIRECTION);
        const savedHideCompleted = await getSetting<boolean>(SETTINGS.HIDE_COMPLETED);

        // Update state with saved settings or default values
        setSortBy(savedSortBy ?? 'date');
        setSortDirection(savedSortDirection ?? 'asc');

        setHideCompleted(prev => {
          if (prev === savedHideCompleted) {
            return prev; // Still a boolean, no state change
          }
          return savedHideCompleted ?? false; // Update state with the new boolean value
        });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();

    setIsLoading(false);
  }, []);

  const showAddTodoModal = () => setIsAddTodoModalVisible(true);
  const hideAddTodoModal = () => setIsAddTodoModalVisible(false);

  // useDerivedValue to animate the height
  useDerivedValue(() => {
    animatedOverdueHeight.value = withTiming(isOverdueVisible ? overdueHeight.value : 0, {
      duration: 300,
    });
  }, [isOverdueVisible]);

  useDerivedValue(() => {
    animatedTodayHeight.value = withTiming(isTodayVisible ? todayHeight.value : 0, {
      duration: 300,
    });
  }, [isTodayVisible]);

  useDerivedValue(() => {
    animatedCompletedHeight.value = withTiming(isCompletedVisible ? completedHeight.value : 0, {
      duration: 300,
    });
  }, [isCompletedVisible]);

  const backdropComponent = React.useCallback(
    (props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.5}
        enableTouchThrough={false}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        style={[{backgroundColor: 'rgba(0, 0, 0, 1)'}, StyleSheet.absoluteFillObject]}
      />
    ),
    [],
  );

  const handleEndDrag = (results: Todo[], name: string) => {
    switch (name) {
      case 'overdue':
        setOverdueTodos(results);
        break;
      case 'today':
        setTodayTodos(results);
        break;
      case 'completed':
        setCompletedTodos(results);
        break;
      default:
        break;
    }
  };

  const handleSectionHeaderPress = (title: string) => {
    switch (title) {
      case 'Overdue':
        return () => setIsOverdueVisible(!isOverdueVisible);
      case 'Today':
        return () => setIsTodayVisible(!isTodayVisible);
      case 'Completed':
        return () => setIsCompletedVisible(!isCompletedVisible);
      default:
        return () => {};
    }
  };

  const toggleCompleteTodo = async (id: string) => {
    // Find the current todo
    const todo = todos.find(todo => todo.id === id);

    if (!todo) {
      showAlertSnackbar('Todo not found');
      return;
    }

    // Recursive function to find all nested sub-items
    const findAllSubTodos = (parentId: string): Todo[] => {
      const directSubTodos = todos.filter(subTodo => subTodo.parent_id === parentId);
      return directSubTodos.flatMap(subTodo => [subTodo, ...findAllSubTodos(subTodo.id)]);
    };

    // Get all sub-items, including the current todo
    const allTodos = [todo, ...findAllSubTodos(id)];

    // Filter todos that match the completed value
    const filterTodosByCompletion = (todos: Todo[], completed: number): Todo[] =>
      todos.filter(todo => todo.completed === completed);

    // Filter todos by completion status
    const filteredTodos = filterTodosByCompletion(allTodos, todo.completed as number);

    // Extract unique IDs
    const allTodosIDs = Array.from(new Set(filteredTodos.map(todo => todo.id)));

    // Perform batch update
    const newTodos = await toggleBatchCompleteTodo(allTodosIDs, todo.completed === 0 ? 1 : 0);

    if (!newTodos) {
      showAlertSnackbar('Failed to update todos');
      return;
    }

    showAlertSnackbar('Todos updated successfully');
    console.log('Creating activity logs for todos...');

    // Create logs for each todo
    const logs = filteredTodos
      .map(todo => {
        const oldTodo = allTodos.find(t => t.id === todo.id);
        const newTodo = newTodos.find(t => t.id === todo.id);

        if (!oldTodo || !newTodo) {
          console.error(`Failed to find old or new todo for ID ${todo.id}`);
          return null;
        }

        return {
          id: '',
          action_type: 'UPDATED' as action_type,
          action_date: new Date().toISOString(),
          section_id: null,
          before_data: JSON.stringify(oldTodo),
          after_data: JSON.stringify(newTodo),
          entity_type: 'todo' as entity_type,
          todo_id: todo.id,
          user_id: user!.id,
        };
      })
      .filter(log => log !== null) as ActivityLog[];

    // Insert activity logs
    const insertedLogIds = await createActivityLogs(logs);

    if (!insertedLogIds) {
      showAlertSnackbar('Failed to insert activity logs');
    } else {
      showAlertSnackbar('Activity logs created successfully');
    }
  };

  const openEditBottomSheet = async (item: Todo) => {
    if (editBottomSheetRef.current) {
      // Close the bottom sheet
      await new Promise(resolve => {
        editBottomSheetRef.current?.close();
        // Resolve after a short delay to ensure it closes properly
        setTimeout(resolve, 300); // Adjust the delay if needed
      });

      // Get the sub-items of the todo
      const subItems = todos.filter(todo => todo.parent_id === item.id);
      const subItemsCount = subItems.length;

      // Prepare the new item to show
      const itemToPresent = subItemsCount > 0 ? {...item, subItems} : item;

      // Present the updated item

      setIsFABVisible(false);
      editBottomSheetRef.current.present(itemToPresent);
    }
  };

  const deleteTodo = async (item: Todo) => {
    // Recursive function to find all nested sub-items
    const findAllSubTodos = (parentId: string): Todo[] => {
      const directSubTodos = todos.filter(subTodo => subTodo.parent_id === parentId);
      return directSubTodos.flatMap(subTodo => [subTodo, ...findAllSubTodos(subTodo.id)]);
    };

    // Get all sub-items, including the current item
    const allTodos = [item, ...findAllSubTodos(item.id)];

    // Extract IDs of all todos to be deleted
    const allTodosIDs = allTodos.map(todo => todo.id);

    try {
      // Perform batch delete
      const deleteResults = await deleteExistingTodos(allTodosIDs);

      if (!deleteResults) {
        throw new Error('Failed to delete todos');
      }

      showAlertSnackbar('Todos deleted successfully');
      console.log('Creating activity logs for deleted todos...');

      // Create activity logs for each deleted todo
      const logs = allTodos.map(todo => {
        const log: ActivityLog = {
          id: '',
          action_type: 'DELETED' as action_type,
          action_date: new Date().toISOString(),
          section_id: null,
          before_data: JSON.stringify(todo),
          after_data: '',
          entity_type: 'todo' as entity_type,
          todo_id: todo.id,
          user_id: user!.id,
        };
        return log;
      });

      // Insert activity logs
      const insertedLogIds = await createActivityLogs(logs);

      if (!insertedLogIds) {
        showAlertSnackbar('Failed to insert activity logs');
      } else {
        showAlertSnackbar('Activity logs created successfully');
      }
    } catch (error) {
      showAlertSnackbar(`Failed to delete todos: ${error.message}`);
    }
  };

  const getSubItems = useCallback(
    (itemId: string) => todos.filter(todo => todo.parent_id === itemId),
    [todos],
  );

  const renderTodoItem = (params: RenderItemParams<Todo>) => (
    <ScaleDecorator>
      <ToDoItem
        subItems={getSubItems(params.item.id)}
        {...params}
        colors={colors}
        itemRefs={itemRefs}
        onToggleComplete={toggleCompleteTodo}
        openEditBottomSheet={openEditBottomSheet}
        deleteTodo={deleteTodo}
        sections={sections}
        enableSwipe={true}
      />
    </ScaleDecorator>
  );

  const handleSort = () => {
    if (sortBottomSheetRef.current) sortBottomSheetRef.current.present();

    setIsFABVisible(false);
    closeMenu();
  };

  if (isLoading) {
    return <PageLoadingActivityIndicator />;
  }

  const showMenu = () => setIsMenuVisible(true);
  const closeMenu = () => setIsMenuVisible(false);

  function keyExtractor(item: Todo, index: number): string {
    return `todo-${item.id || index.toString()}`;
  }

  function Header({title}: {title: string}) {
    let isVisible;
    let length = 0;
    switch (title) {
      case 'Overdue':
        isVisible = isOverdueVisible;
        length = overdueTodos.length;
        break;
      case 'Today':
        isVisible = isTodayVisible;
        length = todayTodos.length;
        break;
      case 'Completed':
        isVisible = isCompletedVisible;
        length = completedTodos.length;
        break;
      default:
        isVisible = false;
    }

    if (length === 0) {
      return null;
    }
    return (
      <TouchableOpacity
        onPress={handleSectionHeaderPress(title)}
        disabled={length === 0}
        style={[styles.sectionHeaderContainer, {backgroundColor: colors.background, zIndex: -1}]}>
        <Text style={styles.sectionHeader}>{title}</Text>
        <View style={styles.sectionHeaderContainer}>
          <Text>{length}</Text>
          <MaterialCommunityIcons
            name={isVisible ? 'chevron-down' : 'chevron-right'}
            size={24}
            color={length > 0 ? colors.primary : colors.background}
          />
        </View>
      </TouchableOpacity>
    );
  }

  const handleEditModalDismiss = async (selectedTodo: Todo, updatedTodo: Todo) => {
    editBottomSheetRef.current?.close();

    // Check if the todo has been updated using deep comparison
    if (!isEqual(updatedTodo, selectedTodo)) {
      if (selectedTodo.completed !== updatedTodo.completed) {
        selectedTodo = {...selectedTodo, completed: updatedTodo.completed};
        await toggleCompleteTodo(updatedTodo.id);
      }
      const message = await updateTodoWithNotification(selectedTodo, updatedTodo);
      showAlertSnackbar(message.message);

      if (message.status === 'error') return;

      const log: ActivityLog = {
        id: '',
        action_type: 'UPDATED' as action_type,
        action_date: new Date().toISOString(),
        section_id: null,
        before_data: JSON.stringify(selectedTodo),
        after_data: JSON.stringify(updatedTodo),
        entity_type: 'todo' as entity_type,
        todo_id: updatedTodo.id,
        user_id: user!.id,
      };

      const newLog = await createActivityLogs([log]);

      if (!newLog) {
        showAlertSnackbar('Failed to create todo activity log');
      } else {
        showAlertSnackbar('Activity log created successfully');
      }
    }

    setIsFABVisible(true);
  };

  const handleAddSubTodo = async (parent_id: string) => {
    if (!parent_id) return;
    setParentId(parent_id);
    setTimeout(() => showAddTodoModal(), 100);
  };

  /**
   * Handles the submission of a new to-do item, ensuring it is assigned to the appropriate section.
   *
   * This function performs several tasks:
   * - Verifies the provided `newTodo` item and determines its section.
   * - If the section does not exist, it creates a new section.
   * - Associates the to-do item with the correct section (new or existing).
   * - Adds the to-do item to the database.
   * - If a reminder option is set, schedules a notification and updates the to-do item with the notification ID.
   *
   * @param {Todo} newTodo The new to-do item to be added.
   * @param {string} [selectedSection='Inbox'] The name of the section to which the to-do item should be assigned.
   *                                              Defaults to 'Inbox' if not specified.
   *
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   *
   * @throws {Error} Handles any errors that occur during the process, including:
   *   - Failure to create a new section.
   *   - Failure to add the to-do item.
   *   - Failure to schedule a notification.
   *   - Failure to update the to-do item with the notification ID.
   *
   * The function provides feedback to the user through snackbar alerts, indicating the success or failure of each operation.
   */
  const handleSubmitEditing = async (
    newTodo: Todo,
    selectedSection: string = 'Inbox',
  ): Promise<void> => {
    if (!newTodo) return;

    try {
      // Trim the selected section name
      const trimmedSection = selectedSection.trim();

      const findSection = sections.find(section => section.name === trimmedSection);

      // Check if a new section needs to be created
      if (!findSection) {
        const newSection = {name: trimmedSection, user_id: user!.id};

        // Create a new section
        const sectionResult = await addNewSection(newSection);
        if (!sectionResult || !sectionResult.id) {
          showAlertSnackbar('Failed to create new section');
          return;
        }

        // Add the new section ID to the todo
        newTodo = {...newTodo, section_id: sectionResult.id};

        const log: ActivityLog = {
          id: '',
          action_type: 'CREATED' as action_type,
          action_date: new Date().toISOString(),
          section_id: sectionResult.id,
          before_data: '',
          after_data: JSON.stringify(sectionResult),
          entity_type: 'section' as entity_type,
          todo_id: '',
          user_id: user!.id,
        };

        const newLog = await createActivityLogs([log]);

        if (!newLog) {
          showAlertSnackbar('Failed to create section activity log');
          return;
        }
      } else {
        // Add the existing section ID to the todo
        newTodo = {...newTodo, section_id: findSection.id};
      }

      // Add the todo item
      const todoResult = await addNewTodo(newTodo);
      if (!todoResult) {
        showAlertSnackbar('Failed to add new todo');
        return;
      }

      // Handle notification scheduling if a reminder option is set
      if (todoResult.reminder_option && !todoResult.notification_id) {
        const notificationId = await scheduleTodoNotification(todoResult);
        if (!notificationId) {
          showAlertSnackbar('Failed to schedule notification');
          return;
        }

        // Update the todo with the notification ID
        const updatedTodoWithNotification = {...todoResult, notification_id: notificationId};
        const updateResult = await updateExistingTodos(updatedTodoWithNotification);
        if (!updateResult) {
          showAlertSnackbar('Failed to update todo with notification');
          return;
        }

        showAlertSnackbar('Todo added successfully with notification');
      } else {
        showAlertSnackbar('Todo added successfully');
      }
      console.log('Creating activity log for todo...');
      const log: ActivityLog = {
        id: '',
        action_type: 'CREATED' as action_type,
        action_date: new Date().toISOString(),
        section_id: null,
        before_data: '',
        after_data: JSON.stringify(todoResult),
        entity_type: 'todo' as entity_type,
        todo_id: todoResult.id,
        user_id: user!.id,
      };

      const newLog = await createActivityLogs([log]);

      if (!newLog) {
        showAlertSnackbar('Failed to create section activity log');
        return;
      } else {
        showAlertSnackbar('Activity log created successfully');
      }
    } catch (error) {
      console.error('An error occurred while handling submit editing:', error);
      showAlertSnackbar('An unexpected error occurred');
    }
  };

  return (
    <Host>
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <StatusBar style="auto" />
        <Appbar.Header elevated>
          <Appbar.Content title="Today" />
          <Menu
            anchorPosition="bottom"
            visible={isMenuVisible}
            onDismiss={closeMenu}
            anchor={
              <Appbar.Action icon="dots-vertical" color={colors.onSurface} onPress={showMenu} />
            }>
            <Menu.Item onPress={handleSort} title="Sort" />
            <Menu.Item onPress={() => {}} title="Select tasks" />
            <Menu.Item
              onPress={() => saveHideCompleted(!hideCompleted)}
              title={!hideCompleted ? 'hide Completed' : 'unhide Completed'}
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                closeMenu();
                router.push('/activity_log');
              }}
              title="Activity log"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                closeMenu();
                router.push('/_prototype-feedback');
              }}
              title="CalenTrack Feedback"
            />
          </Menu>
        </Appbar.Header>
        {overdueTodos.length === 0 &&
          todayTodos.length === 0 &&
          (completedTodos.length === 0 || hideCompleted) && (
            <View style={styles.emptyContainer}>
              <TimeOfDayImage />
            </View>
          )}

        <NestableScrollContainer stickyHeaderIndices={[0, 2, 4]} style={styles.scrollContainer}>
          <Header title={'Overdue'} />
          <Animated.View style={animatedOverdueStyle} exiting={FadeInUp}>
            <NestableDraggableFlatList
              initialNumToRender={7}
              scrollEnabled={true}
              onContentSizeChange={(w, h) => changeHeight(h, 'overdue')}
              data={overdueTodos}
              renderItem={renderTodoItem}
              keyExtractor={keyExtractor}
              onDragEnd={({data}) => handleEndDrag(data, 'overdue')}
              activationDistance={20}
              dragItemOverflow={true}
              tabIndex={0}
              renderPlaceholder={() => <DraggableItemPlaceholder />}
            />
          </Animated.View>

          <Header title={'Today'} />
          <Animated.View style={animatedTodayStyle} exiting={FadeInUp}>
            <NestableDraggableFlatList
              data={todayTodos}
              scrollEnabled={true}
              initialNumToRender={7}
              onContentSizeChange={(w, h) => changeHeight(h, 'today')}
              renderItem={renderTodoItem}
              keyExtractor={keyExtractor}
              onDragEnd={({data}) => {
                handleEndDrag(data, 'today');
              }}
              activationDistance={20}
              dragItemOverflow={true}
              renderPlaceholder={() => <DraggableItemPlaceholder />}
            />
          </Animated.View>

          {!hideCompleted && <Header title={'Completed'} />}
          {!hideCompleted && (
            <Animated.View style={animatedCompletedStyle} exiting={FadeInUp}>
              <NestableDraggableFlatList
                data={completedTodos}
                scrollEnabled={true}
                initialNumToRender={7}
                onContentSizeChange={(w, h) => changeHeight(h, 'completed')}
                renderItem={renderTodoItem}
                keyExtractor={keyExtractor}
                onDragEnd={({data}) => {
                  handleEndDrag(data, 'completed');
                }}
                activationDistance={20}
                dragItemOverflow={true}
                renderPlaceholder={() => <DraggableItemPlaceholder />}
              />
            </Animated.View>
          )}
        </NestableScrollContainer>

        <BottomSheetModalProvider>
          <AddTodoModal
            isVisible={isAddTodoModalVisible}
            setIsVisible={setIsAddTodoModalVisible}
            onBackdropPress={hideAddTodoModal}
            onSubmitEditing={handleSubmitEditing}
            sections={sections}
            propParentId={parentId}
          />
          <BottomSheetModal
            backdropComponent={backdropComponent}
            handleComponent={null}
            enableContentPanningGesture={false}
            ref={sortBottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            stackBehavior={'push'}
            onDismiss={() => setIsFABVisible(true)}>
            <View style={[styles.contentContainer, {backgroundColor: colors.secondaryContainer}]}>
              <View style={styles.section}>
                <Text style={{fontSize: 14, color: colors.onSurfaceVariant}}>Sort By</Text>
                <View style={styles.buttonGrid}>
                  <Button
                    mode={sortBy === 'date' ? 'contained' : 'outlined'}
                    style={[
                      styles.button,
                      {
                        backgroundColor:
                          sortBy === 'date' ? colors.primary : colors.secondaryContainer,
                      },
                    ]}
                    onPress={() => {
                      saveSortBy('date');
                    }}>
                    Date
                  </Button>
                  <Button
                    mode={sortBy === 'title' ? 'contained' : 'outlined'}
                    style={[
                      styles.button,
                      {
                        backgroundColor:
                          sortBy === 'title' ? colors.primary : colors.secondaryContainer,
                      },
                    ]}
                    onPress={() => {
                      saveSortBy('title');
                    }}>
                    Title
                  </Button>
                  <Button
                    mode={sortBy === 'section' ? 'contained' : 'outlined'}
                    style={[
                      styles.button,
                      {
                        backgroundColor:
                          sortBy === 'section' ? colors.primary : colors.secondaryContainer,
                      },
                    ]}
                    onPress={() => {
                      saveSortBy('section');
                    }}>
                    Section
                  </Button>
                  <Button
                    mode={sortBy === 'priority' ? 'contained' : 'outlined'}
                    style={[
                      styles.button,
                      {
                        backgroundColor:
                          sortBy === 'priority' ? colors.primary : colors.secondaryContainer,
                      },
                    ]}
                    onPress={() => {
                      saveSortBy('priority');
                    }}>
                    Priority
                  </Button>
                </View>
              </View>
              <Divider />
              <View style={styles.section}>
                <Text style={{fontSize: 14, color: colors.onSurfaceVariant}}>Sort Direction</Text>
                <View style={[styles.buttonGrid, {backgroundColor: colors.secondaryContainer}]}>
                  <Button
                    mode={sortDirection === 'asc' ? 'contained' : 'outlined'}
                    style={[
                      styles.button,
                      {
                        backgroundColor:
                          sortDirection === 'asc' ? colors.primary : colors.secondaryContainer,
                      },
                    ]}
                    onPress={() => {
                      saveSortDirection('asc');
                    }}>
                    Ascending
                  </Button>
                  <Button
                    mode={sortDirection === 'desc' ? 'contained' : 'outlined'}
                    style={[
                      styles.button,
                      {
                        backgroundColor:
                          sortDirection === 'desc' ? colors.primary : colors.secondaryContainer,
                      },
                    ]}
                    onPress={() => {
                      saveSortDirection('desc');
                    }}>
                    Descending
                  </Button>
                </View>
              </View>
            </View>
          </BottomSheetModal>

          <EditTodoModal ref={editBottomSheetRef}>
            {data => (
              <EditTodoModalContent
                todo={data.data}
                onDismiss={handleEditModalDismiss}
                sections={sections}
                colors={colors}
                deleteTodo={deleteTodo}
                openEditBottomSheet={openEditBottomSheet}
                onPress={handleAddSubTodo}
                toggleCompleteTodo={toggleCompleteTodo}
              />
            )}
          </EditTodoModal>
        </BottomSheetModalProvider>
        {isFABVisible && <AddTodoFAB onPress={showAddTodoModal} />}
        <AlertSnackbar
          visible={isAlertSnackbarVisible}
          message={alertMessage}
          onDismiss={hideAlertSnackbar}
        />
      </View>
    </Host>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '30%',
    gap: 10,
  },
  image: {
    flex: 1,
    width: '60%',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summary: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    margin: 10,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    margin: 5,
    flexBasis: '30%', // Adjust this percentage to fit 2 or 3 columns
  },
  sortButton: {
    marginTop: 16,
  },
});

export default TodayScreen;
