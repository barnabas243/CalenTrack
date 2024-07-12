import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import CheckBox from 'expo-checkbox';
import {useTodo} from '@/contexts/TodoContext';
import {PriorityType, TodoItem} from '@/contexts/TodoContext.types';

const ToDoItem = ({...props}) => {
  const {todo} = props;
  const [toggleCheckBox, setToggleCheckBox] = useState(false);

  const {toggleCompleteTodo, openEditBottomSheet} = useTodo();
  const {title, priority, id, completed} = todo;

  useEffect(() => {
    // Update the toggleCheckBox state based on the completed prop
    setToggleCheckBox(completed);
  }, [completed]);

  const toggleComplete = (id: number) => {
    console.log('Toggling complete for todo:', id);
    toggleCompleteTodo(id); // Assuming toggleCompleteTodo is an async function
    console.log('Toggled complete for todo:', id);
  };

  const getBorderColor = (priority: PriorityType) => {
    switch (priority) {
      case '1':
        return 'red'; // Highest priority
      case '2':
        return 'orange'; // Second-highest priority
      case '3':
        return 'green'; // Third-highest priority
      default:
        return '#CCCCCC'; // Default color for the lowest priority
    }
  };

  const openEditTodoModal = (todo: TodoItem) => {
    openEditBottomSheet(todo);
  };

  return (
    <TouchableOpacity key={`todo-${id}`} onPress={() => openEditTodoModal(props.todo)}>
      <View style={[styles.container, {borderColor: getBorderColor(priority)}]}>
        <CheckBox
          disabled={false}
          value={toggleCheckBox}
          onValueChange={() => toggleComplete(id)}
          style={{borderColor: getBorderColor(priority)}} // Set the border color for the checkbox
          color={toggleCheckBox ? '#CCCCCC' : undefined}
        />
        <Text style={[styles.title, {color: toggleCheckBox ? '#AAA' : undefined}]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    padding: 12,
    borderWidth: 1, // Set the border width
    borderRadius: 5, // Set the border radius if needed
  },
  title: {
    marginLeft: 10,
  },
});

export default ToDoItem;
