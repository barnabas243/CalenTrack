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
import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import EditTodoModal from '@/components/modals/EditTodoModal';
import EditTodoModalContent from '@/components/modals/EditTodoModalContent';
import {isEqual} from 'lodash';
import {useAuth} from '@/hooks/useAuth';
import AddTodoModal from '@/components/modals/addTodoModal';
import DraggableItemPlaceholder from '@/components/DraggableItemPlaceholder';
import {AutoCompleteDropDown} from '@/components/AutoCompleteDropDown';
import {AutocompleteDropdownItem} from 'react-native-autocomplete-dropdown';
import {Todo, Section} from '@/powersync/AppSchema';
import ToDoItem from '@/components/ToDoItem';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {FadeInLeft, FadeOutLeft} from 'react-native-reanimated';
import AlertSnackbar from '@/components/AlertSnackbar';

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

  const [isLayoutReady, setLayoutReady] = useState(false);

  const {id} = useLocalSearchParams();

  const {user} = useAuth();

  const [groupedSections, setGroupedSections] = useState<SectionWithTodos[]>([]);

  const [newSectionName, setNewSectionName] = useState('');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

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

  const memoizedGroupedSections = useMemo(() => {
    // Map of section IDs to section names
    console.log('Memoizing grouped sections');
    const groupedSectionsData = todos.reduce((acc, item) => {
      const sectionId = item.section_id ?? '568c6c1d-9441-4cbc-9fc5-23c98fee1d3d';
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
  }, [todos, sectionNameMap]);

  // Update state when memoizedGroupedSections changes
  useEffect(() => {
    console.log('Updating grouped sections');
    setGroupedSections(memoizedGroupedSections);
  }, [memoizedGroupedSections]);

  useEffect(() => {
    if (id && swiperRef.current && isLayoutReady) {
      swiperRef.current.scrollToIndex({index: parseInt(id as string, 10), animated: true});
    }
  }, [id, isLayoutReady]);

  const handleAddSection = useCallback(() => {
    const trimmedSectionName = newSectionName.trim();
    if (!trimmedSectionName) {
      return;
    }

    addNewSection({name: trimmedSectionName, user_id: user!.id}).catch(() => {
      showAlertSnackbar('Failed to add section');
      // Alert.alert('Error', 'Failed to add section');
    });

    setNewSectionName('');
    setSectionModalVisible(false);
  }, [newSectionName, addNewSection, user]);

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
      // return Alert.alert('Error', 'Cannot delete Inbox section');
    }

    try {
      const isDeleted = await deleteExistingSection(selectedSection.id);
      if (!isDeleted) {
        showAlertSnackbar('Failed to delete section');
        // return Alert.alert('Error', 'Failed to delete section');
      }
      setNewSectionName('');
      setSectionModalVisible(false);
    } catch {
      showAlertSnackbar('Failed to delete section');
      // Alert.alert('Error', 'Failed to delete section');
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
      const data = await updateExistingSection(updatedSection).catch(() =>
        console.error('Error updating section'),
      );
      if (data) {
        setNewSectionName('');
        setSelectedSection(null);
        setSectionModalVisible(false);

        showAlertSnackbar('Section updated successfully');
      }
    } catch {
      showAlertSnackbar('Failed to update section');
      // Alert.alert('Error', 'Failed to update section');
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
          showAlertSnackbar('Failed to create new section');
          // Alert.alert('Error', 'Failed to create new section');
          return;
        }

        // Add section ID to newTodo and then add the todo
        const updatedTodo = {...newTodo, section_id: result.id};
        const todoResult = await addNewTodo(updatedTodo);

        if (!todoResult) {
          showAlertSnackbar('Failed to add new todo');
          // Alert.alert('Error', 'Failed to add new todo');
        }
      } else {
        // If section_id is present or selectedSection is 'Inbox', directly add the todo
        const todoResult = await addNewTodo(newTodo);

        if (!todoResult) {
          showAlertSnackbar('Failed to add new todo');
          // Alert.alert('Error', 'Failed to add new todo');
        } else {
          // Alert user that the todo has been added
          showAlertSnackbar('Todo added successfully');
        }
      }
    } catch (error) {
      console.error('An error occurred while handling submit editing:', error);
      showAlertSnackbar('An unexpected error occurred');
      // Alert.alert('Error', 'An unexpected error occurred');
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

  const toggleCompleteTodo = (id: string) => {
    const todo = todos.find(todo => todo.id === id);
    if (todo) {
      updateExistingTodos({
        ...todo,
        completed: todo.completed === 1 ? 0 : 1,
        completed_at: todo.completed === 1 ? null : new Date().toISOString(),
      })
        .then(result => {
          if (result) showAlertSnackbar('Todo updated successfully');
        })
        .catch(error => {
          showAlertSnackbar(`Failed to update todo: ${error.message}`);
        });
    }
  };

  const openEditBottomSheet = (item: Todo) => {
    if (editBottomSheetRef.current) {
      editBottomSheetRef.current.present(item);
    }
  };

  const deleteTodo = async (id: string) => {
    await deleteExistingTodos(id)
      .then(result => {
        if (result) showAlertSnackbar('Todo deleted successfully');
      })
      .catch(error => {
        showAlertSnackbar(`Failed to delete todo: ${error.message}`);
      });
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
      await updateExistingTodos(updatedTodo)
        .then(result => {
          if (result) showAlertSnackbar('Todo updated successfully');
        })
        .catch(error => {
          showAlertSnackbar(`Failed to update todo: ${error.message}`);
        });
    }
  };
  const onDismiss = () => {
    console.log('EditTodoModal dismissed');
  };

  const renderPlaceholder = () => <DraggableItemPlaceholder />;
  const renderEmptyComponent = (item: SectionWithTodos) =>
    item.key === 'new_section' ? (
      <View style={styles.centerContainer}>
        <Button mode="contained-tonal" icon={'plus'} onPress={showAddSectionModal}>
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
  const handleSelectItem = (item: AutocompleteDropdownItem | null) => {
    if (!item) {
      return;
    }
    // Split the id by space
    const idParts = item.id.split(' ');
    const isTodoItem = idParts.length > 1;
    // If the idParts has more than one element, the item id is the last element
    const sectionId = idParts[0];
    const sectionIndex = findSectionIndexById(sectionId);

    swiperRef.current?.scrollToIndex({index: sectionIndex, animated: true});

    if (isTodoItem) {
      const itemId = idParts[1];
      const flatListRef = draggableListRefs.current.get(sectionId.toString());

      if (flatListRef && flatListRef.props.data) {
        const index = Array.from(flatListRef.props.data).findIndex(todo => todo.id === itemId);
        if (index !== -1) {
          flatListRef.scrollToIndex({index, animated: true, viewPosition: 0.1});
        }
      }
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]} onLayout={handleLayout}>
      <Appbar.Header mode="small" elevated>
        <Appbar.Content title="Inbox" style={{flex: 1}} titleStyle={{margin: 0, padding: 0}} />
        <View style={styles.searchContainer}>
          <AutoCompleteDropDown data={autoCompleteItems} onSelectItem={handleSelectItem} />
        </View>
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
        keyExtractor={item => item.key}
        data={groupedSections}
        showPagination
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
            itemEnteringAnimation={FadeInLeft}
            itemExitingAnimation={FadeOutLeft}
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
                style={styles.textInput}
                label="Section Name"
                value={newSectionName}
                onChangeText={setNewSectionName}
                error={isSectionNameInvalid}
                autoFocus
                right={
                  <TextInput.Icon
                    icon={isSectionNameInvalid ? 'arrow-right-bold' : 'arrow-right-bold-circle'}
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
        />

        <EditTodoModal ref={editBottomSheetRef} onDismiss={onDismiss}>
          {data => (
            <EditTodoModalContent
              todo={data.data}
              onDismiss={handleEditModalDismiss}
              sections={sections}
              colors={colors}
              deleteTodo={deleteTodo}
            />
          )}
        </EditTodoModal>
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
});

export default InboxScreen;
