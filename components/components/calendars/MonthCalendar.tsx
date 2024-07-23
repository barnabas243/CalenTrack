import {TodoItem} from '@/contexts/TodoContext.types';
import React, {PureComponent} from 'react';
import {StyleSheet, View, Text, FlatList, ListRenderItem} from 'react-native';
import {ExpandableCalendar, CalendarProvider} from 'react-native-calendars';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import GestureRecognizer from 'react-native-swipe-gestures';

interface MonthCalendarProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  todoSortedByDate: Record<string, TodoItem[]>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  marked: Record<string, any>;
  onDayPress: (date: {dateString: string}) => void;
  renderTodoItem: ListRenderItem<TodoItem>;
}

class MonthCalendar extends PureComponent<MonthCalendarProps> {
  handleCalendarToggled = (opened: boolean) => {
    this.setState({isClosed: !opened});
  };

  render() {
    const {
      onSwipeLeft,
      onSwipeRight,
      todoSortedByDate,
      selectedDate,
      setSelectedDate,
      marked,
      onDayPress,
      renderTodoItem,
    } = this.props;
    console.log('why is still rendering');
    return (
      <GestureHandlerRootView style={styles.container}>
        <CalendarProvider
          date={selectedDate}
          showTodayButton
          onDateChanged={date => setSelectedDate(date)}>
          <ExpandableCalendar
            initialPosition={ExpandableCalendar.positions.OPEN}
            onCalendarToggled={this.handleCalendarToggled}
            firstDay={1}
            markedDates={marked}
            onDayPress={onDayPress}
          />
          <GestureRecognizer
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
            style={styles.container}>
            <FlatList
              showsVerticalScrollIndicator
              data={todoSortedByDate[selectedDate] || []}
              renderItem={renderTodoItem}
              initialNumToRender={10}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.todoList}
              ListEmptyComponent={
                <View style={styles.centerContainer}>
                  <Text>No tasks for this date</Text>
                </View>
              }
            />
          </GestureRecognizer>
        </CalendarProvider>
      </GestureHandlerRootView>
    );
  }
}

export default MonthCalendar;

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
  itemSeparator: {
    height: 5,
    marginBottom: 20,
  },
  box: {
    width: 100,
    height: 100,
    backgroundColor: '#b58df1',
    borderRadius: 20,
  },
});
