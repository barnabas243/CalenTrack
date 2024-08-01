import React, {createRef, PureComponent} from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import {ExpandableCalendar, CalendarProvider} from 'react-native-calendars';
import {SwiperFlatList} from 'react-native-swiper-flatlist';
import {Text, Divider} from 'react-native-paper';
import ToDoItem from '../ToDoItem';
import {MonthlyTodo, TodoItem} from '@/contexts/TodoContext.types';
import {MarkedDates} from 'react-native-calendars/src/types';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import DraggableFlatList, {RenderItemParams} from 'react-native-draggable-flatlist';
import dayjs from 'dayjs';

interface MonthCalendarProps {
  monthlyTodoArray: MonthlyTodo[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  colors: MD3Colors;
  handleEndDrag: (results: TodoItem[], name: string | Date) => void;
}

interface MonthCalendarState {
  markedDates: MarkedDates;
  currentDate: string;
}

let count = 0;

class MonthCalendar extends PureComponent<MonthCalendarProps, MonthCalendarState> {
  private swiperRef = createRef<SwiperFlatList>();

  constructor(props: MonthCalendarProps) {
    super(props);
    this.state = {
      markedDates: this.calculateMarkedDates(props.monthlyTodoArray),
      currentDate: props.selectedDate,
    };
  }

  componentDidUpdate(prevProps: MonthCalendarProps) {
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
    if (this.state.currentDate !== date.dateString) {
      this.setState({currentDate: date.dateString});
      this.props.setSelectedDate(date.dateString);
      this.swiperRef.current?.scrollToIndex({index});
    }
  };

  onDateChanged = (date: string) => {
    const index = this.findIndexByDate(date);
    if (this.state.currentDate !== date) {
      this.setState({currentDate: date});
      this.props.setSelectedDate(date);
      this.swiperRef.current?.scrollToIndex({index});
    }
  };

  onChangeIndex = (item: {index: number; prevIndex: number}) => {
    const {index, prevIndex} = item;
    if (index !== prevIndex) {
      const newDate = this.props.monthlyTodoArray[index]?.dueDate || this.props.selectedDate;
      if (this.state.currentDate !== newDate) {
        this.setState({currentDate: newDate});
        this.props.setSelectedDate(newDate);
      }
    }
  };

  renderTodoItem = (params: RenderItemParams<TodoItem>) => (
    <ToDoItem {...params} colors={this.props.colors} />
  );

  render() {
    console.log('MonthCalendar rendered:', ++count);
    const {monthlyTodoArray} = this.props;
    const {markedDates} = this.state;
    const initialIndex = this.findIndexByDate(this.props.selectedDate);

    return (
      <CalendarProvider
        date={this.props.selectedDate}
        style={styles.container}
        showTodayButton
        onDateChanged={this.onDateChanged}>
        <ExpandableCalendar
          initialPosition={ExpandableCalendar.positions.OPEN}
          theme={{
            calendarBackground: this.props.colors.background,
            dayTextColor: this.props.colors.secondary,
            textDisabledColor: this.props.colors.surfaceVariant,
            arrowColor: this.props.colors.error,
            textSectionTitleColor: this.props.colors.secondary,
            monthTextColor: this.props.colors.secondary,
            todayDotColor: this.props.colors.error,
            todayTextColor: this.props.colors.error,
            selectedDayBackgroundColor: this.props.colors.onErrorContainer,
            selectedDayTextColor: this.props.colors.onError,
          }}
          firstDay={1}
          markedDates={markedDates}
          onDayPress={this.onDayPress}
        />
        <SwiperFlatList
          ref={this.swiperRef}
          data={monthlyTodoArray}
          initialNumToRender={3}
          index={initialIndex}
          onChangeIndex={this.onChangeIndex}
          renderItem={({item}) => (
            <DraggableFlatList
              data={item.data}
              renderItem={this.renderTodoItem}
              keyExtractor={item => item.id.toString()}
              initialNumToRender={5}
              onDragEnd={({data}) => this.props.handleEndDrag(data, dayjs(item.dueDate).toDate())}
              activationDistance={20}
              containerStyle={[styles.todoList, {backgroundColor: this.props.colors.background}]}
              ListEmptyComponent={
                <View style={styles.centerContainer}>
                  <Text>No tasks for this date</Text>
                </View>
              }
              renderPlaceholder={() => (
                <Divider
                  bold
                  style={{
                    backgroundColor: this.props.colors.primary,
                    borderWidth: 1,
                    borderColor: this.props.colors.primary,
                  }}
                />
              )}
            />
            // <FlatList
            //   showsVerticalScrollIndicator={false}
            //   data={item.data}
            //   renderItem={this.renderTodoItem}
            //   disableScrollViewPanResponder
            //   initialNumToRender={5}
            //   keyExtractor={item => item.id.toString()}
            //   contentContainerStyle={styles.todoList}
            //   ListEmptyComponent={
            //     <View style={styles.centerContainer}>
            //       <Text>No tasks for this date</Text>
            //     </View>
            //   }
            // />
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
