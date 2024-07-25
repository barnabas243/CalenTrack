import React from 'react';
import {SectionList, StyleSheet, SafeAreaView} from 'react-native';
import {useTodo} from '@/contexts/TodoContext';
import {TodoItem} from '@/contexts/TodoContext.types'; // Assuming TodoItem interface is imported
import {Text, ActivityIndicator} from 'react-native-paper';
import ToDoItem from '@/components/ToDoItem';
import {StatusBar} from 'expo-status-bar';
import {useUser} from '@/contexts/UserContext';
import AddTodoFAB from '@/components/addTodoFAB';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

const HomeScreen = () => {
  const {isLoading} = useUser();
  const {overdueTodos, todayTodos, completedTodos} = useTodo();

  const renderTodoItem = ({item}: {item: TodoItem}) => <ToDoItem todo={item} />;

  const renderSectionHeader = ({section: {title}}: {section: {title: string}}) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const sections = [
    {title: 'Overdue Todos', data: overdueTodos},
    {title: "Today's Todos", data: todayTodos},
    {title: 'Completed Todos', data: completedTodos},
  ];

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderTodoItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={<Text>No todos found</Text>}
      />
      <AddTodoFAB />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
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
