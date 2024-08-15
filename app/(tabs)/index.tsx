import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, StyleSheet, TouchableOpacity, View} from 'react-native';
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
import {Todo} from '@/powersync/AppSchema';

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
          !todo.completed &&
          dayjs(todo.due_date).isBefore(yesterday, 'day'),
      );
    case 'today':
      return sortedTodos.filter(
        todo =>
          dayjs(todo.due_date).isValid() &&
          !todo.completed &&
          dayjs(todo.due_date).isSame(todayDate, 'day'),
      );
    case 'completed':
      return sortedTodos.filter(todo => todo.completed);
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
      sortedTodos.sort((a, b) => (a.section_id ?? 0) - (b.section_id ?? 0));
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

const HomeScreen = () => {
  const {colors} = useTheme();
  const {isLoading, user} = useAuth();

  const {todos, sections, deleteExistingTodos, updateExistingTodos, addNewSection, addNewTodo} =
    useTodo();

  const [overdueTodos, setOverdueTodos] = useState<Todo[]>([]);
  const [todayTodos, setTodayTodos] = useState<Todo[]>([]);
  const [completedTodos, setCompletedTodos] = useState<Todo[]>([]);

  const [sortBy, setSortBy] = useState<sortByType>('date');
  const [sortDirection, setSortDirection] = useState<sortDirectionType>('asc');

  const sortedTodos = useMemo(() => {
    return sortTodos(todos, sortBy, sortDirection);
  }, [sortBy, sortDirection, todos]);

  // Update state based on sortedTodos
  useEffect(() => {
    setOverdueTodos(filterTodos(sortedTodos, 'overdue'));
    setTodayTodos(filterTodos(sortedTodos, 'today'));
    setCompletedTodos(filterTodos(sortedTodos, 'completed'));
  }, [sortedTodos]);

  const [isOverdueVisible, setIsOverdueVisible] = useState(true);
  const [isTodayVisible, setIsTodayVisible] = useState(true);
  const [isCompletedVisible, setIsCompletedVisible] = useState(true);
  const [isFABVisible, setIsFABVisible] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const [isAddTodoModalVisible, setIsAddTodoModalVisible] = useState(false);

  const showAddTodoModal = () => setIsAddTodoModalVisible(true);
  const hideAddTodoModal = () => setIsAddTodoModalVisible(false);

  // Swipeable item params
  const itemRefs = React.useRef(new Map());

  // bottomsheets ref
  const sortBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const editBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ['25%', '40%', '75%'], []);

  // Shared values for the height animation
  const overdueHeight = useSharedValue(0);
  const todayHeight = useSharedValue(0);
  const completedHeight = useSharedValue(0);

  // Animated values
  const animatedOverdueHeight = useSharedValue(0);
  const animatedTodayHeight = useSharedValue(0);
  const animatedCompletedHeight = useSharedValue(0);

  // Update the height values when the content size changes
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

  // useDerivedValue to animate the height
  useDerivedValue(() => {
    animatedOverdueHeight.value = withTiming(isOverdueVisible ? overdueHeight.value : 0, {
      duration: 200,
    });
  }, [isOverdueVisible]);

  useDerivedValue(() => {
    animatedTodayHeight.value = withTiming(isTodayVisible ? todayHeight.value : 0, {
      duration: 200,
    });
  }, [isTodayVisible]);

  useDerivedValue(() => {
    animatedCompletedHeight.value = withTiming(isCompletedVisible ? completedHeight.value : 0, {
      duration: 200,
    });
  }, [isCompletedVisible]);

  // Animated styles for height
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

  const toggleCompleteTodo = (id: string) => {
    const todo = todos.find(todo => todo.id === id);
    if (todo) {
      updateExistingTodos({
        ...todo,
        completed: !todo.completed ? 1 : 0,
        completed_at: todo.completed ? null : new Date().toString(),
      });
    }
  };

  const openEditBottomSheet = (item: Todo) => {
    if (editBottomSheetRef.current) {
      editBottomSheetRef.current.present(item);
    }
  };

  const deleteTodo = async (id: string) => {
    const deleted = await deleteExistingTodos(id);
    if (!deleted) {
      Alert.alert('Error', 'Failed to delete todo');
    }
  };

  const renderTodoItem = (params: RenderItemParams<Todo>) => (
    <ScaleDecorator>
      <ToDoItem
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

  const showMenu = () => {
    setIsMenuVisible(true);
  };
  const closeMenu = () => setIsMenuVisible(false);

  function keyExtractor(item: Todo, index: number): string {
    return item.id || index.toString();
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
    return (
      <TouchableOpacity
        onPress={handleSectionHeaderPress(title)}
        disabled={length === 0}
        style={[styles.sectionHeaderContainer, {backgroundColor: colors.background, zIndex: -1}]}>
        <Text style={styles.sectionHeader}>{title}</Text>
        <View style={styles.sectionHeaderContainer}>
          <Text>{length}</Text>
          <MaterialCommunityIcons
            name={isVisible ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={length > 0 ? colors.primary : colors.background}
          />
        </View>
      </TouchableOpacity>
    );
  }

  const handleEditModalDismiss = async (selectedTodo: Todo, updatedTodo: Todo) => {
    // Check if the todo has been updated using deep comparison
    if (!isEqual(updatedTodo, selectedTodo)) {
      await updateExistingTodos(updatedTodo);
    }
  };

  const handleSubmitEditing = async (newTodo: Todo, selectedSection = 'Inbox') => {
    if (!newTodo) return;

    try {
      if (
        selectedSection.trim().length > 0 &&
        selectedSection.trim() !== 'Inbox' &&
        !newTodo.section_id
      ) {
        // Create a new section if it doesn't exist
        const newSection = {name: selectedSection.trim(), user_id: user!.id};

        // Assuming addNewSection returns the created section or an identifier
        const result = await addNewSection(newSection);
        if (!result || !result.id) {
          Alert.alert('Error', 'Failed to create new section');
          return;
        }

        // Add section ID to newTodo and then add the todo
        const updatedTodo = {...newTodo, section_id: Number(result.id)};
        const todoResult = await addNewTodo(updatedTodo);

        if (!todoResult) {
          Alert.alert('Error', 'Failed to add new todo');
        }
      } else {
        // If section_id is present or selectedSection is 'Inbox', directly add the todo
        const todoResult = await addNewTodo(newTodo);

        if (!todoResult) {
          Alert.alert('Error', 'Failed to add new todo');
        }
      }
    } catch (error) {
      console.error('An error occurred while handling submit editing:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const onDismiss = () => {
    console.log('dismissed');
  };

  const buttonMode = sortDirection === 'desc' ? 'contained' : 'outlined';

  return (
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
          <Divider />
          <Menu.Item onPress={() => {}} title="Activity log" />
          <Divider />
          <Menu.Item
            onPress={() => {
              closeMenu();
              router.push('/_feature-feedback');
            }}
            title="CalenTrack Feedback"
          />
        </Menu>
      </Appbar.Header>

      <NestableScrollContainer stickyHeaderIndices={[0, 2, 4]} style={styles.scrollContainer}>
        <Header title={'Overdue'} />
        <Animated.View style={animatedOverdueStyle} entering={FadeInUp}>
          <NestableDraggableFlatList
            initialNumToRender={7}
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
        <Animated.View style={animatedTodayStyle} entering={FadeInUp}>
          <NestableDraggableFlatList
            data={todayTodos}
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

        <Header title={'Completed'} />
        <Animated.View style={animatedCompletedStyle} entering={FadeInUp}>
          <NestableDraggableFlatList
            data={completedTodos}
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
      </NestableScrollContainer>

      <BottomSheetModalProvider>
        <AddTodoModal
          isVisible={isAddTodoModalVisible}
          setIsVisible={setIsAddTodoModalVisible}
          onBackdropPress={hideAddTodoModal}
          onSubmitEditing={handleSubmitEditing}
          sections={sections}
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
                    setSortBy('date');
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
                    setSortBy('title');
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
                    setSortBy('section');
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
                    setSortBy('priority');
                  }}>
                  Priority
                </Button>
              </View>
            </View>
            <Divider />
            <View style={styles.section}>
              <Text style={{fontSize: 14, color: colors.onSurfaceVariant}}>Sort Direction</Text>
              <View style={styles.buttonGrid}>
                <Button
                  mode={buttonMode}
                  style={[
                    styles.button,
                    {
                      backgroundColor:
                        sortDirection === 'asc' ? colors.primary : colors.secondaryContainer,
                    },
                  ]}
                  onPress={() => {
                    setSortDirection('asc');
                  }}>
                  Ascending
                </Button>
                <Button
                  mode={buttonMode}
                  style={[
                    styles.button,
                    {
                      backgroundColor:
                        sortDirection === 'desc' ? colors.primary : colors.secondaryContainer,
                    },
                  ]}
                  onPress={() => {
                    setSortDirection('desc');
                  }}>
                  Descending
                </Button>
              </View>
            </View>
          </View>
        </BottomSheetModal>

        <EditTodoModal ref={editBottomSheetRef} onDismiss={onDismiss}>
          {data => (
            <EditTodoModalContent
              todo={data.data}
              onDismiss={handleEditModalDismiss}
              sections={sections}
              colors={colors}
            />
          )}
        </EditTodoModal>
      </BottomSheetModalProvider>
      {isFABVisible && <AddTodoFAB onPress={showAddTodoModal} />}
    </View>
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

export default HomeScreen;
