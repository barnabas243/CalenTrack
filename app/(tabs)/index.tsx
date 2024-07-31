import React from 'react';
import {SectionList, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useTodo} from '@/contexts/TodoContext';
import {TodoItem} from '@/contexts/TodoContext.types'; // Assuming TodoItem interface is imported
import {
  Text,
  ActivityIndicator,
  useTheme,
  Divider,
  Appbar,
  Menu,
  Button,
  Snackbar,
} from 'react-native-paper';
import ToDoItem from '@/components/ToDoItem';
import {StatusBar} from 'expo-status-bar';
import {useUser} from '@/contexts/UserContext';
import AddTodoFAB from '@/components/addTodoFAB';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
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
} from 'react-native-draggable-flatlist';
import Animated, {ZoomInUp, ZoomOutUp} from 'react-native-reanimated';

dayjs.extend(advancedFormat);

const HomeScreen = () => {
  const {colors} = useTheme();
  const {isLoading} = useUser();
  const {
    overdueTodos,
    todayTodos,
    completedTodos,
    handleEndDrag,
    batchDeleteTodos,
    batchCompleteTodos,
  } = useTodo();

  const [isOverdueVisible, setIsOverdueVisible] = React.useState(true);
  const [isTodayVisible, setIsTodayVisible] = React.useState(true);
  const [isCompletedVisible, setIsCompletedVisible] = React.useState(true);
  const [isFABVisible, setIsFABVisible] = React.useState(true);
  const [isMenuVisible, setIsMenuVisible] = React.useState(false);

  const snackbarRef = React.useRef(null);
  const [isSnackbarVisible, setIsSnackbarVisible] = React.useState(false);
  const [snackBarText, setSnackBarText] = React.useState('This is the default snack bar text');

  const showSnackBar = () => setIsSnackbarVisible(true);

  const onDismissSnackBar = () => setIsSnackbarVisible(false);

  // // multiple select items based on id
  const [selectedItems, setSelectedItems] = React.useState<Map<number, {completed: boolean}>>(
    new Map(),
  );

  // bottomsheets ref
  const sortBottomSheetRef = React.useRef<BottomSheetModal>(null);

  const snapPoints = React.useMemo(() => ['25%', '40%', '75%'], []);

  // const handleSelect = (id: number, completed: boolean) => {
  //   setSelectedItems(prevSelectedItems => {
  //     const newSelectedItems = new Map(prevSelectedItems);
  //     if (newSelectedItems.has(id)) {
  //       newSelectedItems.delete(id);
  //     } else {
  //       newSelectedItems.set(id, {completed});
  //     }
  //     return newSelectedItems;
  //   });
  // };

  // const handleDeleteSelected = async () => {
  //   const ids = Array.from(selectedItems.keys());
  //   const isDeletedSuccessfully = await batchDeleteTodos(ids);
  //   if (isDeletedSuccessfully) {
  //     setSnackBarText(`Deleted ${ids.length} items`);
  //     showSnackBar();
  //     setSelectedItems(new Map());
  //   } else {
  //     // show error message
  //   }
  // };

  // const handleMarkSelectedAsComplete = async () => {
  //   const ids = Array.from(selectedItems.keys());
  //   const isUpdatedSuccessfully = await batchCompleteTodos(ids);

  //   let message = '';
  //   if (isUpdatedSuccessfully) {
  //     message = `Marked ${ids.length} items as completed`;
  //   } else {
  //     // show error message
  //     message = 'Error marking items as completed';
  //   }
  //   setSnackBarText(message);
  //   showSnackBar();
  //   setSelectedItems(new Map());
  // };

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

  const renderTodoItem = (params: RenderItemParams<TodoItem>) => (
    <ToDoItem {...params} colors={colors} />
  );

  const handleSort = () => {
    if (sortBottomSheetRef.current) sortBottomSheetRef.current.present();

    setIsFABVisible(false);
    closeMenu();
  };

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator />
      </View>
    );
  }

  const showMenu = () => {
    setIsMenuVisible(true);
  };
  const closeMenu = () => setIsMenuVisible(false);

  function keyExtractor(item: TodoItem, index: number): string {
    return item.id?.toString() || index.toString();
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
        style={[styles.sectionHeaderContainer, {backgroundColor: colors.background}]}>
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

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar style="auto" />
      <Appbar.Header>
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
        <Animated.View entering={ZoomInUp} exiting={ZoomOutUp}>
          <NestableDraggableFlatList
            data={isOverdueVisible ? overdueTodos : []}
            renderItem={renderTodoItem}
            keyExtractor={keyExtractor}
            onDragEnd={({data}) => handleEndDrag(data, 'overdue')}
            activationDistance={20}
            renderPlaceholder={() => (
              <Divider
                bold
                style={{
                  backgroundColor: colors.primary,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              />
            )}
          />
        </Animated.View>
        <Header title={'Today'} />

        <Animated.View entering={ZoomInUp} exiting={ZoomOutUp}>
          <NestableDraggableFlatList
            data={isTodayVisible ? todayTodos : []}
            renderItem={renderTodoItem}
            keyExtractor={keyExtractor}
            onDragEnd={({data}) => handleEndDrag(data, 'today')}
            activationDistance={20}
            renderPlaceholder={() => (
              <Divider
                bold
                style={{
                  backgroundColor: colors.primary,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              />
            )}
            // ListFooterComponent={() => <Divider bold />}
          />
        </Animated.View>
        <Header title={'Completed'} />

        <Animated.View entering={ZoomInUp} exiting={ZoomOutUp}>
          <NestableDraggableFlatList
            data={isCompletedVisible ? completedTodos : []}
            renderItem={renderTodoItem}
            keyExtractor={keyExtractor}
            onDragEnd={({data}) => handleEndDrag(data, 'completed')}
            activationDistance={20}
            // ListFooterComponent={() => <Divider bold />}
          />
        </Animated.View>
      </NestableScrollContainer>
      <BottomSheetModalProvider>
        <BottomSheetModal
          backdropComponent={(
            props, // found from https://github.com/gorhom/react-native-bottom-sheet/issues/187
          ) => (
            <BottomSheetBackdrop
              {...props}
              opacity={0.5}
              enableTouchThrough={false}
              appearsOnIndex={0}
              disappearsOnIndex={-1}
              style={[{backgroundColor: 'rgba(0, 0, 0, 1)'}, StyleSheet.absoluteFillObject]}
            />
          )}
          handleComponent={null}
          enableContentPanningGesture={false}
          ref={sortBottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          stackBehavior={'push'}
          onDismiss={() => setIsFABVisible(true)}>
          <View style={[styles.contentContainer, {backgroundColor: colors.secondaryContainer}]}>
            <View style={styles.section}>
              <Text style={{fontSize: 14, color: colors.onSurfaceVariant}}>Sort By</Text>
              <View style={styles.buttonGrid}>
                <Button
                  mode="contained"
                  style={[styles.button, {backgroundColor: colors.primary}]}
                  onPress={() => {
                    /* Handle Date Sort By */
                  }}>
                  Created Date
                </Button>
                <Button
                  mode="contained"
                  style={styles.button}
                  onPress={() => {
                    /* Handle Title Sort By */
                  }}>
                  Title
                </Button>
                <Button
                  mode="contained"
                  style={styles.button}
                  onPress={() => {
                    /* Handle Section Sort By */
                  }}>
                  Section
                </Button>
                <Button
                  mode="contained"
                  style={styles.button}
                  onPress={() => {
                    /* Handle Priority Sort By */
                  }}>
                  Priority
                </Button>
              </View>
            </View>
          </View>
        </BottomSheetModal>
      </BottomSheetModalProvider>
      {isFABVisible && <AddTodoFAB />}
      <Snackbar
        ref={snackbarRef}
        visible={isSnackbarVisible}
        onDismiss={onDismissSnackBar}
        action={{
          label: 'Undo',
          onPress: () => {
            // Do something
          },
        }}>
        {snackBarText}
      </Snackbar>
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
