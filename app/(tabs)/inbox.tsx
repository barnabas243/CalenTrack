import React, {useState, useMemo, useCallback, useRef, useEffect} from 'react';
import {View, StyleSheet, Dimensions, Alert, TouchableOpacity} from 'react-native';
import Modal from 'react-native-modal';
import {
  useTheme,
  TextInput,
  Button,
  HelperText,
  Appbar,
  Menu,
  Divider,
  Searchbar,
  Chip,
  Text,
} from 'react-native-paper';
import ToDoItem from '@/components/ToDoItem';
import AddTodoFAB from '@/components/addTodoFAB';
import DraggableFlatList, {RenderItemParams, ScaleDecorator} from 'react-native-draggable-flatlist';
import {router, useLocalSearchParams} from 'expo-router';
import SwiperFlatList from 'react-native-swiper-flatlist';
import {SwipeableItemImperativeRef} from 'react-native-swipeable-item';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useTodo} from '@/hooks/useTodo';
import {Section, SectionItem} from '@/store/section/types';
import {TodoItem} from '@/store/todo/types';
import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import EditTodoModal from '@/components/modals/EditTodoModal';
import EditTodoModalContent from '@/components/modals/EditTodoModalContent';
import {isEqual} from 'lodash';
import {useAuth} from '@/hooks/useAuth';
import AddTodoModal from '@/components/modals/addTodoModal';
import DraggableItemPlaceholder from '@/components/DraggableItemPlaceholder';

