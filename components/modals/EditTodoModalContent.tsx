import React, {useState, useRef, useEffect, useCallback} from 'react';
import {View, StyleSheet, KeyboardAvoidingView, Platform} from 'react-native';
import {
  Appbar,
  Checkbox,
  List,
  Menu,
  TextInput,
  Text,
  Icon,
  Divider,
  RadioButton,
  Button,
} from 'react-native-paper';
import ToDoItem, {getBorderColor} from '../ToDoItem';
import {router} from 'expo-router';
import {PriorityType} from '@/store/todo/types';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import {Section, Todo} from '@/powersync/AppSchema';
import DatePicker from 'react-native-date-picker';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone'; // For timezone handling
import utc from 'dayjs/plugin/utc'; // For UTC handling

dayjs.extend(utc);
dayjs.extend(timezone);

export const getFormattedDate = (start_date: string, dateString: string, type: string) => {
  const date = dayjs(dateString);

  // Format parts of the date
  const dayOfWeek = date.format('ddd'); // Abbreviated weekday
  const month = date.format('MMM'); // Abbreviated month
  const day = date.format('DD'); // Day of the month
  const time = date.format('h:mm A'); // Time in 12-hour format with AM/PM
  const timezoneOffset = date.format('Z'); // Timezone offset

  if (type === 'end' && dayjs(start_date).isSame(date, 'day')) {
    return ` ${time} (GMT${timezoneOffset})`;
  }
  // Construct the final formatted string
  return `${dayOfWeek}, ${month} ${day}  ${time} (GMT${timezoneOffset})`;
};

export interface TodoWithSubTask extends Todo {
  subItems: Todo[];
}

export interface EditTodoModalContentProps {
  todo: TodoWithSubTask;
  onDismiss: (oldTodo: Todo, newTodo: Todo) => void;
  sections: Section[];
  colors: MD3Colors;
  deleteTodo: (id: string) => void;
  openEditBottomSheet: (item: Todo) => void;
  toggleCompleteTodo: (id: string) => void;
  onPress: (parentId: string) => void;
}

