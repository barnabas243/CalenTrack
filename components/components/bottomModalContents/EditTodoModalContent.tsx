import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TextInput} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {PriorityType, TodoItem} from '@/contexts/TodoContext.types';

const EditTodoModalContent = ({...props}) => {
  const {selectedTodo, onBlur} = props;

  const [newTodo, setNewTodo] = useState<TodoItem>(selectedTodo as TodoItem);

  const handleBlur = () => {
    onBlur(newTodo);
  };

  useEffect(() => {
    if (selectedTodo) {
      setNewTodo(selectedTodo);
    }
  }, [selectedTodo]);

  const handleTitleChange = (title: string) => {
    setNewTodo((prevTodo: TodoItem) => ({
      ...prevTodo,
      title,
    }));
  };

  const handleSummaryChange = (summary: string) => {
    setNewTodo((prevTodo: TodoItem) => ({
      ...prevTodo,
      summary,
    }));
  };

  const handlePriorityChange = (priority: PriorityType) => {
    setNewTodo((prevTodo: TodoItem) => ({
      ...prevTodo,
      priority,
    }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={newTodo.title}
        onChangeText={handleTitleChange}
        onBlur={handleBlur} // Call updateTodo when title input loses focus
      />

      <Text style={styles.label}>Summary</Text>
      <TextInput
        style={styles.input}
        value={newTodo.summary}
        onChangeText={handleSummaryChange}
        onBlur={handleBlur} // Call updateTodo when summary input loses focus
      />

      <Text style={styles.label}>Priority</Text>
      <Picker
        selectedValue={newTodo.priority as PriorityType}
        onValueChange={handlePriorityChange}
        onBlur={handleBlur}
        style={styles.picker}>
        <Picker.Item label="Priority 4" value="4" />
        <Picker.Item label="Priority 3" value="3" />
        <Picker.Item label="Priority 2" value="2" />
        <Picker.Item label="Priority 1" value="1" />
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    minHeight: 40,
  },
  picker: {
    height: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
});

export default EditTodoModalContent;
