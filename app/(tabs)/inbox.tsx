import React, {useMemo, useState} from 'react';
import {View, StyleSheet, FlatList, ListRenderItem, Dimensions, Alert} from 'react-native';
import Modal from 'react-native-modal';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {useTheme, TextInput, Button, HelperText} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {SectionItem, TodoItem} from '@/contexts/TodoContext.types';
import ToDoItem from '@/components/ToDoItem';
import AddTodoFAB from '@/components/addTodoFAB';
import {useTodo} from '@/contexts/TodoContext';

// Define the Tab Navigator
const Tab = createMaterialTopTabNavigator();

interface SectionScreenProps {
  sectionData: TodoItem[];
}

const SectionScreen = ({sectionData}: SectionScreenProps) => {
  const renderItem: ListRenderItem<TodoItem> = ({item}) => <ToDoItem todo={item} />;

  return (
    <FlatList
      data={sectionData}
      renderItem={renderItem}
      keyExtractor={item => item.id?.toString() || ''}
    />
  );
};

interface AddSectionScreenProps {
  onAddSection: () => void;
}

const AddSectionScreen = ({onAddSection}: AddSectionScreenProps) => (
  <View style={styles.addSection}>
    <Button onPress={onAddSection}>+ Add Section</Button>
  </View>
);

const InboxScreen = () => {
  const {colors} = useTheme();
  const {todos, sections, addSection, updateSectionName, deleteSection} = useTodo();

  const [isSectionModalVisible, setSectionModalVisible] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [showFAB, setShowFAB] = useState(true); // State to control FAB visibility

  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(null);

  const groupedSections = useMemo(() => {
    const grouped = todos.reduce(
      (acc, item) => {
        const sectionId = item.section_id ?? 0;
        if (!acc[sectionId]) {
          acc[sectionId] = [];
        }
        acc[sectionId].push(item);
        return acc;
      },
      {} as Record<number, TodoItem[]>,
    );

    return Object.keys(grouped).map(sectionId => {
      const id = Number(sectionId);
      return {
        key: id.toString(),
        name: sections.find(sec => sec.id === id)?.name || 'Inbox',
        data: grouped[id],
      };
    });
  }, [todos, sections]);

  const handleAddSection = async () => {
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

    // Navigate to the newly created section
  };

  const handleLongPress = (sectionId: number) => {
    const section = sections.find(sec => sec.id === sectionId);
    if (!section) return;

    setSelectedSection(section);
    setNewSectionName(section.name);
    setSectionModalVisible(true);
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

  const isSectionNameInvalid = !newSectionName || newSectionName.length === 20;

  const showAddSectionModal = () => setSectionModalVisible(true);
  const hideAddSectionModal = () => setSectionModalVisible(false);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Tab.Navigator
          screenOptions={{tabBarScrollEnabled: true}}
          screenListeners={{
            state: e => {
              const isAddSectionTab = e.data.state.index === sections.length; // Index for "+ Add Section" tab
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
          {sections.map(section => {
            const sectionData =
              groupedSections.find(sec => sec.key === section.id.toString())?.data || [];

            return (
              <Tab.Screen
                key={section.id}
                name={section.id.toString()}
                options={{title: section.name}}>
                {() => <SectionScreen sectionData={sectionData} />}
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
              {!newSectionName
                ? 'Section name is required'
                : 'Section name is limited to 20 characters'}
            </HelperText>
            <View style={styles.buttonContainer}>
              <Button mode="text" onPress={hideAddSectionModal} style={styles.cancelButton}>
                Cancel
              </Button>
              {selectedSection ? (
                <>
                  <Button
                    mode="text"
                    onPress={handleDeleteSection}
                    buttonColor={colors.errorContainer}>
                    Delete
                  </Button>
                  <Button mode="contained" onPress={handleUpdateSection}>
                    Update
                  </Button>
                </>
              ) : (
                <Button mode="contained" onPress={handleAddSection}>
                  Add Section
                </Button>
              )}
            </View>
          </View>
        </Modal>
        {showFAB && <AddTodoFAB />}
      </SafeAreaView>
    </>
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
    marginTop: 20,
  },
  cancelButton: {
    marginRight: 10,
  },
});

export default InboxScreen;