let count = 0;

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
  } = useTodo();

  console.log('InboxScreen rendered ', ++count);

  const [isLayoutReady, setLayoutReady] = useState(false);
  const {id} = useLocalSearchParams();

  const {user} = useAuth();

  const [newSectionName, setNewSectionName] = useState('');
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTabMenuVisible, setIsTabMenuVisible] = useState(false);
  const [groupedSections, setGroupedSections] = useState<Section[]>([]);

  const [isSectionModalVisible, setSectionModalVisible] = useState(false);
  const [isAddTodoModalVisible, setIsAddTodoModalVisible] = useState(false);
  const [showFAB, setShowFAB] = useState(true);

  const editBottomSheetRef = useRef<BottomSheetModal>(null);

  const sectionNameMap = useMemo(
    () => new Map(sections.map(sec => [sec.id, sec.name])),
    [sections],
  );

  const showAddTodoModal = useCallback(() => setIsAddTodoModalVisible(true), []);
  const hideAddTodoModal = useCallback(() => setIsAddTodoModalVisible(false), []);

  const memoizedGroupedSections = useMemo(() => {
    // Map of section IDs to section names
    const groupedSectionsData = todos.reduce((acc, item) => {
      const sectionId = item.section_id ?? 1;
      if (!acc.has(sectionId)) {
        acc.set(sectionId, []);
      }
      acc.get(sectionId)!.push(item);
      return acc;
    }, new Map<number, TodoItem[]>());

    // Create a list of updated sections with todos
    const updatedSections = Array.from(sectionNameMap.entries()).map(
      ([sectionId, sectionName]) => ({
        key: sectionId.toString(),
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
  }, [todos, sectionNameMap]);

  // Update state when memoizedGroupedSections changes
  useEffect(() => {
    setGroupedSections(memoizedGroupedSections);
  }, [memoizedGroupedSections]);

  const swiperRef = useRef<SwiperFlatList>(null);
  const itemRefs = useRef(new Map<string, SwipeableItemImperativeRef>());

  useEffect(() => {
    if (id && swiperRef.current && isLayoutReady) {
      swiperRef.current.scrollToIndex({index: parseInt(id, 10), animated: true});
    }
  }, [id, isLayoutReady]);

  const handleAddSection = useCallback(() => {
    const trimmedSectionName = newSectionName.trim();
    if (!trimmedSectionName) {
      return;
    }

    addNewSection({name: trimmedSectionName, user_id: user!.id}).catch(() => {
      Alert.alert('Error', 'Failed to add section');
    });

    setNewSectionName('');
    setSectionModalVisible(false);
  }, [newSectionName, addNewSection, user]);

  const handlePress = useCallback(
    (sectionId: number) => {
      const section = sections.find(sec => sec.id === sectionId);
      if (!section) return;

      setSelectedSection(section);
      setNewSectionName(section.name);
      setIsTabMenuVisible(true);
    },
    [sections],
  );

  const handleDeleteSection = useCallback(async () => {
    if (!selectedSection) {
      return;
    }

    if (selectedSection.id === 1) {
      return Alert.alert('Error', 'Cannot delete Inbox section');
    }

    try {
      await deleteExistingSection(selectedSection.id);
      setNewSectionName('');
      setSectionModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to delete section');
    }
  }, [selectedSection, deleteExistingSection]);

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
      const updatedSection = {...selectedSection, name: newSectionName};
      await updateExistingSection(updatedSection).catch(() =>
        console.log('Error updating section'),
      );
      setNewSectionName('');
      setSelectedSection(null);
      setSectionModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to update section');
    }
  }, [selectedSection, newSectionName, updateExistingSection]);

  const isSectionNameInvalid =
    !newSectionName ||
    newSectionName.trim() === '' ||
    newSectionName.length > 20 ||
    /\s/.test(newSectionName);

  const showAddSectionModal = useCallback(() => setSectionModalVisible(true), []);
  const hideAddSectionModal = useCallback(() => setSectionModalVisible(false), []);

  const handleEndDrag = useCallback(
    (data: TodoItem[], sectionName: string) => {
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

  const handleSubmitEditing = async (newTodo: TodoItem, selectedSection = 'Inbox') => {
    if (!newTodo) return;

    try {
      if (selectedSection !== 'Inbox' && !newTodo.section_id) {
        // Create a new section if it doesn't exist
        const newSection = {name: selectedSection, user_id: user!.id};

        // Assuming addNewSection returns the created section or an identifier
        const result = await addNewSection(newSection);
        console.log('addNewSection result:', result);
        if (!result || !result.id) {
          Alert.alert('Error', 'Failed to create new section');
          return;
        }

        // Add section ID to newTodo and then add the todo
        const updatedTodo = {...newTodo, section_id: result.id};
        const todoResult = await addNewTodo(updatedTodo);

        if (!todoResult) {
          Alert.alert('Error', 'Failed to add new todo');
          return;
        }
        swiperRef.current?.scrollToIndex({index: groupedSections.length - 2});
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

  const onChangeIndex = (item: {index: number; prevIndex: number}) => {
    const {index, prevIndex} = item;
    if (index !== prevIndex) {
      console.log('index', index); // Debug log
      if (index === groupedSections.length - 1) {
        setShowFAB(false);
      } else {
        setShowFAB(true);
      }
    }
  };

  const toggleCompleteTodo = (id: string) => {
    const todo = todos.find(todo => todo.id === id);
    if (todo) {
      updateExistingTodos([
        {
          ...todo,
          completed: !todo.completed,
          completed_at: todo.completed ? null : new Date().toISOString(),
        },
      ]);
    }
  };

  const openEditBottomSheet = (item: TodoItem) => {
    console.log('openEditBottomSheet', item);
    if (editBottomSheetRef.current) {
      editBottomSheetRef.current.present(item);
    }
  };

  const deleteTodo = (id: string) => {
    deleteExistingTodos([id]);
  };

  const renderTodoItem = (params: RenderItemParams<TodoItem>) => (
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

  const handleLayout = () => {
    setLayoutReady(true);
  };

  const handleEditModalDismiss = async (selectedTodo: TodoItem, updatedTodo: TodoItem) => {
    if (!isEqual(updatedTodo, selectedTodo)) {
      updateExistingTodos([updatedTodo]);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]} onLayout={handleLayout}>
      <Appbar.Header>
        <Appbar.Content title="Inbox" />
        {isSearchVisible ? (
          <Searchbar
            placeholder="Search"
            onChangeText={setSearchQuery}
            value={searchQuery}
            onIconPress={() => setIsSearchVisible(false)}
            style={styles.searchbar}
            onBlur={() => setIsSearchVisible(false)}
            blurOnSubmit
            autoFocus
          />
        ) : (
          <View style={styles.searchContainer}>
            <Chip icon="magnify" onPress={() => setIsSearchVisible(true)}>
              {searchQuery}
            </Chip>
          </View>
        )}
        <Menu
          anchorPosition="bottom"
          visible={isMenuVisible}
          onDismiss={() => setIsMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              color={colors.onSurface}
              onPress={() => setIsMenuVisible(true)}
            />
          }>
          <Menu.Item onPress={() => {}} title="Sort" />
          <Menu.Item onPress={() => {}} title="Select tasks" />
          <Divider />
          <Menu.Item onPress={() => {}} title="Activity log" />
          <Divider />
          <Menu.Item
            onPress={() => {
              setIsMenuVisible(false);
              router.push('/_feature-feedback');
            }}
            title="CalenTrack Feedback"
          />
        </Menu>
      </Appbar.Header>
      <SwiperFlatList
        ref={swiperRef}
        data={groupedSections}
        initialNumToRender={1}
        onChangeIndex={onChangeIndex}
        showsVerticalScrollIndicator={false}
        centerContent
        renderItem={({item}) => (
          <DraggableFlatList
            data={item.data}
            showsVerticalScrollIndicator={false}
            renderItem={renderTodoItem}
            keyExtractor={task => task.id!.toString()}
            onDragEnd={({data}) => handleEndDrag(data, item.name)}
            initialNumToRender={8}
            activationDistance={20}
            stickyHeaderIndices={[0]}
            containerStyle={[styles.todoList, {backgroundColor: colors.background}]}
            renderPlaceholder={() => <DraggableItemPlaceholder />}
            ListEmptyComponent={() =>
              item.key === 'new_section' ? (
                <View style={styles.centerContainer}>
                  <Button mode="contained-tonal" icon={'plus'} onPress={showAddSectionModal}>
                    Create New Section
                  </Button>
                </View>
              ) : (
                <View style={styles.centerContainer}>
                  <Text variant="labelMedium">You have not added any task to the section</Text>
                </View>
              )
            }
            ListHeaderComponent={() => (
              <>
                <View style={[styles.headerContainer, {backgroundColor: colors.background}]}>
                  <TouchableOpacity onPress={() => handlePress(Number(item.key))}>
                    <Text variant="titleMedium" style={{color: colors.primary}}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                  <Menu
                    visible={isTabMenuVisible}
                    onDismiss={() => setIsTabMenuVisible(false)}
                    anchorPosition="top"
                    anchor={
                      <MaterialCommunityIcons
                        name="dots-vertical"
                        color={colors.onSurface}
                        size={16}
                        onPress={() => {
                          handlePress(Number(item.key));
                        }}
                      />
                    }>
                    <Menu.Item onPress={displayDeleteSectionAlert} title="Delete" />
                    <Menu.Item onPress={handleUpdateSection} title="Rename" />
                  </Menu>
                </View>
              </>
            )}
          />
        )}
      />

      <Modal
        isVisible={isSectionModalVisible}
        onBackdropPress={hideAddSectionModal}
        onBackButtonPress={hideAddSectionModal}
        useNativeDriver>
        <View style={[styles.modalContent, {backgroundColor: colors.surface}]}>
          <TextInput
            style={styles.textInput}
            label="Section Name"
            value={newSectionName}
            onChangeText={setNewSectionName}
            error={isSectionNameInvalid}
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
          <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
            <Button onPress={hideAddSectionModal}>Cancel</Button>
            <Button onPress={handleAddSection} disabled={isSectionNameInvalid}>
              Add Section
            </Button>
          </View>
        </View>
      </Modal>

      <BottomSheetModalProvider>
        <AddTodoModal
          isVisible={isAddTodoModalVisible}
          setIsVisible={setIsAddTodoModalVisible}
          onBackdropPress={hideAddTodoModal}
          onSubmitEditing={handleSubmitEditing}
          sections={sections}
        />
        <EditTodoModal ref={editBottomSheetRef} onDismiss={() => console.log('dismissed modal')}>
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

      {showFAB && <AddTodoFAB onPress={showAddTodoModal} />}
    </View>
  );
};

const width = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: 'flex-end',
  },
  todoList: {
    padding: 16,
    justifyContent: 'center',
    width,
  },
  centerContainer: {
    paddingHorizontal: 16,
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
});

export default InboxScreen;
