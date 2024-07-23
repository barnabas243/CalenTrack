import React, {useMemo, useState} from 'react';
import {StyleSheet, View, ScrollView, TouchableOpacity} from 'react-native';
import {Text, useTheme} from 'react-native-paper';
import {DateData} from 'react-native-calendars';

import dayjs from 'dayjs';
import {TodoItem} from '@/contexts/TodoContext.types';
import {useTodo} from '@/contexts/TodoContext';
import ToDoItem from '@/components/ToDoItem';
import MonthCalendar from '@/components/calendars/MonthCalendar';
import DailyCalendar from '@/components/calendars/DailyCalendar';
import AgendaCalendar from '@/components/calendars/AgendaCalendar';
import WeekCalendar from '@/components/calendars/WeekCalendar';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Mode} from 'react-native-big-calendar';

type MarkedDates = {
  [key: string]: {marked: boolean};
};

const CalendarPage = () => {
  const {colors} = useTheme();
  const {todoSortedByDate} = useTodo();
  const [mode, setMode] = useState<Mode>('month');
  const [selectedDate, setSelectedDate] = useState(dayjs(new Date()).format('YYYY-MM-DD'));

  const marked = useMemo<MarkedDates>(() => {
    const markedDates: MarkedDates = {};
    for (const date in todoSortedByDate) {
      markedDates[date] = {marked: true};
    }
    return markedDates;
  }, [todoSortedByDate]);

  const renderTodoItem = ({item}: {item: TodoItem}) => <ToDoItem todo={item} />;

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const changeMode = (m: Mode) => {
    setMode(m);
  };

  const onSwipeLeft = () => {
    setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'));
  };

  const onSwipeRight = () => {
    setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'));
  };

  const renderCalendarComponent = () => {
    switch (mode) {
      case 'month':
        return (
          <MonthCalendar
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
            todoSortedByDate={todoSortedByDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            marked={marked}
            onDayPress={onDayPress}
            renderTodoItem={renderTodoItem}
          />
        );
      case 'day':
        return <DailyCalendar />;
      case 'week':
        return <WeekCalendar />;
      case 'schedule':
        return (
          <AgendaCalendar
            onMonthChange={(month: string) => {
              console.log('month changed');
            }}
          />
        );
      default:
        return <DailyCalendar />;
    }
  };
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View>
        <Text>{selectedDate}</Text>
      </View>
      <View>
        <Text style={styles.headline}>Calendar Mode</Text>
        <ScrollView horizontal>
          <View style={styles.buttonRow}>
            {['month', 'day', 'week', 'schedule'].map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => changeMode(m as Mode)}
                style={[
                  styles.buttonContainer,
                  mode === m && {
                    borderBottomColor: colors.onPrimary,
                    borderBottomWidth: 3,
                  },
                ]}>
                <Text>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      {renderCalendarComponent()}
    </GestureHandlerRootView>
  );
};

export default CalendarPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  todoList: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 10,
  },
  headline: {
    fontSize: 16,
  },
  itemSeparator: {
    height: 5,
    marginBottom: 20,
  },
});
