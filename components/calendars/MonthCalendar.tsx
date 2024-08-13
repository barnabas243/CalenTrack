import React, {createRef, MutableRefObject, PureComponent} from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import {ExpandableCalendar, CalendarProvider} from 'react-native-calendars';
import {SwiperFlatList} from 'react-native-swiper-flatlist';
import {Text} from 'react-native-paper';
import ToDoItem from '../ToDoItem';
import {MonthlyTodo, TodoItem} from '@/store/todo/types';
import {MarkedDates} from 'react-native-calendars/src/types';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import DraggableFlatList, {RenderItemParams, ScaleDecorator} from 'react-native-draggable-flatlist';
import dayjs from 'dayjs';
import {SwipeableItemImperativeRef} from 'react-native-swipeable-item';
import EditTodoModal from '../modals/EditTodoModal';
import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import EditTodoModalContent from '../modals/EditTodoModalContent';
import {SectionItem} from '@/store/section/types';
import {isEqual} from 'lodash';
import AddTodoModal from '../modals/addTodoModal';
import AddTodoFAB from '../addTodoFAB';
import DraggableItemPlaceholder from '../DraggableItemPlaceholder';

interface MonthCalendarProps {
  monthlyTodoArray: MonthlyTodo[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  colors: MD3Colors;
  handleEndDrag: (results: TodoItem[], name: string | Date) => void;
  updateExistingTodos: (todos: TodoItem[]) => void;
  deleteTodo: (id: string) => void;
  toggleCompleteTodo: (id: string) => void;
  sections: SectionItem[];
  onDismiss: (selectedTodo: TodoItem, updatedTodo: TodoItem) => void;
  onSubmitEditing: (todo: TodoItem) => void;
}

interface MonthCalendarState {
  markedDates: MarkedDates;
  currentDate: string;
  isAddTodoModalVisible: boolean;
}

class MonthCalendar extends PureComponent<MonthCalendarProps, MonthCalendarState> {
  private swiperRef = createRef<SwiperFlatList>();
  private todoItemRefs: MutableRefObject<Map<string, SwipeableItemImperativeRef>>;
  private editBottomSheetRef = createRef<BottomSheetModal>();

  constructor(props: MonthCalendarProps) {
    super(props);
    this.state = {
      markedDates: this.calculateMarkedDates(props.monthlyTodoArray),
      currentDate: props.selectedDate,
      isAddTodoModalVisible: false,
    };
    this.todoItemRefs = {
      current: new Map<string, SwipeableItemImperativeRef>(),
    } as MutableRefObject<Map<string, SwipeableItemImperativeRef>>;
  }

  componentDidUpdate(prevProps: MonthCalendarProps) {
    if (prevProps.monthlyTodoArray !== this.props.monthlyTodoArray) {
      this.setState({
        markedDates: this.calculateMarkedDates(this.props.monthlyTodoArray),
      });
    }
  }

  calculateMarkedDates = (monthlyTodoArray: MonthlyTodo[]): MarkedDates => {
    return monthlyTodoArray.reduce((acc, item) => {
      if (item.data.length > 0) {
        acc[item.dueDate] = {marked: true};
      }
      return acc;
    }, {} as MarkedDates);
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

  openEditBottomSheet = (item: TodoItem) => {
    if (this.editBottomSheetRef.current) {
      this.editBottomSheetRef.current.present(item);
    } else {
      console.warn('editBottomSheetRef is null');
    }
  };

  handleEditModalDismiss = async (selectedTodo: TodoItem, updatedTodo: TodoItem) => {
    // Check if the todo has been updated using deep comparison
    if (!isEqual(updatedTodo, selectedTodo)) {
      this.props.updateExistingTodos([updatedTodo]);
    }
  };

  renderTodoItem = (params: RenderItemParams<TodoItem>) => (
    <ScaleDecorator>
      <ToDoItem
        {...params}
        onToggleComplete={this.props.toggleCompleteTodo}
        openEditBottomSheet={this.openEditBottomSheet}
        deleteTodo={this.props.deleteTodo}
        sections={this.props.sections}
        colors={this.props.colors}
        itemRefs={this.todoItemRefs}
      />
    </ScaleDecorator>
  );

  showAddTodoModal = () => {
    this.setState({isAddTodoModalVisible: true});
  };
  hideAddTodoModal = () => {
    this.setState({isAddTodoModalVisible: false});
  };

  setIsAddTodoModalVisible = (isVisible: boolean) => {
    this.setState({isAddTodoModalVisible: isVisible});
  };

  render() {
    const {monthlyTodoArray, selectedDate, colors} = this.props;
    const {markedDates, isAddTodoModalVisible} = this.state;
    const initialIndex = this.findIndexByDate(selectedDate);

    return (
      <>
        <CalendarProvider
          date={selectedDate}
          style={styles.container}
          showTodayButton
          onDateChanged={this.onDateChanged}>
          <ExpandableCalendar
            initialPosition={ExpandableCalendar.positions.OPEN}
            theme={{
              calendarBackground: colors.background,
              dayTextColor: colors.secondary,
              textDisabledColor: colors.surfaceVariant,
              arrowColor: colors.error,
              textSectionTitleColor: colors.secondary,
              monthTextColor: colors.secondary,
              todayDotColor: colors.error,
              todayTextColor: colors.error,
              selectedDayBackgroundColor: colors.onErrorContainer,
              selectedDayTextColor: colors.onError,
            }}
            firstDay={1}
            markedDates={markedDates}
            onDayPress={this.onDayPress}
          />
          <SwiperFlatList
            ref={this.swiperRef}
            data={monthlyTodoArray}
            initialNumToRender={1}
            index={initialIndex}
            onChangeIndex={this.onChangeIndex}
            renderItem={({item}) => (
              <DraggableFlatList
                data={item.data}
                showsVerticalScrollIndicator={false}
                renderItem={this.renderTodoItem}
                keyExtractor={item => item.id.toString()}
                initialNumToRender={4}
                onDragEnd={({data}) => this.props.handleEndDrag(data, dayjs(item.dueDate).toDate())}
                activationDistance={20}
                containerStyle={[styles.todoList, {backgroundColor: colors.background}]}
                ListEmptyComponent={
                  <View style={styles.centerContainer}>
                    <Text>No tasks for this date</Text>
                  </View>
                }
                renderPlaceholder={() => <DraggableItemPlaceholder />}
              />
            )}
          />
        </CalendarProvider>

        <BottomSheetModalProvider>
          <AddTodoModal
            isVisible={isAddTodoModalVisible}
            setIsVisible={this.setIsAddTodoModalVisible}
            onBackdropPress={this.hideAddTodoModal}
            onSubmitEditing={this.props.onSubmitEditing}
            sections={this.props.sections}
            propSelectedDueDate={dayjs(selectedDate).toDate()}
          />
          <EditTodoModal
            ref={this.editBottomSheetRef}
            onDismiss={() => console.log('dismissed modal')}>
            {data => (
              <EditTodoModalContent
                todo={data.data}
                onDismiss={this.props.onDismiss}
                sections={this.props.sections}
                colors={colors}
              />
            )}
          </EditTodoModal>
        </BottomSheetModalProvider>
        <AddTodoFAB onPress={this.showAddTodoModal} />
      </>
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
