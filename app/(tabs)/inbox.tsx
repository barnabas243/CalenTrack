import React, {useState, useMemo, useEffect} from 'react';
import {View, StyleSheet, Dimensions, Alert} from 'react-native';
import Modal from 'react-native-modal';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
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
} from 'react-native-paper';
import {SectionItem, TodoItem} from '@/contexts/TodoContext.types';
import ToDoItem from '@/components/ToDoItem';
import AddTodoFAB from '@/components/addTodoFAB';
import {useTodo} from '@/contexts/TodoContext';
import DraggableFlatList, {RenderItemParams} from 'react-native-draggable-flatlist';
import {router} from 'expo-router';

const Tab = createMaterialTopTabNavigator();

interface SectionScreenProps {
  sectionData: TodoItem[];
  name: string;
}

const SectionScreen = ({sectionData, name}: SectionScreenProps) => {
  const {colors} = useTheme();
  const {handleEndDrag} = useTodo();

  const renderTodoItem = (params: RenderItemParams<TodoItem>) => (
    <ToDoItem {...params} colors={colors} enableSwipe={false} />
  );

  return (
    <DraggableFlatList
      data={sectionData}
      onDragEnd={({data}) => handleEndDrag(data, name)}
      keyExtractor={item => item.id?.toString() || ''}
      renderItem={renderTodoItem}
      showsVerticalScrollIndicator={false}
      containerStyle={{flex: 1, backgroundColor: colors.background}}
      scrollEnabled={true} // Ensure scrolling is enabled
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
  );
};

interface AddSectionScreenProps {
  onAddSection: () => void;
}

