import React, {createContext, useState, useEffect, useContext, useRef, useMemo} from 'react';
import {Keyboard, StyleSheet} from 'react-native';
import {supabase} from '@/utils/supabase';
import {PostgrestError} from '@supabase/supabase-js';

import {SectionItem, TodoContextType, TodoItem, ToDoProviderProps} from './TodoContext.types';

import dayjs from 'dayjs';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import bottomSheetModal from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetModal';
import EditTodoModalContent from '@/components/bottomModalContents/EditTodoModalContent';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import AddTodoModal from '@/components/modals/addTodoModal';
import {useUser} from './UserContext';

const TodoContext = createContext<TodoContextType>({
  todos: [],
  sections: [],
  addTodo: () => {},
  deleteTodo: () => {},
  updateTodo: () => {},
  toggleCompleteTodo: () => {},
  openEditBottomSheet: () => {},
  closeEditBottomSheet: () => {},
  overdueTodos: [],
  todayTodos: [],
  completedTodos: [],
  selectedTodo: null,
  setSelectedTodo: () => {},
  setShowInputModal: () => {},
});
// Custom hook to consume the UserContext
export const useTodo = () => useContext(TodoContext);

export const TodoProvider = ({children}: ToDoProviderProps) => {
  const {user} = useUser();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);

  const todoBottomSheetRef = useRef<bottomSheetModal>(null);

  const [showInputModal, setShowInputModal] = useState(false);

  const snapPoints = useMemo(() => ['50%', '75%'], []);

  useEffect(() => {
    const fetchTodos = async () => {
      if (!user) return;

      const {data, error} = await supabase.from('todos').select('*').eq('created_by', user!.id);
      if (error) {
        console.error('Error fetching todos:', error.message);
      } else {
        const todos: TodoItem[] = data ?? [];
        setTodos(todos);
      }
    };
    const fetchSections = async () => {
      if (!user) return;

      const {data, error} = await supabase
        .from('sections')
        .select('id, name')
        .eq('owner_id', user!.id);
      if (error) {
        console.error('Error fetching sections:', error.message);
      } else {
        const sections: SectionItem[] = data ?? [];
        setSections(sections);
      }
    };

    fetchTodos();
    fetchSections();
  }, [user]);

  useEffect(() => {
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setShowInputModal(false);
    });

    return () => {
      hideSubscription.remove();
    };
  }, []);

  const addTodo = async (newTodo: TodoItem) => {
    const {data, error} = await supabase.from('todos').insert(newTodo).select();
    console.log(data);
    if (error) {
      console.error('Error adding todo:', error.message);
    } else {
      if (data) {
        setTodos([...todos, data[0]]);
      }
    }
  };

  const deleteTodo = async (id: number) => {
    const {error} = await supabase.from('todos').delete().match({id});
    if (error) {
      console.error('Error deleting todo:', error.message);
    } else {
      setTodos(todos.filter(todo => todo.id !== id));
    }
  };

  const updateTodo = async (updatedTodo: TodoItem) => {
    const {error} = await supabase.from('todos').update(updatedTodo).match({id: updatedTodo.id});
    if (error) {
      console.error('Error updating todo:', error.message);
    } else {
      setTodos(todos.map(todo => (todo.id === updatedTodo.id ? updatedTodo : todo)));
    }
  };

  const toggleCompleteTodo = async (todoId: number) => {
    try {
      // Find the todo item to toggle completion
      const todoToUpdate = todos.find(todo => todo.id === todoId);
      if (!todoToUpdate) {
        throw new Error('Todo item not found');
      }

      // Determine the new completed state
      const newCompletedState = !todoToUpdate.completed;

      // Update the todo item in the database
      const {data, error} = await supabase
        .from('todos')
        .update({completed: newCompletedState})
        .match({id: todoId})
        .select('id, completed');

      if (error) {
        throw error;
      }

      // Update the local state (todos) to reflect the change
      if (data) {
        setTodos(
          todos.map(todo => (todo.id === todoId ? {...todo, completed: newCompletedState} : todo)),
        );
      }
    } catch (error) {
      if (isPostgrestError(error))
        console.log('toggleCompleteTodo PostgrestError :', error.message);
      if (error instanceof Error)
        console.error('toggleCompleteTodo Error toggling todo completion:', error.message);
    }
  };

  // Type guard to check if the error is a PostgrestError
  function isPostgrestError(error: any): error is PostgrestError {
    return error && typeof error === 'object' && 'message' in error;
  }
  const openEditBottomSheet = (todo: TodoItem) => {
    setSelectedTodo(todo);
    if (todoBottomSheetRef.current) {
      todoBottomSheetRef.current.present(todo);
    }
  };

  const closeEditBottomSheet = () => {
    if (todoBottomSheetRef.current) {
      todoBottomSheetRef.current.dismiss();
    }
  };

  const handleBlur = (newTodo: TodoItem) => {
    if (newTodo) {
      updateTodo(newTodo); // doesnt exist in the modal content
    }
  };

  const handleSubmitEditing = (newTodo: TodoItem) => {
    if (newTodo) {
      addTodo(newTodo);
    }
  };

  const {overdueTodos, todayTodos, completedTodos} = useMemo(() => {
    const overdue = todos.filter(todo => {
      const dueDate = dayjs(todo.due_date);
      const yesterday = dayjs().subtract(1, 'day');
      return dueDate.isValid() && dueDate.isBefore(yesterday, 'day');
    });

    const today = todos.filter(todo => {
      const todayDate = dayjs();
      const todoDueDate = dayjs(todo.due_date || '');
      return todoDueDate.isValid() && !todo.completed && todoDueDate.isSame(todayDate, 'day');
    });

    const completed = todos.filter(todo => todo.completed);

    return {overdueTodos: overdue, todayTodos: today, completedTodos: completed};
  }, [todos]); // Only re-compute when todos change

  const contextValue: TodoContextType = {
    todos,
    sections,
    addTodo,
    deleteTodo,
    updateTodo,
    toggleCompleteTodo,
    openEditBottomSheet,
    closeEditBottomSheet,
    overdueTodos,
    todayTodos,
    completedTodos,
    selectedTodo,
    setSelectedTodo,
    setShowInputModal,
  };

  return (
    <TodoContext.Provider value={contextValue}>
      <GestureHandlerRootView style={styles.container}>
        <BottomSheetModalProvider>
          {children}
          <AddTodoModal
            isVisible={showInputModal}
            onBackdropPress={() => setShowInputModal(false)}
            onSubmitEditing={handleSubmitEditing}
            sections={sections}
            userId={user ? user.id : '0'}
          />
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
            enableContentPanningGesture={false}
            ref={todoBottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            stackBehavior={'replace'}
            onDismiss={() => setSelectedTodo(null)}>
            <BottomSheetView style={styles.contentContainer}>
              <EditTodoModalContent selectedTodo={selectedTodo} onBlur={handleBlur} />
            </BottomSheetView>
          </BottomSheetModal>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </TodoContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center', // Align badges vertically in the center
    paddingVertical: 10, // Adjust vertical padding as needed
    marginHorizontal: 10,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#fff',
    width: '80%',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    top: -40,
    zIndex: 1,
  },
  inputModal: {
    backgroundColor: 'white',
    padding: 20,
    width: '100%',
    top: 155,
  },
  textInput: {
    marginBottom: 10,
    width: '100%',
    fontSize: 18,
  },
  highlightContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  highlight: {
    backgroundColor: 'yellow',
  },
  mention: {
    backgroundColor: 'orange',
  },
});
export default TodoContext;
