import React, {useState, useMemo, useCallback, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
} from 'react-native';
import Modal from 'react-native-modal';
import {
  useTheme,
  TextInput,
  Button,
  HelperText,
  Appbar,
  Menu,
  Divider,
  Text,
} from 'react-native-paper';
import AddTodoFAB from '@/components/addTodoFAB';
import DraggableFlatList, {RenderItemParams, ScaleDecorator} from 'react-native-draggable-flatlist';
import {router, useLocalSearchParams} from 'expo-router';
import SwiperFlatList from 'react-native-swiper-flatlist';
import {SwipeableItemImperativeRef} from 'react-native-swipeable-item';
import {useTodo} from '@/hooks/useTodo';
import {SectionWithTodos} from '@/store/section/types';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import EditTodoModal from '@/components/modals/EditTodoModal';
import EditTodoModalContent from '@/components/modals/EditTodoModalContent';
import {isEqual} from 'lodash';
import {useAuth} from '@/hooks/useAuth';
import AddTodoModal from '@/components/modals/addTodoModal';
import DraggableItemPlaceholder from '@/components/DraggableItemPlaceholder';
import {AutoCompleteDropDown} from '@/components/AutoCompleteDropDown';
import {AutocompleteDropdownItem} from 'react-native-autocomplete-dropdown';
import {Todo, Section, ActivityLog, action_type, entity_type} from '@/powersync/AppSchema';
import ToDoItem from '@/components/ToDoItem';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import AlertSnackbar from '@/components/AlertSnackbar';
import {useNotification} from '@/contexts/NotificationContext';
import {Host} from 'react-native-portalize';
import {
  getSetting,
  saveSetting,
  SETTINGS,
  SortByType,
  SortDirectionType,
} from '@/utils/settingUtils';
import {BottomSheetDefaultBackdropProps} from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import {sortTodos} from '@/utils/filterSortTodos';

