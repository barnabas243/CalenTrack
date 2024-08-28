import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react';
import {StyleSheet, View, TouchableOpacity, Alert} from 'react-native';
import {Appbar, Text, useTheme} from 'react-native-paper';
import dayjs from 'dayjs';
import MonthCalendar from '@/components/calendars/MonthCalendar';
import DailyCalendar from '@/components/calendars/DailyCalendar';
import AgendaCalendar from '@/components/calendars/AgendaCalendar';
import WeekCalendar from '@/components/calendars/WeekCalendar';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import Animated, {useAnimatedStyle, useSharedValue, withSpring} from 'react-native-reanimated';
import {useTodo} from '@/hooks/useTodo';
import {MonthlyTodo} from '@/store/todo/types';
import {TimelineEventProps} from 'react-native-calendars';
import {isEqual} from 'lodash';
import {useAuth} from '@/hooks/useAuth';
import {ICustomCalendarEvent} from '@/components/calendars/WeekCalendar';
import {action_type, ActivityLog, entity_type, Todo} from '@/powersync/AppSchema';
import {useNotification} from '@/contexts/NotificationContext';
import {Host} from 'react-native-portalize';
import {getGoogleCalendarEvents} from '@/utils/calendarEvents';

export type Mode = 'month' | 'day' | 'week' | 'agenda';

export type GoogleCalendarEvent = {
  id: string; // Unique identifier for the event
  title: string; // summary of the event (required)
  description?: string; // Optional description of the event
  start: string; // Start time of the event
  end: string; // End time of the event
  type: 'google'; // Event type
};

const POLL_INTERVAL_MS = 5 * 60 * 1000; // Poll every 5 minutes