const InboxScreen = () => {
  const {colors} = useTheme();
  const {groupedSections, sections, addSection, updateSectionName, deleteSection} = useTodo();

  const [isSectionModalVisible, setSectionModalVisible] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [showFAB, setShowFAB] = useState(true);
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isTabMenuVisible, setIsTabMenuVisible] = useState(false);
  const openTabMenu = () => setIsTabMenuVisible(true);
  const closeTabMenu = () => setIsTabMenuVisible(false);

  const showMenu = () => setIsMenuVisible(true);
  const closeMenu = () => setIsMenuVisible(false);
  const showSearch = () => setIsSearchVisible(true);
  const hideSearch = () => setIsSearchVisible(false);

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const handleOrientationChange = () => {
      setDimensions(Dimensions.get('window'));
    };

    const subscription = Dimensions.addEventListener('change', handleOrientationChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const AddSectionScreen = ({onAddSection}: AddSectionScreenProps) => (
    <View style={[styles.addSection, {backgroundColor: colors.background}]}>
      <Button onPress={onAddSection}>+ Add Section</Button>
    </View>
  );

  const handleAddSection = () => {
    const trimmedSectionName = newSectionName.trim();
    if (!trimmedSectionName) {
      return;
    }

    const isAddedSuccessfully = addSection(trimmedSectionName);
    if (!isAddedSuccessfully) {
      return Alert.alert('Error', 'Failed to add section');
    }

    setNewSectionName('');
    setSectionModalVisible(false);
  };

  const handleLongPress = (sectionId: number) => {
    const section = sections.find(sec => sec.id === sectionId);
    if (!section) return;

    setSelectedSection(section);
    setNewSectionName(section.name);

    openTabMenu();
  };

  const displayDeleteSectionAlert = () => {
    Alert.alert('Delete Section', 'Are you sure you want to delete this section?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', onPress: handleDeleteSection, style: 'destructive'},
    ]);
  };
  const handleDeleteSection = async () => {
    if (!selectedSection) {
      return;
    }

    if (selectedSection.id === 1) {
      return Alert.alert('Error', 'Cannot delete Inbox section');
    }

    const isDeletedSuccessfully = await deleteSection(selectedSection.id);
    if (!isDeletedSuccessfully) return Alert.alert('Error', 'Failed to delete section');
    setNewSectionName('');
    setSectionModalVisible(false);
  };

  const handleUpdateSection = async () => {
    if (!selectedSection || !newSectionName) {
      return;
    }

    const isUpdatedSuccessfully = await updateSectionName({
      ...selectedSection,
      name: newSectionName,
    });

    if (!isUpdatedSuccessfully) return Alert.alert('Error', 'Failed to update section');
    setNewSectionName('');
    setSelectedSection(null);
    setSectionModalVisible(false);
  };

  const isSectionNameInvalid =
    !newSectionName ||
    newSectionName.trim() === '' ||
    newSectionName.length > 20 ||
    /\s/.test(newSectionName);

  const showAddSectionModal = () => setSectionModalVisible(true);
  const hideAddSectionModal = () => setSectionModalVisible(false);

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;
    return sections.filter(section =>
      section.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, sections]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Appbar.Header>
        <Appbar.Content title="Inbox" />
        {isSearchVisible ? (
          <Searchbar
            placeholder="Search"
            onChangeText={setSearchQuery}
            value={searchQuery}
            onIconPress={hideSearch}
            style={styles.searchbar}
          />
        ) : (
          <View style={styles.searchContainer}>
            <Chip icon="magnify" onPress={showSearch}>
              {searchQuery}
            </Chip>
          </View>
        )}
        <Menu
          anchorPosition="bottom"
          visible={isMenuVisible}
          onDismiss={closeMenu}
          anchor={
            <Appbar.Action icon="dots-vertical" color={colors.onSurface} onPress={showMenu} />
          }>
          <Menu.Item onPress={() => {}} title="Sort" />
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

        <Menu
          anchorPosition="bottom"
          visible={isTabMenuVisible}
          onDismiss={closeTabMenu}
          anchor={{x: dimensions.width / 2, y: dimensions.height / 5}}>
          <Menu.Item
            onPress={() => {
              closeTabMenu();
              showAddSectionModal();
            }}
            title="edit name"
          />
          <Menu.Item
            onPress={() => {
              closeTabMenu();
              displayDeleteSectionAlert();
            }}
            title="delete section"
          />
        </Menu>
      </Appbar.Header>
      <Tab.Navigator
        onLayout={e => console.log(e)}
        screenOptions={{
          tabBarScrollEnabled: true,
          tabBarIndicatorContainerStyle: {backgroundColor: colors.background},
          tabBarIndicatorStyle: {backgroundColor: colors.primary},
          tabBarLabelStyle: {color: colors.onBackground},
        }}
        screenListeners={{
          state: e => {
            const isAddSectionTab = e.data.state.index === filteredSections.length;
            setShowFAB(!isAddSectionTab);
          },
          tabLongPress: e => {
            if (!e.target) return;
            const sectionId = parseInt(e.target?.split('-')[0]);
            if (!sectionId || sectionId === 1) return;

            handleLongPress(sectionId);
          },
        }}
        initialLayout={{
          width: Dimensions.get('window').width,
        }}
        initialRouteName="Inbox">
        {filteredSections.map(section => {
          const sectionData =
            groupedSections.find(sec => sec.key === section.id.toString())?.data || [];

          return (
            <Tab.Screen
              key={section.id}
              name={section.id.toString()}
              options={{title: section.name}}>
              {() => <SectionScreen sectionData={sectionData} name={section.name} />}
            </Tab.Screen>
          );
        })}
        <Tab.Screen name={'-1'} options={{title: '+ Add Section'}}>
          {() => <AddSectionScreen onAddSection={showAddSectionModal} />}
        </Tab.Screen>
      </Tab.Navigator>
      <Modal
        isVisible={isSectionModalVisible}
        onDismiss={hideAddSectionModal}
        onBackdropPress={hideAddSectionModal}>
        <View style={[styles.modalContent, {backgroundColor: colors.background}]}>
          <TextInput
            mode="flat"
            style={styles.input}
            placeholder="Enter section name"
            value={newSectionName}
            onChangeText={setNewSectionName}
            autoFocus
            maxLength={20}
          />
          <HelperText type="error" visible={isSectionNameInvalid}>
            {newSectionName === ''
              ? 'Section name cannot be empty.'
              : /\s/.test(newSectionName)
                ? 'Section name cannot contain spaces.'
                : newSectionName.length > 20
                  ? 'Section name must be 20 characters or fewer.'
                  : ''}
          </HelperText>
          <View style={styles.buttonContainer}>
            <Button mode="text" onPress={hideAddSectionModal} style={styles.cancelButton}>
              Cancel
            </Button>
            {selectedSection ? (
              <Button
                mode="contained"
                onPress={handleUpdateSection}
                disabled={isSectionNameInvalid}>
                Update
              </Button>
            ) : (
              <Button mode="contained" onPress={handleAddSection} disabled={isSectionNameInvalid}>
                Add Section
              </Button>
            )}
          </View>
        </View>
      </Modal>
      {showFAB && <AddTodoFAB />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
  },
  input: {
    marginBottom: 10,
    paddingLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  searchbar: {
    width: '100%',
  },
});

export default InboxScreen;