const InboxScreen = () => {
  const {colors} = useTheme();

  const {
    todos,
    sections,
    addNewTodo,
    addNewSection,
    updateExistingSection,
    deleteExistingSection,
    updateExistingTodos,
    deleteExistingTodos,
    createActivityLogs,
    toggleBatchCompleteTodo,
  } = useTodo();

  const [isLayoutReady, setLayoutReady] = useState(false);

  const {section_id} = useLocalSearchParams();

  const {user} = useAuth();

  const {updateTodoWithNotification, scheduleTodoNotification} = useNotification();

  const [groupedSections, setGroupedSections] = useState<SectionWithTodos[]>([]);

  const [newSectionName, setNewSectionName] = useState('');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  const [parentId, setParentId] = useState('');

  const [sortBy, setSortBy] = useState<SortByType>('date');
  const [sortDirection, setSortDirection] = useState<SortDirectionType>('asc');

  const sortBottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ['25%', '40%', '75%'], []);

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

  // Load settings when the component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Fetch individual settings for index page
        const savedSortBy = await getSetting<SortByType>(SETTINGS.SORT_BY);
        const savedSortDirection = await getSetting<SortDirectionType>(SETTINGS.SORT_DIRECTION);

        // Update state with saved settings or default values
        setSortBy(savedSortBy ?? 'date');
        setSortDirection(savedSortDirection ?? 'asc');
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    // To unsubscribe to these update, just use:
    loadSettings();
  }, []);

  const handleSort = () => {
    if (sortBottomSheetRef.current) sortBottomSheetRef.current.present();

    setShowFAB(false);
    closeMenu();
  };

  const showMenu = () => setIsMenuVisible(true);
  const closeMenu = () => setIsMenuVisible(false);

  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const [isSectionModalVisible, setSectionModalVisible] = useState(false);
  const [isAddTodoModalVisible, setIsAddTodoModalVisible] = useState(false);

  const [isAlertSnackbarVisible, setIsAlertSnackbarVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const showAlertSnackbar = (message: string) => {
    setAlertMessage(message);
    setIsAlertSnackbarVisible(true);
  };

  const hideAlertSnackbar = () => {
    setAlertMessage('');
    setIsAlertSnackbarVisible(false);
  };

  const [showFAB, setShowFAB] = useState(true);

  const editBottomSheetRef = useRef<BottomSheetModal>(null);

  const swiperRef = useRef<SwiperFlatList>(null);
  const draggableListRefs = useRef(new Map<string, FlatList<Todo>>());
  const itemRefs = useRef(new Map<string, SwipeableItemImperativeRef>());

  const sectionNameMap = useMemo(
    () => new Map(sections.map(sec => [sec.id, sec.name])),
    [sections],
  );

  const autoCompleteItems: AutocompleteDropdownItem[] = useMemo(() => {
    const sectionItems = sections.map(sec => ({id: sec.id, title: sec.name}));
    const todoItems = todos.map(todo => ({id: `${todo.section_id} ${todo.id}`, title: todo.title}));
    return [...sectionItems, ...todoItems];
  }, [sections, todos]);

  const showAddTodoModal = useCallback(() => setIsAddTodoModalVisible(true), []);
  const hideAddTodoModal = useCallback(() => setIsAddTodoModalVisible(false), []);

  const sortedTodos = useMemo(() => {
    return sortTodos(todos, sortBy, sortDirection);
  }, [sortBy, sortDirection, todos]);

  const memoizedGroupedSections = useMemo(() => {
    // Map of section IDs to section names
    const groupedSectionsData = sortedTodos.reduce((acc, item) => {
      const sectionId = item.section_id || '568c6c1d-9441-4cbc-9fc5-23c98fee1d3d';
      if (!acc.has(sectionId)) {
        acc.set(sectionId, []);
      }
      acc.get(sectionId)!.push(item);
      return acc;
    }, new Map<string, Todo[]>());

    // Create a list of updated sections with todos
    const updatedSections = Array.from(sectionNameMap.entries()).map(
      ([sectionId, sectionName]) => ({
        key: sectionId,
        name: sectionName || 'Unknown',
        data: groupedSectionsData.get(sectionId) || [], // Use empty array if no todos
      }),
    );

    // Add an extra section for the "Create New Section" button
    updatedSections.push({
      key: 'new_section',
      name: 'Create New Section',
      data: [], // Empty data array since this is just a button
    });

    return updatedSections;
  }, [sortedTodos, sectionNameMap]);

  // Update state when memoizedGroupedSections changes
  useEffect(() => {
    setGroupedSections(memoizedGroupedSections);
  }, [memoizedGroupedSections]);

  useEffect(() => {
    const getSectionIndex = (id: string) => sections.findIndex(sec => sec.id === id);

    if (section_id && swiperRef.current && isLayoutReady) {
      const index = getSectionIndex(section_id as string);
      swiperRef.current.scrollToIndex({index, animated: true});
    }
  }, [section_id, isLayoutReady, sections]);

  const handleAddSection = useCallback(async () => {
    const trimmedSectionName = newSectionName.trim();
    if (!trimmedSectionName) {
      return;
    }

    Keyboard.dismiss();
    setNewSectionName('');
    setSectionModalVisible(false);
    const newSection = await addNewSection({name: trimmedSectionName, user_id: user!.id}).catch(
      error => {
        showAlertSnackbar(error);
      },
    );

    const log: ActivityLog = {
      id: '',
      action_type: 'CREATED' as action_type,
      action_date: new Date().toISOString(),
      section_id: newSection!.id,
      before_data: '',
      after_data: JSON.stringify(newSection),
      entity_type: 'section' as entity_type,
      todo_id: null,
      user_id: user!.id,
    };

    const newLog = await createActivityLogs([log]);

    if (!newLog) {
      console.warn('Failed to create section activity log');
    }
  }, [newSectionName, addNewSection, user, createActivityLogs]);

  const handlePress = useCallback(
    (sectionId: string) => {
      const section = sections.find(sec => sec.id === sectionId);
      if (!section) return;

      setSelectedSection(section);
      setNewSectionName(section.name!);
      setSectionModalVisible(true);
    },
    [sections],
  );

  const handleDeleteSection = useCallback(async () => {
    if (!selectedSection) {
      showAlertSnackbar('No section selected');
      return;
    }

    if (selectedSection.id === '1') {
      showAlertSnackbar('Cannot delete Inbox section');
    }

    try {
      const oldSection = selectedSection;
      const isDeleted = await deleteExistingSection(selectedSection.id);

      if (!isDeleted) {
        showAlertSnackbar('Failed to delete section');
      }

      setNewSectionName('');
      setSectionModalVisible(false);

      showAlertSnackbar('Section deleted successfully');

      const log = {
        id: '',
        action_type: 'DELETED' as action_type,
        action_date: new Date().toISOString(),
        section_id: oldSection.id,
        before_data: JSON.stringify(oldSection),
        after_data: '',
        entity_type: 'section' as entity_type,
        todo_id: null,
        user_id: user!.id,
      };

      const newLog = await createActivityLogs([log]);

      if (!newLog) console.warn('Failed to create section activity log');
    } catch {
      showAlertSnackbar('Failed to delete section');
    }
  }, [selectedSection, deleteExistingSection, user, createActivityLogs]);

  const displayDeleteSectionAlert = useCallback(() => {
    Alert.alert('Delete Section', 'Are you sure you want to delete this section?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', onPress: handleDeleteSection, style: 'destructive'},
    ]);
  }, [handleDeleteSection]);

  const handleUpdateSection = useCallback(async () => {
    if (!selectedSection || !newSectionName) {
      return;
    }

    try {
      const oldSection = selectedSection;
      const updatedSection = {...oldSection, name: newSectionName};
      const data = await updateExistingSection(updatedSection).catch(() =>
        console.error('Error updating section'),
      );
      if (data) {
        setNewSectionName('');
        setSelectedSection(null);
        setSectionModalVisible(false);
        Keyboard.dismiss();

        showAlertSnackbar('Section updated successfully');

        const log: ActivityLog = {
          id: '',
          action_type: 'UPDATED' as action_type,
          action_date: new Date().toISOString(),
          section_id: updatedSection.id,
          before_data: JSON.stringify(oldSection),
          after_data: JSON.stringify(updatedSection),
          entity_type: 'section' as entity_type,
          todo_id: null,
          user_id: user!.id,
        };

        const newLog = await createActivityLogs([log]);

        if (!newLog) console.warn('Failed to create section activity log');
      }
    } catch {
      showAlertSnackbar('Failed to update section');
    }
  }, [selectedSection, newSectionName, updateExistingSection, user, createActivityLogs]);

  const isSectionNameInvalid =
    !newSectionName ||
    newSectionName.trim() === '' ||
    newSectionName.length > 20 ||
    /\s/.test(newSectionName);

  const showAddSectionModal = useCallback(() => setSectionModalVisible(true), []);
  const hideAddSectionModal = useCallback(() => setSectionModalVisible(false), []);

  const handleEndDrag = useCallback(
    (data: Todo[], sectionName: string) => {
      const sectionMap = new Map(sections.map(sec => [sec.name, sec.id]));

      const sectionId = sectionMap.get(sectionName);
      if (sectionId === undefined) return;

      const sectionData = data.map(item => ({...item, section_id: sectionId}));

      const updatedSections = groupedSections.map(sec =>
        sec.name === sectionName ? {...sec, data: sectionData} : sec,
      );

      setGroupedSections(updatedSections);
    },
    [groupedSections, sections],
  );

  const handleAddSubTodo = async (parent_id: string) => {
    if (!parent_id) return;
    setParentId(parent_id);
    setTimeout(() => showAddTodoModal(), 100);
  };

  const handleSubmitEditing = async (newTodo: Todo, selectedSection = 'Inbox') => {
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
          console.warn('Failed to create section activity log');
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
        console.warn('Failed to create section activity log');
        return;
      }
    } catch (error) {
      console.error('An error occurred while handling submit editing:', error);
      showAlertSnackbar('An unexpected error occurred');
    }
  };

  const onChangeIndex = (item: {index: number; prevIndex: number}) => {
    const {index, prevIndex} = item;

    if (index !== prevIndex) {
      const currentSection = sections[index];
      if (index === groupedSections.length - 1) {
        setShowFAB(false);
      } else if (!showFAB) {
        setShowFAB(true);
      }

      setSelectedSection(currentSection);
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
      console.warn('Failed to create todo activity log');
    }
  };

  const openEditBottomSheet = async (item: Todo) => {
    if (editBottomSheetRef.current) {
      // Helper function to wait for the bottom sheet to close
      try {
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

        setShowFAB(false);
        // Present the updated item
        editBottomSheetRef.current.present(itemToPresent);
      } catch (error) {
        console.error('Error handling bottom sheet:', error);
      }
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
        console.warn('Failed to create todo activity log');
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
        {...params}
        colors={colors}
        itemRefs={itemRefs}
        onToggleComplete={toggleCompleteTodo}
        openEditBottomSheet={openEditBottomSheet}
        deleteTodo={deleteTodo}
        sections={sections}
        subItems={getSubItems(params.item.id)}
      />
    </ScaleDecorator>
  );

  const handleLayout = () => {
    setLayoutReady(true);
  };

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
        console.warn('Failed to create todo activity log');
      }
    }

    setShowFAB(true);
  };

  const renderPlaceholder = () => <DraggableItemPlaceholder />;
  const renderEmptyComponent = (item: SectionWithTodos) =>
    item.key === 'new_section' ? (
      <View style={styles.centerContainer}>
        <Button
          testID="add-section-button"
          mode="contained-tonal"
          icon={'plus'}
          onPress={showAddSectionModal}>
          Create New Section
        </Button>
      </View>
    ) : (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="file-document-outline" size={70} color={colors.primary} />
        <View style={{flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center'}}>
          <Text variant="titleLarge" style={{color: colors.onSurface}}>
            No Tasks Available
          </Text>
          <Text variant="bodySmall" style={{color: colors.onSurfaceVariant, marginTop: 5}}>
            It appears there are no tasks in this section yet.
          </Text>
        </View>
      </View>
    );
  const renderHeaderComponent = (item: SectionWithTodos) => (
    <>
      <View style={[styles.headerContainer, {backgroundColor: colors.background}]}>
        <TouchableOpacity
          onPress={() => handlePress(item.key)}
          onLongPress={displayDeleteSectionAlert}
          disabled={item.name === 'Inbox' || item.key === 'new_section'}>
          <Text variant="titleMedium" style={{color: colors.primary}}>
            {item.name}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const findSectionIndexById = (id: string) => {
    return sections.findIndex(sec => sec.id === id);
  };
  // Callback function to handle text changes
  const handleSelectItem = async (item: AutocompleteDropdownItem | null) => {
    if (!item) {
      return;
    }
    // Split the id by space
    const idParts = item.id.split(' ');
    const isTodoItem = idParts.length > 1;
    // If the idParts has more than one element, the item id is the last element
    const sectionId = idParts[0];
    const sectionIndex = findSectionIndexById(sectionId);

    await new Promise(resolve => {
      editBottomSheetRef.current?.close();
      // Resolve after a short delay to ensure it closes properly
      setTimeout(resolve, 200); // Adjust the delay if needed
    });

    swiperRef.current?.scrollToIndex({index: sectionIndex, animated: true});

    if (isTodoItem) {
      const itemId = idParts[1];
      const flatListRef = draggableListRefs.current.get(sectionId.toString());

      if (flatListRef && flatListRef.props.data) {
        const index = Array.from(flatListRef.props.data).findIndex(todo => todo.id === itemId);
        if (index !== -1) {
          flatListRef.scrollToIndex({index, animated: true, viewPosition: 0.1});

          // Open the edit bottom sheet
          const todo = flatListRef.props.data[index];
          openEditBottomSheet(todo);
        }
      }
    }
  };

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
  return (
    <View style={[styles.container, {backgroundColor: colors.background}]} onLayout={handleLayout}>
      <Appbar.Header mode="small" elevated>
        <Appbar.Content title="Inbox" style={{flex: 1}} titleStyle={{margin: 0, padding: 0}} />
        <View style={styles.searchContainer}>
          <AutoCompleteDropDown
            testID="autocomplete-dropdown"
            data={autoCompleteItems}
            onSelectItem={handleSelectItem}
          />
        </View>
        <Menu
          anchorPosition="bottom"
          visible={isMenuVisible}
          onDismiss={() => setIsMenuVisible(false)}
          anchor={
            <Appbar.Action icon="dots-vertical" color={colors.onSurface} onPress={showMenu} />
          }>
          <Menu.Item onPress={handleSort} title="Sort" />
          <Menu.Item onPress={() => {}} title="Select tasks" />
          <Divider />
          <Menu.Item
            onPress={() => {
              setIsMenuVisible(false);
              router.push('/activity_log');
            }}
            title="Activity log"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setIsMenuVisible(false);
              router.push('/_prototype-feedback');
            }}
            title="CalenTrack Feedback"
          />
        </Menu>
      </Appbar.Header>

      <SwiperFlatList
        ref={swiperRef}
        keyExtractor={item => item.key}
        data={groupedSections}
        showPagination
        paginationActiveColor={colors.primary}
        paginationDefaultColor={colors.inverseOnSurface}
        paginationStyleItem={{width: 8, height: 8}}
        initialNumToRender={3}
        onChangeIndex={onChangeIndex}
        showsVerticalScrollIndicator={false}
        renderItem={({item}) => (
          <DraggableFlatList
            ref={ref => {
              if (ref) {
                draggableListRefs.current.set(item.key, ref); // Set the ref for the whole list, not individual items
              }
            }}
            data={item.data}
            showsVerticalScrollIndicator={false}
            renderItem={renderTodoItem}
            keyExtractor={item => item.id!}
            onDragEnd={({data}) => handleEndDrag(data, item.name)}
            initialNumToRender={8}
            activationDistance={20}
            stickyHeaderIndices={[0]}
            containerStyle={[styles.todoList, {backgroundColor: colors.background}]}
            renderPlaceholder={renderPlaceholder}
            ListEmptyComponent={renderEmptyComponent(item)}
            ListHeaderComponent={renderHeaderComponent(item)}
          />
        )}
      />

      <BottomSheetModalProvider>
        <Modal
          isVisible={isSectionModalVisible}
          onBackdropPress={hideAddSectionModal}
          onBackButtonPress={hideAddSectionModal}
          useNativeDriver>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              paddingBottom: 50,
            }}>
            <View style={[styles.modalContent, {backgroundColor: colors.surface}]}>
              <TextInput
                testID="section-name-input"
                style={styles.textInput}
                label="Section Name"
                value={newSectionName}
                onChangeText={setNewSectionName}
                error={isSectionNameInvalid}
                autoFocus
                right={
                  <TextInput.Icon
                    testID="section-name-send-button"
                    icon="send"
                    color={isSectionNameInvalid ? colors.error : colors.primary}
                    disabled={isSectionNameInvalid}
                    onPress={selectedSection ? handleUpdateSection : handleAddSection}
                  />
                }
              />
              {isSectionNameInvalid && (
                <HelperText type="error">
                  {newSectionName === ''
                    ? 'Section name must be 1-20 characters long without spaces'
                    : /\s/.test(newSectionName)
                      ? 'Section name cannot contain spaces.'
                      : newSectionName.length > 20
                        ? 'Section name must be 20 characters or fewer.'
                        : ''}
                </HelperText>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <AddTodoModal
          isVisible={isAddTodoModalVisible}
          setIsVisible={setIsAddTodoModalVisible}
          onBackdropPress={hideAddTodoModal}
          onSubmitEditing={handleSubmitEditing}
          sections={sections}
          propSelectedSection={selectedSection || undefined}
          propParentId={parentId}
        />

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
        <BottomSheetModal
          backdropComponent={backdropComponent}
          handleComponent={null}
          enableContentPanningGesture={false}
          ref={sortBottomSheetRef}
          index={1}
          snapPoints={snapPoints}
          stackBehavior={'push'}
          onDismiss={() => setShowFAB(true)}>
          <View style={[styles.contentContainer, {backgroundColor: colors.secondaryContainer}]}>
            <View style={styles.section}>
              <Text variant="titleMedium" style={{color: colors.onSurfaceVariant}}>
                Sort By
              </Text>
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
              <Text variant="titleMedium" style={{color: colors.onSurfaceVariant}}>
                Sort Direction
              </Text>
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
      </BottomSheetModalProvider>

      {showFAB && <AddTodoFAB onPress={showAddTodoModal} />}

      <AlertSnackbar
        visible={isAlertSnackbarVisible}
        message={alertMessage}
        onDismiss={hideAlertSnackbar}
      />
    </View>
  );
};

const width = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 4,
    alignItems: 'center',
  },
  searchbar: {
    marginHorizontal: 8,
  },
  searchContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  todoList: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    width,
  },
  centerContainer: {
    flex: 1,
    flexDirection: 'row',

    paddingVertical: 16,
    width: '100%',
  },
  headerContainer: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  textInput: {
    width: '100%',
    marginBottom: 16,
  },
  paginationStyleItem: {
    width: 10,
    height: 10,
  },
  section: {
    margin: 20,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  button: {
    margin: 5,
  },
  sortButton: {
    marginTop: 16,
  },
});

export default InboxScreen;
