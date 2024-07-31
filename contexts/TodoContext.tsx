import React, {createContext, useState, useEffect, useContext, useRef, useMemo} from 'react';
import {Alert, Keyboard, StyleSheet} from 'react-native';
import {supabase} from '@/utils/supabase';
import {PostgrestError} from '@supabase/supabase-js';

import {
  MonthlyTodo,
  Section,
  SectionItem,
  TodoContextType,
  TodoItem,
  ToDoProviderProps,
} from './TodoContext.types';

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
import AddTodoModal from '@/components/modals/AddTodoModal';
import {useUser} from './UserContext';
import {TimelineEventProps} from 'react-native-calendars';
import {useTheme} from 'react-native-paper';
import {set} from 'lodash';

const TodoContext = createContext<TodoContextType>({
  todos: [],
  sections: [],
  groupedSections: [],
  handleEndDrag: () => {},
  addTodo: () => {},
  deleteTodo: () => {},
  batchDeleteTodos: async () => false,
  updateTodo: () => {},
  toggleCompleteTodo: () => {},
  batchCompleteTodos: async () => false,
  openEditBottomSheet: () => {},
  closeEditBottomSheet: () => {},
  addSection: async () => null,
  updateSectionName: async () => {},
  deleteSection: async () => false,
  overdueTodos: [],
  todayTodos: [],
  completedTodos: [],
  todoSortedByDate: {},
  monthlyTodoArray: [],
  MonthlyTodoRecord: {},
  timelineTodoEvents: [],
  selectedTodo: null,
  setSelectedTodo: () => {},
  setShowInputModal: () => {},
});
// Custom hook to consume the UserContext
export const useTodo = () => useContext(TodoContext);

