import dayjs from 'dayjs';
import React, {createRef, PureComponent} from 'react';
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import {Divider, Icon, Text} from 'react-native-paper';
import {Agenda, DateData} from 'react-native-calendars';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import {debounce, isEqual} from 'lodash';
import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import EditTodoModal from '../modals/EditTodoModal';
import EditTodoModalContent from '../modals/EditTodoModalContent';
import {SectionItem} from '@/store/section/types';
import {TodoItem} from '@/store/todo/types';
interface State {
  items?: Record<string, TodoItem[]>;
}

interface Props {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  colors: MD3Colors;
  monthlyTodoRecord: Record<string, TodoItem[]>;
  updateExistingTodos: (todos: TodoItem[]) => void;
  onDismiss: (selectedTodo: TodoItem, updatedTodo: TodoItem) => void;
  sections: SectionItem[];
  toggleCompleteTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
}
export default class AgendaCalendar extends PureComponent<Props, State> {
  private agendaRef = createRef<Agenda>();
  private editBottomSheetRef = createRef<BottomSheetModal>();

  state: State = {
    items: {},
  };

  componentDidUpdate(prevProps: Props) {
    if (!isEqual(prevProps.monthlyTodoRecord, this.props.monthlyTodoRecord)) {
      console.log('monthlyTodoRecord updated');
      const selectedDate = dayjs(this.props.selectedDate);
      const dateData: DateData = {
        dateString: selectedDate.format('YYYY-MM-DD'),
        day: selectedDate.date(),
        month: selectedDate.month() + 1, // month is 0-indexed in dayjs
        year: selectedDate.year(),
        timestamp: selectedDate.valueOf(),
      };
      this.loadItemsForMonth(dateData);
    }
  }

  onDayPress = (day: DateData) => {
    if (this.props.selectedDate !== day.dateString) {
      this.props.setSelectedDate(day.dateString);
    }
  };

  onMonthChange = (date: DateData) => {
    this.props.setSelectedDate(date.dateString);
  };

  onDayChange = debounce((day: DateData) => {
    if (this.props.selectedDate !== day.dateString) {
      this.props.setSelectedDate(day.dateString);
    }
  }, 800); // Adjust the delay (in milliseconds) as needed

  openEditBottomSheet = (item: TodoItem) => {
    if (this.editBottomSheetRef.current) {
      this.editBottomSheetRef.current.present(item);
    } else {
      console.warn('editBottomSheetRef is null');
    }
  };

  getSectionNameById = (id: number) => {
    const section = this.props.sections.find(section => section.id === id);
    return section ? section.name : 'Unknown';
  };
  handleEditModalDismiss = async (selectedTodo: TodoItem, updatedTodo: TodoItem) => {
    // Check if the todo has been updated using deep comparison
    if (!isEqual(updatedTodo, selectedTodo)) {
      this.props.updateExistingTodos([updatedTodo]);
    }
  };
  render() {
    return (
      <>
        <Agenda
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
            agendaDayNumColor: this.props.colors.secondary,
            agendaTodayColor: this.props.colors.error,
            agendaKnobColor: this.props.colors.secondary,
            reservationsBackgroundColor: this.props.colors.background,
          }}
          ref={this.agendaRef}
          items={this.state.items}
          loadItemsForMonth={this.loadItemsForMonth}
          selected={this.props.selectedDate}
          renderItem={this.renderItem}
          renderEmptyDate={this.renderEmptyDate}
          rowHasChanged={this.rowHasChanged}
          showClosingKnob={true}
          onDayChange={this.onDayChange}
          onDayPress={this.onDayPress}
        />
        <BottomSheetModalProvider>
          <EditTodoModal
            ref={this.editBottomSheetRef}
            onDismiss={() => console.log('dismissed modal')}>
            {data => (
              <EditTodoModalContent
                todo={data.data}
                onDismiss={this.props.onDismiss}
                sections={this.props.sections}
                colors={this.props.colors}
              />
            )}
          </EditTodoModal>
        </BottomSheetModalProvider>
      </>
    );
  }
  loadItemsForMonth = (day: DateData) => {
    console.log('loadItemsForMonth', day);

    // Calculate the range from 12 months before to 12 months after
    const startDate = dayjs(day.timestamp).subtract(12, 'month').startOf('month');
    const endDate = dayjs(day.timestamp).add(12, 'month').endOf('month');

    // Initialize items with existing state or as an empty object
    const newItems: Record<string, TodoItem[]> = {};

    // Iterate over the range of dates
    for (
      let currentDate = startDate;
      currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day');
      currentDate = currentDate.add(1, 'day')
    ) {
      const dateStr = this.timeToString(currentDate.valueOf());
      newItems[dateStr] = this.props.monthlyTodoRecord[dateStr] || [];
    }

    // Update the state only if there are changes
    if (!isEqual(this.state.items, newItems)) {
      this.setState({items: newItems});
    }
  };

  renderItem = (reservation: TodoItem, isFirst: boolean) => {
    const color = isFirst ? this.props.colors.primary : this.props.colors.inversePrimary;
    const borderColor = isFirst ? this.props.colors.primary : this.props.colors.outline;

    const startDate = dayjs(reservation.start_date);
    const dueDate = dayjs(reservation.due_date);

    // Check if start_date is valid, if not, default to start time 00:00 of due_date
    const startTime = startDate.isValid()
      ? startDate.format('h:mm A')
      : dueDate.startOf('day').format('h:mm A');
    const dueTime = dueDate.isValid() ? dueDate.format('h:mm A') : 'No Due Date';

    return (
      <TouchableOpacity
        key={reservation.id}
        style={[styles.item, {backgroundColor: this.props.colors.background, borderColor}]}
        onPress={() => this.openEditBottomSheet(reservation)}>
        <View style={styles.itemContent}>
          <TouchableOpacity onPress={() => this.props.toggleCompleteTodo(reservation.id!)}>
            <Icon
              source={reservation.completed ? 'check-circle' : 'checkbox-blank-circle-outline'}
              size={24}
              color={color}
            />
          </TouchableOpacity>
          <View style={styles.textContainer}>
            {reservation.due_date && (
              <Text variant="labelLarge" style={{color: this.props.colors.secondary}}>
                {startTime} — {dueTime}
              </Text>
            )}
            <Text variant="titleLarge" style={{color}}>
              {reservation.title}
            </Text>
            {reservation.summary && (
              <Text variant="labelLarge" style={{color: this.props.colors.secondary}}>
                {reservation.summary}
              </Text>
            )}
          </View>
          {reservation.section_id && (
            <Text
              variant="labelSmall"
              style={[styles.sectionName, {color: this.props.colors.outline}]}>
              {this.getSectionNameById(reservation.section_id)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  renderEmptyDate = () => {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingTop: 20,
        }}>
        <Divider bold horizontalInset />
      </View>
    );
  };

  rowHasChanged = (r1: TodoItem, r2: TodoItem) => {
    return !isEqual(r1, r2);
  };

  timeToString(time: number) {
    const date = new Date(time);
    return date.toISOString().split('T')[0];
  }
}

const styles = StyleSheet.create({
  emptyDate: {
    height: 15,
    flex: 1,
    paddingTop: 30,
  },
  customDay: {
    margin: 10,
    fontSize: 24,
    color: 'green',
  },
  dayItem: {
    marginLeft: 34,
  },
  item: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
  },
  dueDate: {
    fontSize: 12,
  },
  sectionName: {
    position: 'absolute',
    bottom: 0,
    right: 5,
  },
});
