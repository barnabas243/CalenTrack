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
import AddTodoFAB from '../addTodoFAB';
import AddTodoModal from '../modals/addTodoModal';
import {Section, Todo} from '@/powersync/AppSchema';
import {getBorderColor} from '../ToDoItem';
import {PriorityType} from '@/store/todo/types';
interface State {
  items?: Record<string, Todo[]>;
  isAddTodoModalVisible: boolean;
  parentId: string;
}

interface Props {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  colors: MD3Colors;
  monthlyTodoRecord: Record<string, Todo[]>;
  updateExistingTodos: (todos: Todo) => void;
  onDismiss: (selectedTodo: Todo, updatedTodo: Todo) => void;
  sections: Section[];
  toggleCompleteTodo: (id: string) => void;
  deleteTodo: (item: Todo) => void;
  onSubmitEditing: (todo: Todo) => void;
}
export default class AgendaCalendar extends PureComponent<Props, State> {
  private agendaRef = createRef<Agenda>();
  private editBottomSheetRef = createRef<BottomSheetModal>();

  state: State = {
    items: {},
    isAddTodoModalVisible: false,
    parentId: '',
  };

  toggleAddTodoModal = (isVisible: boolean) => {
    this.setState({isAddTodoModalVisible: isVisible});
  };

  showAddTodoModal = () => {
    this.setState({isAddTodoModalVisible: true});
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.monthlyTodoRecord !== this.props.monthlyTodoRecord) {
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

  openEditBottomSheet = async (item: Todo) => {
    if (this.editBottomSheetRef.current) {
      await new Promise(resolve => {
        this.editBottomSheetRef.current?.close();

        // Resolve after a short delay to ensure it closes properly
        setTimeout(resolve, 300); // Adjust the delay if needed
      });

      const subItems: Todo[] = [];

      Object.values(this.props.monthlyTodoRecord).forEach(todos => {
        todos.forEach(subItem => {
          if (subItem.parent_id === item.id) {
            subItems.push(subItem);
          }
        });
      });

      const subItemsCount = subItems.length;

      // Prepare the new item to show
      const itemToPresent = subItemsCount > 0 ? {...item, subItems} : item;

      this.editBottomSheetRef.current.present(itemToPresent);
    } else {
      console.warn('editBottomSheetRef is null');
    }
  };

  handleAddSubTodo = async (parent_id: string) => {
    if (!parent_id) return;

    this.setState({parentId: parent_id}, () => {
      // This callback runs after the state has been updated
      this.showAddTodoModal();
    });
  };

  getSectionNameById = (id: string) => {
    const section = this.props.sections.find(section => section.id === id);
    return section ? section.name : 'Unknown';
  };
  handleEditModalDismiss = async (selectedTodo: Todo, updatedTodo: Todo) => {
    this.editBottomSheetRef.current?.dismiss();
    // Check if the todo has been updated using deep comparison
    if (!isEqual(updatedTodo, selectedTodo)) {
      this.props.updateExistingTodos(updatedTodo);
    }
  };
  render() {
    const {isAddTodoModalVisible} = this.state;
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
          <AddTodoModal
            isVisible={isAddTodoModalVisible}
            setIsVisible={this.toggleAddTodoModal} // Use the toggle method for visibility
            onBackdropPress={() => this.toggleAddTodoModal(false)}
            onSubmitEditing={this.props.onSubmitEditing}
            sections={this.props.sections}
            propSelectedStartDate={dayjs(this.props.selectedDate).startOf('day').toDate()}
            propSelectedDueDate={dayjs(this.props.selectedDate).endOf('day').toDate()}
            propParentId={this.state.parentId}
          />
          <EditTodoModal ref={this.editBottomSheetRef}>
            {data => (
              <EditTodoModalContent
                todo={data.data}
                onDismiss={this.props.onDismiss}
                sections={this.props.sections}
                colors={this.props.colors}
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
  loadItemsForMonth = (day: DateData) => {
    // Calculate the range from 12 months before to 12 months after
    const startDate = dayjs(day.timestamp).subtract(12, 'month').startOf('month');
    const endDate = dayjs(day.timestamp).add(12, 'month').endOf('month');

    // Initialize items with existing state or as an empty object
    const newItems: Record<string, Todo[]> = {};

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

  renderItem = (reservation: Todo, isFirst: boolean) => {
    const color = this.props.colors.primary;
    const borderColor = getBorderColor(reservation.priority as PriorityType);

    const startDate = dayjs(reservation.start_date);
    const dueDate = dayjs(reservation.due_date);

    // Check if start_date is valid, if not, default to start time 00:00 of due_date
    const startTime = startDate.isValid()
      ? startDate.format('h:mm A')
      : dueDate.startOf('day').format('h:mm A');
    const dueTime = dueDate.isValid() ? dueDate.format('h:mm A') : 'No Due Date';

    console.log('reservation type ', reservation.type);
    return (
      <TouchableOpacity
        key={reservation.id}
        style={[styles.item, {backgroundColor: this.props.colors.background, borderColor}]}
        onPress={() => this.openEditBottomSheet(reservation)}>
        <View style={styles.itemContent}>
          {reservation.type === 'todo' ? (
            <TouchableOpacity onPress={() => this.props.toggleCompleteTodo(reservation.id!)}>
              <Icon
                source={reservation.completed ? 'check-circle' : 'checkbox-blank-circle-outline'}
                size={24}
                color={color}
              />
            </TouchableOpacity>
          ) : null}
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
              <Text
                variant="labelLarge"
                numberOfLines={1}
                style={{color: this.props.colors.secondary, marginBottom: 20}}>
                {reservation.summary}
              </Text>
            )}
          </View>

          <Text
            variant="labelSmall"
            style={[styles.sectionName, {color: this.props.colors.outline}]}>
            {reservation.type === 'todo'
              ? this.getSectionNameById(reservation?.section_id)
              : reservation.type}
          </Text>
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

  rowHasChanged = (r1: Todo, r2: Todo) => {
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
