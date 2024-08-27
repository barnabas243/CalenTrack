import React, {createRef, MutableRefObject, PureComponent} from 'react';
import {StyleSheet, View, Dimensions, Appearance} from 'react-native';
import {ExpandableCalendar, CalendarProvider} from 'react-native-calendars';
import {SwiperFlatList} from 'react-native-swiper-flatlist';
import {Text} from 'react-native-paper';
import ToDoItem from '../ToDoItem';
import {MonthlyTodo} from '@/store/todo/types';
import {MarkedDates} from 'react-native-calendars/src/types';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import DraggableFlatList, {RenderItemParams, ScaleDecorator} from 'react-native-draggable-flatlist';

import {SwipeableItemImperativeRef} from 'react-native-swipeable-item';
import EditTodoModal from '../modals/EditTodoModal';
import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import EditTodoModalContent from '../modals/EditTodoModalContent';
import {isEqual} from 'lodash';
import AddTodoModal from '../modals/addTodoModal';
import AddTodoFAB from '../addTodoFAB';
import DraggableItemPlaceholder from '../DraggableItemPlaceholder';
import {Section, Todo} from '@/powersync/AppSchema';
import {getColorForSection, loadSectionColors} from '@/utils/settingUtils';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(timezone);
interface MonthCalendarProps {
  monthlyTodoArray: MonthlyTodo[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  colors: MD3Colors;
  handleEndDrag: (results: Todo[], name: string | Date) => void;
  updateExistingTodos: (todos: Todo) => void;
  deleteTodo: (id: string) => void;
  toggleCompleteTodo: (id: string) => void;
  sections: Section[];
  onDismiss: (selectedTodo: Todo, updatedTodo: Todo) => void;
  onSubmitEditing: (todo: Todo) => void;
}

interface MonthCalendarState {
  markedDates: MarkedDates;
  currentDate: string;
  isAddTodoModalVisible: boolean;
  isDarkMode: boolean;
  parentId: string;
}

class MonthCalendar extends PureComponent<MonthCalendarProps, MonthCalendarState> {
  private swiperRef = createRef<SwiperFlatList>();
  private todoItemRefs: MutableRefObject<Map<string, SwipeableItemImperativeRef>>;
  private editBottomSheetRef = createRef<BottomSheetModal>();

  constructor(props: MonthCalendarProps) {
    super(props);
    this.state = {
      markedDates: {},
      currentDate: props.selectedDate,
      isAddTodoModalVisible: false,
      isDarkMode: Appearance.getColorScheme() === 'dark',
      parentId: '',
    };
    this.todoItemRefs = {
      current: new Map<string, SwipeableItemImperativeRef>(),
    } as MutableRefObject<Map<string, SwipeableItemImperativeRef>>;
  }

  async componentDidMount() {
    // Load section colors and calculate marked dates
    await this.loadSectionColorsAndMarkedDates();
  }

  async componentDidUpdate(prevProps: MonthCalendarProps) {
    if (prevProps.monthlyTodoArray !== this.props.monthlyTodoArray) {
      await this.loadSectionColorsAndMarkedDates();
    }
  }

  loadSectionColorsAndMarkedDates = async () => {
    // Calculate marked dates with colors
    await loadSectionColors();
    const markedDates = await this.calculateMarkedDates(this.props.monthlyTodoArray);
    this.setState({markedDates});
  };

  calculateMarkedDates = async (monthlyTodoArray: MonthlyTodo[]) => {
    const markedDates: MarkedDates = {};

    await Promise.all(
      monthlyTodoArray.map(async item => {
        if (item.data.length > 0) {
          await Promise.all(
            item.data.map(async todo => {
              // Convert to dayjs object with time zone
              const startDate = dayjs.tz(todo.start_date);
              const endDate = dayjs.tz(todo.due_date);
              const color = todo.section_id
                ? await getColorForSection(todo.section_id, this.state.isDarkMode)
                : '';

              let currentDate = startDate;

              // Iterate through the range of dates from startDate to endDate (inclusive)
              while (currentDate.isSame(endDate, 'day') || currentDate.isBefore(endDate)) {
                const dateStr = currentDate.format('YYYY-MM-DD'); // Convert dayjs object to YYYY-MM-DD string

                // Initialize the entry for the current date if it does not exist
                if (!markedDates[dateStr]) {
                  markedDates[dateStr] = {
                    periods: [],
                  };
                }

                // Add the period data for the current date
                markedDates[dateStr].periods!.push({
                  color,
                  startingDay: currentDate.isSame(startDate, 'day'),
                  endingDay: currentDate.isSame(endDate, 'day'),
                });

                // Move to the next day
                currentDate = currentDate.add(1, 'day');
              }
            }),
          );
        }
      }),
    );

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

  openEditBottomSheet = async (item: Todo) => {
    if (this.editBottomSheetRef.current) {
      await new Promise(resolve => {
        this.editBottomSheetRef.current?.close();

        // Resolve after a short delay to ensure it closes properly
        setTimeout(resolve, 300); // Adjust the delay if needed
      });

      const subItems: Todo[] = this.props.monthlyTodoArray.reduce((acc: Todo[], todo) => {
        const filteredSubItems = todo.data.filter(subItem => subItem.parent_id === item.id);
        return acc.concat(filteredSubItems);
      }, []);

      const subItemsCount = subItems.length;

      // Prepare the new item to show
      const itemToPresent = subItemsCount > 0 ? {...item, subItems} : item;

      this.editBottomSheetRef.current.present(itemToPresent);
    } else {
      console.warn('editBottomSheetRef is null');
    }
  };

  handleEditModalDismiss = async (selectedTodo: Todo, updatedTodo: Todo) => {
    this.editBottomSheetRef.current?.dismiss();

    if (selectedTodo.type === 'google') {
      console.log('Google Calendar event cannot be edited yet');
      return;
    }
    // Check if the todo has been updated using deep comparison
    if (!isEqual(updatedTodo, selectedTodo)) {
      this.props.updateExistingTodos(updatedTodo);
    }
  };

  renderTodoItem = (params: RenderItemParams<Todo>) => (
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

  handleAddSubTodo = async (parent_id: string) => {
    if (!parent_id) return;

    this.setState({parentId: parent_id}, () => {
      // This callback runs after the state has been updated
      this.showAddTodoModal();
    });
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
            markingType="multi-period"
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
            propParentId={this.state.parentId}
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
                deleteTodo={this.props.deleteTodo}
                toggleCompleteTodo={this.props.toggleCompleteTodo}
                openEditBottomSheet={this.openEditBottomSheet}
                onPress={this.handleAddSubTodo}
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