export const TodoProvider = ({children}: ToDoProviderProps) => {
  const {user, isLoading} = useUser();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);

  const [overdueTodos, setOverdueTodos] = useState<TodoItem[]>([]);
  const [todayTodos, setTodayTodos] = useState<TodoItem[]>([]);
  const [completedTodos, setCompletedTodos] = useState<TodoItem[]>([]);

  const [groupedSections, setGroupedSections] = useState<
    {key: string; name: string; data: TodoItem[]}[]
  >([]);

  const [monthlyTodoArray, setMonthlyTodoArray] = useState<MonthlyTodo[]>([]);
  const todoBottomSheetRef = useRef<bottomSheetModal>(null);

  const [showInputModal, setShowInputModal] = useState(false);

  const snapPoints = useMemo(() => ['50%', '75%'], []);

  const theme = useTheme();

  useEffect(() => {
    if (isLoading || !user) {
      return;
    }

    const fetchTodos = async () => {
      const {data, error} = await supabase.from('todos').select('*').eq('created_by', user!.id);
      if (error) {
        console.error('Error fetching todos:', error.message);
      } else {
        const todos: TodoItem[] = data ?? [];
        setTodos(todos);
      }
    };

    const fetchSections = async () => {
      // Fetch sections that belong to the user or are unassigned (Inbox)
      const {data, error} = await supabase
        .from('sections')
        .select('*')
        .or(`user_id.eq.${user!.id},user_id.is.null`)
        .order('id', {ascending: true});

      if (error) {
        console.error('Error fetching sections:', error.message);
      } else {
        const sections: SectionItem[] = data ?? [];
        setSections(sections);
      }
    };

    fetchTodos();
    fetchSections();
  }, [isLoading, user]);

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

    if (error) {
      console.error('Error adding todo:', error.message);
    } else {
      if (data) {
        setTodos([...todos, data[0]]);
      }
    }
  };

  useEffect(() => {
    const categorizeTodos = (
      todos: TodoItem[],
    ): [TodoItem[], TodoItem[], TodoItem[], Section[], MonthlyTodo[]] => {
      const newOverdueTodos = todos.filter(todo => {
        const dueDate = dayjs(todo.due_date);
        const yesterday = dayjs().subtract(1, 'day');
        return dueDate.isValid() && !todo.completed && dueDate.isBefore(yesterday, 'day');
      });

      const newTodayTodos = todos.filter(todo => {
        const todayDate = dayjs();
        const todoDueDate = dayjs(todo.due_date || '');
        return todoDueDate.isValid() && !todo.completed && todoDueDate.isSame(todayDate, 'day');
      });

      const newCompletedTodos = todos.filter(todo => todo.completed);

      // Group todos by section ID and transform them
      const groupedSectionsData = todos.reduce(
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

      const sectionNameMap = new Map(sections.map(sec => [sec.id, sec.name]));

      const formattedSections: Section[] = Object.keys(groupedSectionsData).map(sectionId => {
        const id = Number(sectionId);
        return {
          key: id.toString(),
          name: sectionNameMap.get(id) || 'Inbox',
          data: groupedSectionsData[id],
        };
      });

      const generateDateRange = (startDate: dayjs.Dayjs, days: number): string[] => {
        return Array.from({length: days}, (_, i) => startDate.add(i, 'day').format('YYYY-MM-DD'));
      };

      // Get today's date and generate a range of 101 days (50 before, today, 50 after)
      const todayDate = dayjs();
      const dateRange = generateDateRange(todayDate.subtract(50, 'day'), 101);

      const todoSortedByDate: Record<string, TodoItem[]> = {};
      dateRange.forEach(date => {
        todoSortedByDate[date] = [];
      });

      // Populate the object with the grouped todos
      todos.forEach(todo => {
        const dueDate = dayjs(todo.due_date);
        const key = dueDate.isValid() ? dueDate.format('YYYY-MM-DD') : 'No Due Date';
        // Only add to the object if the date is within the expected range
        if (key in todoSortedByDate) {
          todoSortedByDate[key].push(todo);
        }
      });

      // Convert the object to a nested array format
      const newMonthlyTodoArray: MonthlyTodo[] = dateRange.map(date => ({
        dueDate: date,
        data: todoSortedByDate[date],
      }));

      return [
        newOverdueTodos,
        newTodayTodos,
        newCompletedTodos,
        formattedSections,
        newMonthlyTodoArray,
      ];
    };
    const [
      newOverdueTodos,
      newTodayTodos,
      newCompletedTodos,
      formattedSections,
      newMonthlyTodoArray,
    ] = categorizeTodos(todos);

    setOverdueTodos(newOverdueTodos);
    setTodayTodos(newTodayTodos);
    setCompletedTodos(newCompletedTodos);
    setGroupedSections(formattedSections);
    setMonthlyTodoArray(newMonthlyTodoArray);
  }, [sections, todos]);

  const deleteTodo = async (id: number) => {
    try {
      const {error} = await supabase.from('todos').delete().match({id});
      if (error) {
        console.error('Error deleting todo:', error.message);
      } else {
        // Use a functional update to ensure we're working with the latest state
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const batchDeleteTodos = async (ids: number[]) => {
    try {
      const {error} = await supabase.from('todos').delete().in('id', ids);
      if (error) {
        console.error('Error deleting todos:', error.message);
        return false;
      } else {
        // Use a functional update to ensure we're working with the latest state
        setTodos(prevTodos => prevTodos.filter(todo => !ids.includes(todo.id)));
        return true;
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      return false;
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

  const toggleCompleteTodo = async (todoId: string) => {
    try {
      // Find the todo item to toggle completion
      const todoToUpdate = todos.find(todo => todo.id === todoId);
      if (!todoToUpdate) {
        throw new Error('Todo item not found');
      }

      // Determine the new completed state
      const newCompletedState = !todoToUpdate.completed;
      const updatedDate = newCompletedState ? dayjs().toISOString() : null;
      // Update the todo item in the database
      const {data, error} = await supabase
        .from('todos')
        .update({completed: newCompletedState, completed_at: updatedDate})
        .match({id: todoId})
        .select('id, completed');

      if (error) {
        throw error;
      }

      // Update the local state (todos) to reflect the change
      if (data) {
        setTodos(
          todos.map(todo =>
            todo.id === todoId
              ? {...todo, completed: newCompletedState, completed_at: dayjs(updatedDate).toDate()}
              : todo,
          ),
        );
      }
    } catch (error) {
      if (isPostgrestError(error))
        console.error('toggleCompleteTodo PostgrestError :', error.message);
      if (error instanceof Error)
        console.error('toggleCompleteTodo Error toggling todo completion:', error.message);
    }
  };

  const batchCompleteTodos = async (todoIds: number[]) => {
    try {
      const updatedDate = dayjs(new Date()).toISOString();
      const {data, error} = await supabase
        .from('todos')
        .update({completed: true, completed_at: updatedDate})
        .in('id', todoIds)
        .select('id, completed');

      if (error) {
        throw error;
      }

      if (data) {
        const completedIds = data.map(item => item.id);
        setTodos(
          todos.map(todo =>
            completedIds.includes(todo.id)
              ? {...todo, completed: true, completed_at: dayjs(updatedDate).toDate()}
              : todo,
          ),
        );

        return true;
      }
    } catch (error) {
      if (isPostgrestError(error))
        console.error('batchCompleteTodos PostgrestError :', error.message);
      if (error instanceof Error)
        console.error('batchCompleteTodos Error completing todos:', error.message);

      return false;
    }

    return false;
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

  const addSection = async (newSectionName: string) => {
    if (!newSectionName || !user) return false;

    if (sections.some(section => section.name === newSectionName)) {
      return false;
    }

    const {data, error} = await supabase
      .from('sections')
      .insert({name: newSectionName, user_id: user.id})
      .select();

    if (error) {
      console.error('Error adding section:', error.message);
    } else {
      if (data) {
        setSections([...sections, data[0]]);
        return data[0];
      }
    }

    return null;
  };

  const updateSectionName = async (updatedSection: SectionItem) => {
    if (sections.some(section => section.name === updatedSection.name)) {
      return Alert.alert('Error', 'Section name already exists');
    }

    const {id, ...updateFields} = updatedSection; // Destructure to exclude id
    const {error} = await supabase
      .from('sections')
      .update(updateFields) // Update with the fields excluding id
      .match({id}); // Match the record by id

    if (error) {
      console.error('Error updating section:', error.message);
    } else {
      setSections(
        sections.map(section => (section.id === updatedSection.id ? updatedSection : section)),
      );
      return updatedSection;
    }

    return null;
  };

  const deleteSection = async (sectionId: number) => {
    if (!user) return;

    const {error} = await supabase
      .from('sections')
      .delete()
      .match({id: sectionId, user_id: user?.id});

    if (error) {
      console.error('Error deleting section:', error.message);
    } else {
      setSections(sections.filter(section => section.id !== sectionId));
      return true;
    }
    return false;
  };

  const handleSubmitEditing = async (newTodo: TodoItem, selectedSection = 'Inbox') => {
    if (!newTodo) return;
    if (selectedSection !== 'Inbox' && !newTodo.section_id) {
      const isCreated = await addSection(selectedSection);
      console.log('isCreated:', isCreated);
      if (!isCreated) {
        return Alert.alert('Error', '[isCreated] Failed to create section');
      }

      const updatedTodo = {...newTodo, section_id: isCreated.id};
      return await addTodo(updatedTodo);
    }

    if (newTodo.section_id || selectedSection === 'Inbox') {
      await addTodo(newTodo);
    } else {
      return Alert.alert('Error', 'section_id is missing or invalid');
    }
  };

  const {todoSortedByDate, MonthlyTodoRecord, timelineTodoEvents} = useMemo(() => {
    // Helper function to generate an array of dates
    const generateDateRange = (startDate: dayjs.Dayjs, days: number): string[] => {
      return Array.from({length: days}, (_, i) => startDate.add(i, 'day').format('YYYY-MM-DD'));
    };

    // Get today's date and generate a range of 101 days (50 before, today, 50 after)
    const todayDate = dayjs();
    const dateRange = generateDateRange(todayDate.subtract(50, 'day'), 101);

    // Initialize the sorted object with the date range and empty arrays
    const todoSortedByDate: Record<string, TodoItem[]> = {};
    dateRange.forEach(date => {
      todoSortedByDate[date] = [];
    });

    // Populate the object with the grouped todos
    todos.forEach(todo => {
      const dueDate = dayjs(todo.due_date);
      const key = dueDate.isValid() ? dueDate.format('YYYY-MM-DD') : 'No Due Date';
      // Only add to the object if the date is within the expected range
      if (key in todoSortedByDate) {
        todoSortedByDate[key].push(todo);
      }
    });

    // Convert the array to a Record<string, TodoItem[]>
    const MonthlyTodoRecord: Record<string, TodoItem[]> = monthlyTodoArray.reduce(
      (acc: Record<string, TodoItem[]>, item: MonthlyTodo) => {
        acc[item.dueDate] = item.data;
        return acc;
      },
      {} as Record<string, TodoItem[]>, // Type the initial value to match the result type
    );

    const timelineTodoEvents: TimelineEventProps[] = todos
      .filter(todo => todo.start_date && todo.due_date) // Filter todos with both start_date and due_date
      .map(todo => ({
        start: dayjs(todo.start_date!).format('YYYY-MM-DD HH:mm:ss'),
        end: dayjs(todo.due_date!).format('YYYY-MM-DD HH:mm:ss'),
        title: todo.title,
        summary: todo.summary,
        color: theme.colors.onPrimaryContainer,
      }));

    return {
      todoSortedByDate: todoSortedByDate,
      monthlyTodoArray: monthlyTodoArray,
      MonthlyTodoRecord: MonthlyTodoRecord,
      timelineTodoEvents: timelineTodoEvents,
    };
  }, [monthlyTodoArray, theme.colors.onPrimaryContainer, todos]); // Only re-compute when todos change

  const handleEndDrag = (results: TodoItem[], name: string | Date) => {
    switch (name) {
      case 'overdue':
        setOverdueTodos(results);
        break;
      case 'today':
        setTodayTodos(results);
        break;
      case 'completed':
        setCompletedTodos(results);
        break;
      default:
        if (name instanceof Date) {
          const nameString = dayjs(name).format('YYYY-MM-DD');

          // Update monthlyTodoArray
          const updatedMonthlyArray = monthlyTodoArray.map(item => {
            const itemDueDate = dayjs(item.dueDate).format('YYYY-MM-DD'); // Format the due date to match
            if (itemDueDate === nameString) {
              // Log item for debugging
              return {...item, data: results}; // Update the item with new results
            }
            return item; // Return item unchanged if dates don't match
          });

          // Update state with the new array
          setMonthlyTodoArray(updatedMonthlyArray);
        } else if (sections.some(section => section.name === name)) {
          // Assuming sections have a structure that allows us to match by name
          const updatedGroupedSections: Section[] = groupedSections.map(section => {
            if (section.name === name) {
              return {
                ...section,
                data: results,
              };
            }
            return section;
          });
          setGroupedSections(updatedGroupedSections);
        } else {
          console.error(`Unknown list name: ${name}`);
        }
    }
  };

  const contextValue: TodoContextType = {
    todos,
    sections,
    handleEndDrag,
    addTodo,
    deleteTodo,
    batchDeleteTodos,
    updateTodo,
    toggleCompleteTodo,
    batchCompleteTodos,
    openEditBottomSheet,
    closeEditBottomSheet,
    addSection,
    updateSectionName,
    deleteSection,
    overdueTodos,
    todayTodos,
    completedTodos,
    groupedSections,
    selectedTodo,
    todoSortedByDate,
    monthlyTodoArray,
    MonthlyTodoRecord,
    timelineTodoEvents,
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
            setIsVisible={setShowInputModal}
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
