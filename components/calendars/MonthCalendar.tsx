import React, {createRef, PureComponent} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ListRenderItem,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {ExpandableCalendar, CalendarProvider} from 'react-native-calendars';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SwiperFlatList} from 'react-native-swiper-flatlist';
import {Text} from 'react-native-paper';
import ToDoItem from '../ToDoItem';
import {MonthlyTodo, TodoItem} from '@/contexts/TodoContext.types';
import {MarkedDates} from 'react-native-calendars/src/types';
import {throttle} from 'lodash';

interface MonthCalendarProps {
  monthlyTodoArray: MonthlyTodo[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

interface MonthCalendarState {
  currentDate: string;
  markedDates: MarkedDates;
}

class MonthCalendar extends PureComponent<MonthCalendarProps, MonthCalendarState> {
  private swiperRef = createRef<SwiperFlatList>();

  constructor(props: MonthCalendarProps) {
    super(props);
    this.state = {
      currentDate: props.selectedDate,
      markedDates: this.calculateMarkedDates(props.monthlyTodoArray),
    };
  }

  componentDidUpdate(prevProps: MonthCalendarProps) {
    // Update marked dates if monthlyTodoArray changes
    if (prevProps.monthlyTodoArray !== this.props.monthlyTodoArray) {
      this.setState({
        markedDates: this.calculateMarkedDates(this.props.monthlyTodoArray),
      });
    }
  }

  calculateMarkedDates = (monthlyTodoArray: MonthlyTodo[]): MarkedDates => {
    const markedDates: MarkedDates = {};
    monthlyTodoArray.forEach(item => {
      const {dueDate} = item;
      if (item.data.length > 0) {
        markedDates[dueDate] = {marked: true};
      }
    });
    return markedDates;
  };

  findIndexByDate = (date: string): number => {
    const exist = this.props.monthlyTodoArray.findIndex(item => item.dueDate === date);
    return exist === -1 ? 0 : exist;
  };

  onDayPress = (date: {dateString: string}) => {
    const index = this.findIndexByDate(date.dateString);
    this.props.setSelectedDate(date.dateString);
    this.swiperRef.current?.scrollToIndex({index});
  };

  onDateChanged = (date: string) => {
    const index = this.findIndexByDate(date);
    this.props.setSelectedDate(date);
    this.swiperRef.current?.scrollToIndex({index});
  };

  onMomentumScrollEnd = (indexObject: {index: number}) => {
    const {index} = indexObject;
    const newDate = this.props.monthlyTodoArray[index]?.dueDate || this.props.selectedDate;
    console.log('onMomentumScrollEnd', index, newDate);
    this.setState({currentDate: newDate});
    this.props.setSelectedDate(newDate);
  };
  renderTodoItem: ListRenderItem<TodoItem> = ({item}) => <ToDoItem todo={item} />;

  render() {
    const {monthlyTodoArray} = this.props;
    const {currentDate, markedDates} = this.state;
    const initialIndex = this.findIndexByDate(this.props.selectedDate);

    return (
      <CalendarProvider date={currentDate} showTodayButton onDateChanged={this.onDateChanged}>
        <ExpandableCalendar
          initialPosition={ExpandableCalendar.positions.OPEN}
          firstDay={1}
          markedDates={markedDates}
          onDayPress={this.onDayPress}
        />
        <SwiperFlatList
          ref={this.swiperRef}
          data={monthlyTodoArray}
          initialNumToRender={10} // Adjust this number based on performance needs
          index={initialIndex}
          // onChangeIndex={this.onChangeIndex}
          onMomentumScrollBegin={() => console.log('onMomentumScrollBegin')}
          onMomentumScrollEnd={index => this.onMomentumScrollEnd(index)}
          renderItem={({item}) => (
            <FlatList
              showsVerticalScrollIndicator={false}
              data={item.data}
              renderItem={this.renderTodoItem}
              initialNumToRender={5} // Adjust as needed for performance
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.todoList}
              ListEmptyComponent={
                <View style={styles.centerContainer}>
                  <Text>No tasks for this date</Text>
                </View>
              }
            />
          )}
        />
      </CalendarProvider>
    );
  }
}

const width = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  todoList: {
    padding: 16,
    justifyContent: 'center',
    width,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
});

export default MonthCalendar;