const EditTodoModalContent = ({
  todo,
  onDismiss,
  sections,
  colors,
  deleteTodo,
  openEditBottomSheet,
  toggleCompleteTodo,
  onPress,
}: EditTodoModalContentProps) => {
  const [isPriorityMenuVisible, setIsPriorityMenuVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const {subItems, ...todoWithoutSubtasks} = todo;
  console.log('todoWithoutSubtasks', todoWithoutSubtasks);
  // Initialize state with the modified todo object
  const [newTodo, setNewTodo] = useState<Todo>(todoWithoutSubtasks);
  const [subTodos, setSubTodos] = useState<Todo[]>(subItems);
  const [titleInputFocus, setTitleInputFocus] = useState(false);
  const [titleInputHeight, setTitleInputHeight] = useState(20);

  const [summaryHeight, setSummaryHeight] = useState(20);

  const titleInputRef = useRef(null);

  const summaryRef = useRef(null);

  const latestNewTodo = useRef(newTodo);

  const findSectionById = (id: string) =>
    sections.find(section => section.id === id)?.name || 'Unknown';

  const handlePriorityChange = (priority: PriorityType) => {
    setNewTodo(prev => ({...prev, priority}));
    setIsPriorityMenuVisible(false);
  };
  const handleCompletedChange = () =>
    setNewTodo(prev => ({...prev, completed: prev.completed ? 0 : 1}));
  const handleTitleChange = (text: string) => setNewTodo(prev => ({...prev, title: text}));

  const handleTitleContentSizeChange = (event: {
    nativeEvent: {contentSize: {height: React.SetStateAction<number>}};
  }) => setTitleInputHeight(event.nativeEvent.contentSize.height);

  const handleSummaryChange = useCallback((summary: string) => {
    setNewTodo(prevTodo => ({...prevTodo, summary: summary}));
  }, []);

  const handleSummaryContentSizeChange = (event: {
    nativeEvent: {contentSize: {height: React.SetStateAction<number>}};
  }) => {
    setSummaryHeight(event.nativeEvent.contentSize.height);
  };

  // Update refs whenever values change
  useEffect(() => {
    latestNewTodo.current = newTodo;
  }, [newTodo]);

  // Effect to handle unmount logic
  useEffect(() => {
    return () => {
      console.log('EditTodoModalContent unmounted');
      console.log('latestNewTodo.current', latestNewTodo.current);
      onDismiss(todoWithoutSubtasks, latestNewTodo.current);
    };
  }, []); // Empty dependency array ensures it runs only on mount and unmount

  const handleSubTodoDelete = (id: string) => {
    // Remove the subtodo from the list
    const newSubItems = subItems?.filter(subItem => subItem.id !== id);
    setSubTodos(newSubItems);

    // Update the todo object in database
    deleteTodo(id);
  };
  const handleDateChange = (date: Date, type: 'start' | 'end') => {
    const newDate = dayjs(date);
    const currentStartDate = dayjs(newTodo.start_date);
    const currentDueDate = dayjs(newTodo.due_date);

    if (type === 'start') {
      if (newDate.isAfter(currentDueDate) && newDate.hour() < currentDueDate.hour()) {
        const newDueDate = newDate
          .set('hour', currentDueDate.hour())
          .set('minute', currentDueDate.minute())
          .set('second', currentDueDate.second());
        setNewTodo(prev => ({
          ...prev,
          start_date: newDate.format('YYYY-MM-DD HH:mm:ss'),
          due_date: newDueDate.format('YYYY-MM-DD HH:mm:ss'),
        }));
      } else if (newDate.isAfter(currentDueDate) && newDate.hour() > currentDueDate.hour()) {
        const newDueDate = newDate
          .add(1, 'day')
          .set('hour', currentDueDate.hour())
          .set('minute', currentDueDate.minute())
          .set('second', currentDueDate.second());
        setNewTodo(prev => ({
          ...prev,
          start_date: newDate.format('YYYY-MM-DD HH:mm:ss'),
          due_date: newDueDate.format('YYYY-MM-DD HH:mm:ss'),
        }));
      } else {
        // Update only the start date
        setNewTodo(prev => ({
          ...prev,
          start_date: newDate.format('YYYY-MM-DD HH:mm:ss'),
        }));
      }
    } else if (type === 'end') {
      if (newDate.isBefore(currentStartDate) && newDate.hour() > currentStartDate.hour()) {
        // If the new due date is before the current start date, set start date to be one day before the new due date
        const newStartDate = newDate
          .set('hour', currentStartDate.hour())
          .set('minute', currentStartDate.minute())
          .set('second', currentStartDate.second());
        setNewTodo(prev => ({
          ...prev,
          due_date: newDate.format('YYYY-MM-DD HH:mm:ss'),
          start_date: newStartDate.format('YYYY-MM-DD HH:mm:ss'),
        }));
      } else if (newDate.isBefore(currentStartDate) && newDate.hour() < currentStartDate.hour()) {
        const newStartDate = newDate
          .subtract(1, 'day')
          .set('hour', currentStartDate.hour())
          .set('minute', currentStartDate.minute())
          .set('second', currentStartDate.second());
        setNewTodo(prev => ({
          ...prev,
          due_date: newDate.format('YYYY-MM-DD HH:mm:ss'),
          start_date: newStartDate.format('YYYY-MM-DD HH:mm:ss'),
        }));
      } else {
        // Update only the due date
        setNewTodo(prev => ({
          ...prev,
          due_date: newDate.format('YYYY-MM-DD HH:mm:ss'),
        }));
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <Appbar.Header statusBarHeight={0}>
        <Appbar.Content
          title={findSectionById(newTodo.section_id || '568c6c1d-9441-4cbc-9fc5-23c98fee1d3d')}
          titleStyle={{fontSize: 16}}
          onPress={() => {
            console.log('Appbar.Content pressed');
            onDismiss(todoWithoutSubtasks, latestNewTodo.current);
            router.replace(
              `/inbox?section_id=${newTodo.section_id || '568c6c1d-9441-4cbc-9fc5-23c98fee1d3d'}`,
            );
          }}
        />
        <Menu
          anchorPosition="bottom"
          visible={isPriorityMenuVisible}
          onDismiss={() => setIsPriorityMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="flag"
              color={getBorderColor(newTodo.priority as PriorityType)}
              onPress={() => setIsPriorityMenuVisible(true)}
            />
          }>
          {['1', '2', '3', '4'].map(priority => (
            <Menu.Item
              key={priority}
              onPress={() => handlePriorityChange(priority as PriorityType)}
              leadingIcon={() => (
                <Icon source="flag" size={24} color={getBorderColor(priority as PriorityType)} />
              )}
              title={`Priority ${priority}`}
              trailingIcon={newTodo.priority === priority ? 'check' : ''}
            />
          ))}
        </Menu>
        <Menu
          anchorPosition="bottom"
          visible={isMenuVisible}
          onDismiss={() => setIsMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              color={colors.onSurfaceVariant}
              onPress={() => setIsMenuVisible(true)}
            />
          }>
          <Menu.Item
            onPress={() => {
              setIsMenuVisible(false);
              setTimeout(() => {
                onDismiss(todoWithoutSubtasks, newTodo);
                deleteTodo(todo.id);
              }, 1000);
            }}
            title="delete"
          />
        </Menu>
      </Appbar.Header>
      <View style={styles.inputContainer}>
        <Checkbox
          status={newTodo.completed ? 'checked' : 'unchecked'}
          onPress={handleCompletedChange}
        />
        <TextInput
          ref={titleInputRef}
          mode="outlined"
          outlineStyle={{borderWidth: titleInputFocus ? 1 : 0}}
          multiline
          textBreakStrategy="highQuality"
          value={newTodo.title!}
          onChangeText={handleTitleChange}
          style={{
            flex: 1,
            borderWidth: 0,
            height: Math.max(20, titleInputHeight),
            justifyContent: 'flex-start',
          }}
          contentStyle={{textAlignVertical: 'top', marginVertical: -13}}
          onFocus={() => setTitleInputFocus(true)}
          onBlur={() => setTitleInputFocus(false)}
          onContentSizeChange={handleTitleContentSizeChange}
          right={
            titleInputFocus && (
              <TextInput.Icon
                borderless
                icon="check"
                color="purple"
                onPress={() => titleInputRef.current?.blur()}
              />
            )
          }
        />
      </View>
      <View style={styles.inputContainer}>
        <Icon source="playlist-edit" size={30} color={colors.onBackground} />
        <TextInput
          ref={summaryRef}
          mode="outlined"
          multiline
          placeholder="add a description..."
          outlineStyle={{borderWidth: 0}}
          textBreakStrategy="highQuality"
          value={newTodo.summary!}
          onChangeText={handleSummaryChange}
          style={{
            flex: 1,
            borderWidth: 0,
            paddingLeft: 0,
            height: Math.max(20, summaryHeight),
            justifyContent: 'flex-start',
          }}
          contentStyle={{textAlignVertical: 'top', marginVertical: -13}}
          onContentSizeChange={handleSummaryContentSizeChange}
        />
      </View>

      <Divider bold />
      <List.AccordionGroup>
        <List.Accordion
          left={props => <List.Icon {...props} icon="calendar-start" />}
          right={() => <></>}
          titleStyle={{alignSelf: 'flex-end'}}
          title={getFormattedDate(newTodo.start_date || '', newTodo.start_date || '', 'start')}
          id="1">
          <List.Item
            title=""
            right={() => (
              <DatePicker
                date={dayjs(newTodo.start_date).toDate()}
                onDateChange={date => handleDateChange(date, 'start')}
                dividerColor={colors.primary}
              />
            )}
          />
        </List.Accordion>
        <Divider />
        <List.Accordion
          left={props => <List.Icon {...props} icon="calendar-end" />}
          right={() => <></>}
          titleStyle={{alignSelf: 'flex-end'}}
          title={getFormattedDate(newTodo.start_date || '', newTodo.due_date || '', 'end')}
          id="2">
          <List.Item
            title=""
            right={() => (
              <DatePicker
                date={dayjs(newTodo.due_date).toDate()}
                onDateChange={date => handleDateChange(date, 'end')}
                dividerColor={colors.primary}
              />
            )}
          />
        </List.Accordion>
        <Divider />
        <List.Accordion
          id="3"
          title={newTodo.reminder_option ?? 'Reminder'}
          left={props => <List.Icon {...props} icon="bell" />}
          titleStyle={{alignSelf: 'flex-end'}}
          right={() => <></>}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <RadioButton.Group
              onValueChange={value => setNewTodo(prev => ({...prev, reminder_option: value}))}
              value={newTodo.reminder_option ?? ''}>
              <View style={styles.radioContainer}>
                <RadioButton value="At Time of Event" />
                <Text>At Time of Event</Text>
              </View>
              <View style={styles.radioContainer}>
                <RadioButton value="10 Minutes Before" />
                <Text>10 Minutes Before</Text>
              </View>
              <View style={styles.radioContainer}>
                <RadioButton value="1 Hour Before" />
                <Text>1 Hour Before</Text>
              </View>
              <View style={styles.radioContainer}>
                <RadioButton value="1 Day Before" />
                <Text>1 Day Before</Text>
              </View>
              <View style={styles.radioContainer}>
                <RadioButton value="custom" />
                <Text>Custom</Text>
              </View>
            </RadioButton.Group>
          </View>
        </List.Accordion>
      </List.AccordionGroup>
      <Divider bold />

      {subTodos &&
        subTodos?.map(subItem => (
          <ToDoItem
            item={subItem}
            colors={colors}
            onToggleComplete={toggleCompleteTodo}
            openEditBottomSheet={openEditBottomSheet}
            deleteTodo={handleSubTodoDelete}
            sections={sections}
            enableSwipe={false}
          />
        ))}

      <Button
        mode="contained-tonal"
        icon={icon => <Icon source="plus" size={24} color={colors.inverseSurface} />}
        buttonColor={colors.inverseOnSurface}
        textColor={colors.inverseSurface}
        style={{borderRadius: 5, margin: 12}}
        onPress={() => onPress(todo.id)}>
        create a subtask
      </Button>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 8,
    gap: 4,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
});

export default EditTodoModalContent;