const CalendarPage = () => {
  const {colors} = useTheme();

  const {
    todos,
    sections,
    deleteExistingTodos,
    updateExistingTodos,
    addNewSection,
    addNewTodo,
    createActivityLog,
  } = useTodo();

  const {user} = useAuth();

  const {scheduleTodoNotification, updateTodoWithNotification} = useNotification();

  const [mode, setMode] = useState<Mode>('month');
  const [selectedDate, setSelectedDate] = useState(dayjs(new Date()).format('YYYY-MM-DD'));
  const [expanded, setExpanded] = useState(false);

  const [monthlyTodoArray, setMonthlyTodoArray] = useState<MonthlyTodo[]>([]);

  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<Todo[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchGoogleCalendarEvents = async () => {
      try {
        const formattedEvents: Todo[] = []; // Initialize an empty array to store the formatted events
        const events = await getGoogleCalendarEvents(user);

        if (!events || events.length === 0) {
          console.log('No events found.');
          setGoogleCalendarEvents([]);
          return;
        }

        events.forEach(evt => {
          // Create a formatted event object
          const formattedEvent: Todo = {
            id: evt.id,
            title: evt.summary,
            summary: evt.description || '', // Default value if description is missing
            start_date: evt.start.dateTime || '', // Ensure the field matches your Todo type
            due_date: evt.end.dateTime || '', // Use end date as due_date
            completed: dayjs().isAfter(dayjs(evt.end.dateTime)) ? 1 : 0, // Mark as completed if the current date is after the event end date
            priority: '4', // Default priority; adjust as needed
            parent_id: null, // Set to null if no parent ID is applicable
            section_id: null, // Set to null if no section ID is applicable
            created_by: user.id, // ID of the user who created the todo
            reminder_option: evt.reminders?.useDefault ? 'At Time of Event' : null, // Reminder option if available
            notification_id: null, // Set to null; adjust as needed
            type: 'google', // Type to differentiate Google Calendar events
            completed_at: dayjs().isAfter(dayjs(evt.end.dateTime)) ? evt.end.dateTime : null, // Set completed_at if event is completed
            recurrence: evt.recurrence || null, // Recurrence rule if available
            created_at: evt.created || '', // Set to created date if available
          };

          // Push the formatted event to the array
          formattedEvents.push(formattedEvent);
        });

        setGoogleCalendarEvents(formattedEvents);
      } catch (err) {
        console.error('Failed to fetch Google Calendar events:', err);
      }
    };

    fetchGoogleCalendarEvents();

    const intervalId = setInterval(async () => {
      await fetchGoogleCalendarEvents(); // Periodic fetch
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId); // Clean up on unmount
  }, [user]);

  const newMonthlyTodoArray = useMemo(() => {
    const categorizeTodos = (todos: Todo[]): MonthlyTodo[] => {
      // Helper function to generate an array of dates
      const generateDateRange = (startDate: dayjs.Dayjs, days: number): string[] => {
        return Array.from({length: days}, (_, i) => startDate.add(i, 'day').format('YYYY-MM-DD'));
      };

      // Get today's date and generate a range of 465 days (100 before, today, 365 after)
      const todayDate = dayjs();
      const dateRange = generateDateRange(todayDate.subtract(100, 'day'), 465);

      // Initialize the sorted object with the date range and empty arrays
      const todoSortedByDate: Record<string, Todo[]> = {};
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

      googleCalendarEvents.forEach(todo => {
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

      return newMonthlyTodoArray;
    };

    return categorizeTodos(todos);
  }, [googleCalendarEvents, todos]); // Recompute when todos or sections change

  useEffect(() => {
    setMonthlyTodoArray(newMonthlyTodoArray);
  }, [newMonthlyTodoArray]);

  const {monthlyTodoRecord, timelineTodoEvents, weekTimelineEvents} = useMemo(() => {
    // Helper function to generate an array of dates
    const generateDateRange = (startDate: dayjs.Dayjs, days: number): string[] => {
      return Array.from({length: days}, (_, i) => startDate.add(i, 'day').format('YYYY-MM-DD'));
    };

    // Get today's date and generate a range of 101 days (50 before, today, 50 after)
    const todayDate = dayjs();
    const dateRange = generateDateRange(todayDate.subtract(50, 'day'), 101);

    // Initialize the sorted object with the date range and empty arrays
    const todoSortedByDate: Record<string, Todo[]> = {};
    dateRange.forEach(date => {
      todoSortedByDate[date] = [];
    });

    // Populate the object with the grouped todos and googleCalendarEvents
    const populateDateMap = (items: Todo[]) => {
      items.forEach(item => {
        const dueDate = dayjs(item.due_date);
        const key = dueDate.isValid() ? dueDate.format('YYYY-MM-DD') : 'No Due Date';
        if (key in todoSortedByDate) {
          todoSortedByDate[key].push(item);
        }
      });
    };

    // Populate with todos and googleCalendarEvents
    populateDateMap(todos);
    populateDateMap(googleCalendarEvents);

    // Convert the array to a Record<string, Todo[]>
    const monthlyTodoRecord: Record<string, Todo[]> = dateRange.reduce(
      (acc: Record<string, Todo[]>, date) => {
        acc[date] = todoSortedByDate[date];
        return acc;
      },
      {} as Record<string, Todo[]>,
    );

    const timelineTodoEvents: TimelineEventProps[] = todos
      .concat(googleCalendarEvents)
      .filter(todo => todo.start_date && todo.due_date) // Filter todos with both start_date and due_date
      .map(todo => ({
        id: todo.id!,
        start: dayjs(todo.start_date!).format('YYYY-MM-DD HH:mm:ss'),
        end: dayjs(todo.due_date!).format('YYYY-MM-DD HH:mm:ss'),
        title: todo.title!,
        summary: todo.summary || '',
        color: colors.onSurfaceDisabled,
      }));

    const weekTimelineEvents: ICustomCalendarEvent[] = todos
      .concat(googleCalendarEvents)
      .filter(todo => todo.start_date && todo.due_date) // Filter todos with both start_date and due_date
      .map(todo => ({
        id: todo.id!,
        start: dayjs(todo.start_date!).toDate(),
        end: dayjs(todo.due_date!).toDate(),
        title: todo.title!,
        summary: todo.summary || '',
        color: colors.onPrimaryContainer,
        type: todo.type || '',
        reminder_option: todo.reminder_option || '',
        notification_id: todo.notification_id || '',
      }));

    return {
      monthlyTodoRecord,
      timelineTodoEvents,
      weekTimelineEvents,
    };
  }, [colors.onPrimaryContainer, colors.onSurfaceDisabled, googleCalendarEvents, todos]); // Only re-compute when todos or googleCalendarEvents change

  const previousExpanded = useRef(expanded);
  const heightAnim = useSharedValue(expanded ? 80 : 0);

  const updateAnimation = useCallback(() => {
    heightAnim.value = withSpring(expanded ? 80 : 0, {
      damping: 19,
      stiffness: 80,
    });
    previousExpanded.current = expanded;
  }, [expanded, heightAnim]);

  React.useEffect(() => {
    if (expanded !== previousExpanded.current) {
      updateAnimation();
    }
  }, [expanded, updateAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
    overflow: 'hidden',
  }));

  const changeMode = useCallback((m: Mode) => {
    setExpanded(prev => !prev);
    setTimeout(() => setMode(m), 700); // adjust to preference. set higher so that animation completes before changing mode
  }, []);

  const handleEndDrag = useCallback((results: Todo[], name: string | Date) => {
    console.log('handleEndDrag', results, name);
  }, []);

  const handleTimeLineSubmitEditing = useCallback(
    async (timeline: TimelineEventProps) => {
      console.log('handleTimeLineSubmitEditing', timeline);

      const existingTodo = todos.find(todo => todo.id === timeline.id);
      if (!existingTodo) {
        console.error('Existing todo not found');
        return;
      }

      const todoData = {
        title: timeline.title,
        summary: timeline.summary?.trim() ?? '',
        start_date: timeline.start,
        due_date: timeline.end,
      };

      // Compare the relevant fields
      const hasChanges =
        todoData.title !== existingTodo.title ||
        todoData.summary !== existingTodo.summary ||
        !dayjs(existingTodo.start_date).isSame(dayjs(todoData.start_date)) ||
        !dayjs(existingTodo.due_date).isSame(dayjs(todoData.due_date));

      if (hasChanges) {
        const updatedData = {...existingTodo, ...todoData};
        const message = await updateTodoWithNotification(existingTodo, updatedData);
        console.log('handleTimeLineSubmitEditing:', message);
      } else {
        console.log('No changes detected');
      }
    },
    [todos, updateTodoWithNotification],
  );
  const handleWeekCalendarSubmitEditing = useCallback(
    async (timeline: ICustomCalendarEvent) => {
      console.log('handleTimeLineSubmitEditing', timeline);

      if (timeline.type === 'google') {
        console.log('Google Calendar event cannot be edited yet');
        return;
      }
      // Find existing todo by title
      const existingTodo = todos.find(todo => todo.id === timeline.id);
      if (!existingTodo) {
        console.error('Existing todo not found');
        return;
      }

      // Prepare data for comparison
      const todoData = {
        title: timeline.title,
        start_date: dayjs(timeline.start).format(), // Use dayjs for consistent date formatting
        due_date: dayjs(timeline.end).format(),
      };

      // Compare the relevant fields
      const hasChanges =
        todoData.title !== existingTodo.title ||
        !dayjs(todoData.start_date).isSame(dayjs(existingTodo.start_date)) ||
        !dayjs(todoData.due_date).isSame(dayjs(existingTodo.due_date));

      if (hasChanges) {
        try {
          const updatedData = {...existingTodo, ...todoData};
          const message = await updateTodoWithNotification(existingTodo, updatedData);
          console.log('handleTimeLineSubmitEditing:', message);
        } catch (error) {
          console.error('Error updating todo:', error);
        }
      } else {
        console.log('No changes detected');
      }
    },
    [todos, updateTodoWithNotification], // Make sure these dependencies are stable
  );

  // Memoize the handleSubmitEditing function
  const handleSubmitEditing = useCallback(
    async (newTodo: Todo, selectedSection = 'Inbox') => {
      try {
        // Trim the selected section name
        const trimmedSection = selectedSection.trim();

        const findSection = sections.find(section => section.name === trimmedSection);

        // Check if a new section needs to be created
        if (!findSection) {
          const newSection = {name: trimmedSection, user_id: user!.id};

          // Create a new section
          const sectionResult = await addNewSection(newSection);
          if (!sectionResult || !sectionResult.id) {
            console.warn('Section not created');
            return;
          }

          // Add the new section ID to the todo
          newTodo = {...newTodo, section_id: sectionResult.id};

          const log: ActivityLog = {
            id: '',
            action_type: 'CREATE',
            action_date: new Date().toISOString(),
            section_id: sectionResult.id,
            before_data: '',
            after_data: JSON.stringify(sectionResult),
            entity_type: 'section',
            todo_id: '',
            user_id: user!.id,
          };

          const newLog = await createActivityLog(log);

          if (!newLog) {
            console.warn('Activity log not created');
            return;
          }
        } else {
          // Add the existing section ID to the todo
          newTodo = {...newTodo, section_id: findSection.id};
        }
        // Add the todo item
        const todoResult = await addNewTodo(newTodo);
        if (!todoResult) {
          return;
        }

        // Handle notification scheduling if a reminder option is set
        if (todoResult.reminder_option && !todoResult.notification_id) {
          const notificationId = await scheduleTodoNotification(todoResult);
          if (!notificationId) {
            return;
          }

          // Update the todo with the notification ID
          const updatedTodoWithNotification = {...todoResult, notification_id: notificationId};
          const updateResult = await updateExistingTodos(updatedTodoWithNotification);
          if (!updateResult) {
            return;
          }
        }
        const log: ActivityLog = {
          id: '',
          action_type: 'CREATE',
          action_date: new Date().toISOString(),
          section_id: null,
          before_data: '',
          after_data: JSON.stringify(todoResult),
          entity_type: 'todo',
          todo_id: todoResult.id,
          user_id: user!.id,
        };

        const newLog = await createActivityLog(log);

        if (!newLog) {
          console.warn('Activity log not created');
          return;
        } else {
          console.log('Activity log created successfully');
        }
      } catch (error) {
        console.error('An error occurred while handling submit editing:', error);
      }
    },
    [
      sections,
      addNewTodo,
      user,
      createActivityLog,
      addNewSection,
      scheduleTodoNotification,
      updateExistingTodos,
    ],
  );

  const renderCalendarComponent = useMemo(() => {
    const deleteTodo = async (item: Todo) => {
      await deleteExistingTodos(item.id)
        .then(async result => {
          if (result) {
            console.log('Todo deleted successfully');

            const log: ActivityLog = {
              id: '',
              action_type: 'DELETED' as action_type,
              action_date: new Date().toISOString(),
              section_id: null,
              before_data: JSON.stringify(item),
              after_data: '',
              entity_type: 'todo' as entity_type,
              todo_id: item.id,
              user_id: user!.id,
            };

            const newLog = await createActivityLog(log);

            if (!newLog) {
              console.warn('Activity log not created');
            } else {
              console.log('Activity log created successfully');
            }
          } else {
            console.warn('Todo not deleted');
          }
        })
        .catch(error => {
          console.error('An error occurred while deleting todo:', error);
        });
    };

    const toggleCompleteTodo = (id: string) => {
      const todo = todos.find(todo => todo.id === id);
      if (todo) {
        updateExistingTodos({
          ...todo,
          completed: todo.completed === 1 ? 0 : 1,
          completed_at: todo.completed === 1 ? null : new Date().toString(),
        })
          .then(result => {
            if (result) {
              console.log('Todo updated successfully');

              const log = {
                id: '',
                action_type: 'UPDATED' as action_type,
                action_date: new Date().toISOString(),
                section_id: null,
                before_data: JSON.stringify(todo),
                after_data: JSON.stringify(result),
                entity_type: 'todo' as entity_type,
                todo_id: id,
                user_id: user!.id,
              };

              createActivityLog(log)
                .then(newLog => {
                  if (!newLog) {
                    console.warn('Activity log not created');
                  } else {
                    console.log('Activity log created successfully');
                  }
                })
                .catch(error => {
                  console.error('An error occurred while creating activity log:', error);
                });
            } else {
              console.warn('Todo not updated');
            }
          })
          .catch(error => {
            console.error('An error occurred while updating todo:', error);
          });
      }
    };
    const handleEditModalDismiss = async (selectedTodo: Todo, updatedTodo: Todo) => {
      if (selectedTodo.type === 'google') {
        console.log('Google Calendar event cannot be edited yet');
        return;
      }
      // Check if the todo has been updated using deep comparison
      if (!isEqual(updatedTodo, selectedTodo)) {
        const message = await updateTodoWithNotification(selectedTodo, updatedTodo);

        if (message.status === 'error') return Alert.alert('Error', message.message);

        const log = {
          id: '',
          action_type: 'UPDATED' as action_type,
          action_date: new Date().toISOString(),
          section_id: null,
          before_data: JSON.stringify(selectedTodo),
          after_data: JSON.stringify(updatedTodo),
          entity_type: 'todo' as entity_type,
          todo_id: selectedTodo.id,
          user_id: user!.id,
        };

        const newLog = await createActivityLog(log);

        if (!newLog) {
          console.warn('Activity log not created');
        } else {
          console.log('Activity log created successfully');
        }
      }
    };

    switch (mode) {
      case 'day':
        return (
          <DailyCalendar
            events={timelineTodoEvents}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            colors={colors}
            onSubmitEditing={handleSubmitEditing}
            sections={sections}
            onTimeLineSubmitEditing={handleTimeLineSubmitEditing}
          />
        );
      case 'week':
        return (
          <WeekCalendar
            selectedDate={selectedDate}
            events={weekTimelineEvents}
            setSelectedDate={setSelectedDate}
            colors={colors}
            onSubmitEditing={handleSubmitEditing}
            sections={sections}
            onWeekCalendarSubmitEditing={handleWeekCalendarSubmitEditing}
          />
        );
      case 'agenda':
        return (
          <AgendaCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            colors={colors}
            monthlyTodoRecord={monthlyTodoRecord}
            toggleCompleteTodo={toggleCompleteTodo}
            updateExistingTodos={updateExistingTodos}
            deleteTodo={deleteTodo}
            sections={sections}
            onDismiss={handleEditModalDismiss}
            onSubmitEditing={handleSubmitEditing}
          />
        );
      case 'month':
      default:
        return (
          <MonthCalendar
            monthlyTodoArray={monthlyTodoArray}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            colors={colors}
            handleEndDrag={handleEndDrag}
            toggleCompleteTodo={toggleCompleteTodo}
            updateExistingTodos={updateExistingTodos}
            deleteTodo={deleteTodo}
            sections={sections}
            onDismiss={handleEditModalDismiss}
            onSubmitEditing={handleSubmitEditing}
          />
        );
    }
  }, [
    mode,
    deleteExistingTodos,
    user,
    createActivityLog,
    todos,
    updateExistingTodos,
    updateTodoWithNotification,
    timelineTodoEvents,
    selectedDate,
    colors,
    handleSubmitEditing,
    sections,
    handleTimeLineSubmitEditing,
    weekTimelineEvents,
    handleWeekCalendarSubmitEditing,
    monthlyTodoRecord,
    monthlyTodoArray,
    handleEndDrag,
  ]);

  const onMenuPress = useCallback(() => setExpanded(prev => !prev), []);

  const renderButton = (label: string, icon: string, modeCheck: Mode) => (
    <TouchableOpacity
      testID={`mode-${modeCheck}`}
      key={modeCheck}
      onPress={() => changeMode(modeCheck)}
      style={[
        styles.buttonContainer,
        mode === modeCheck && {
          borderBottomColor: colors.tertiary,
          borderBottomWidth: 2,
        },
      ]}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={mode === modeCheck ? icon : `${icon}-outline`}
          size={30}
          color={mode === modeCheck ? colors.tertiary : colors.onBackground}
        />
        <Text style={{color: mode === modeCheck ? colors.tertiary : colors.onBackground}}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Host>
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Appbar.Header>
          <Appbar.Content title={dayjs(selectedDate).format('MMM YYYY')} />
          <Appbar.Action
            testID="mode-menu"
            icon={
              mode === 'month'
                ? 'calendar-month'
                : mode === 'day'
                  ? 'view-day'
                  : mode === 'week'
                    ? 'view-week'
                    : mode === 'agenda'
                      ? 'view-agenda'
                      : 'calendar-month-outline'
            }
            onPress={onMenuPress}
          />
          <Appbar.Action icon="dots-vertical" onPress={() => {}} />
        </Appbar.Header>
        <Animated.View style={[animatedStyle]}>
          <View style={styles.buttonRow}>
            {renderButton('Month', 'calendar-month', 'month')}
            {renderButton('Day', 'view-day', 'day')}
            {renderButton('Week', 'view-week', 'week')}
            {renderButton('Agenda', 'view-agenda', 'agenda')}
          </View>
        </Animated.View>
        {renderCalendarComponent}
      </View>
    </Host>
  );
};

export default CalendarPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginEnd: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  iconContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
