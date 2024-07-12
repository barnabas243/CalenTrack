import React from 'react';
import {Text, Button, SectionList, StyleSheet, SafeAreaView, StatusBar} from 'react-native';
import {useTodo} from '@/contexts/TodoContext';
import {TodoItem} from '@/contexts/TodoContext.types'; // Assuming TodoItem interface is imported

import ToDoItem from '@/components/ToDoItem';

const HomeScreen = () => {
  const {overdueTodos, todayTodos, completedTodos, setShowInputModal} = useTodo();

  const renderTodoItem = ({item}: {item: TodoItem}) => <ToDoItem todo={item} />;

  const renderSectionHeader = ({section: {title}}: {section: {title: string}}) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const sections = [
    {title: 'Overdue Todos', data: overdueTodos},
    {title: "Today's Todos", data: todayTodos},
    {title: 'Completed Todos', data: completedTodos},
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderTodoItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={<Text>No todos found</Text>}
      />
      <Button title="Add Todo" onPress={() => setShowInputModal(true)} />
    </SafeAreaView>
  );
};

const statusBarHeight = StatusBar.currentHeight || 0;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: statusBarHeight,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
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
});

export default HomeScreen;
