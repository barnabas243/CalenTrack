import {TodoItem} from '@/contexts/TodoContext.types';
import dayjs from 'dayjs';
import React, {createRef, PureComponent} from 'react';
import {Alert, StyleSheet, View, TouchableOpacity, ScrollView} from 'react-native';
import {Text} from 'react-native-paper';
import {Agenda, DateData, AgendaEntry} from 'react-native-calendars';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import {debounce} from 'lodash';

interface State {
  items?: Record<string, TodoItem[]>;
}

interface Props {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  colors: MD3Colors;
  monthlyTodoRecord: Record<string, TodoItem[]>;
}
export default class AgendaCalendar extends PureComponent<Props, State> {
  private agendaRef = createRef<Agenda>();

  state: State = {
    items: {},
  };

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
  render() {
    return (
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
        pastScrollRange={50}
        items={this.state.items}
        loadItemsForMonth={this.loadItemsForMonth}
        selected={this.props.selectedDate}
        renderItem={this.renderItem}
        renderEmptyDate={this.renderEmptyDate}
        rowHasChanged={this.rowHasChanged}
        showClosingKnob={true}
        // onMonthChange={this.onMonthChange}
        onDayChange={this.onDayChange}
        onDayPress={this.onDayPress}
      />
    );
  }
  loadItemsForMonth = (day: DateData) => {
    const items: Record<string, TodoItem[]> = {};

    // Ensure monthlyTodoRecord is defined and has the correct type
    const monthlyTodoRecord = this.props.monthlyTodoRecord || {}; // Provide default empty object if undefined

    // Calculate the range from 3 months before to 3 months after
    const startDate = dayjs(day.timestamp).subtract(12, 'month').startOf('month');
    const endDate = dayjs(day.timestamp).add(12, 'month').endOf('month');

    let currentDate = startDate;

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const dateStr = this.timeToString(currentDate.valueOf());
      items[dateStr] = monthlyTodoRecord[dateStr] || []; // Use empty array if dateStr is not found
      currentDate = currentDate.add(1, 'day');
    }

    this.setState({
      items,
    });
  };

  renderItem = (reservation: TodoItem, isFirst: boolean) => {
    const fontSize = isFirst ? 16 : 14;
    const color = isFirst ? 'black' : '#43515c';

    return (
      <TouchableOpacity
        style={[
          styles.item,
          {backgroundColor: this.props.colors.background, borderColor: this.props.colors.outline},
        ]}
        onPress={() => Alert.alert(reservation.title)}>
        <Text style={{fontSize, color}}>{reservation.title}</Text>
      </TouchableOpacity>
    );
  };

  renderEmptyDate = () => {
    return (
      <View style={[styles.emptyDate, {backgroundColor: this.props.colors.background}]}>
        <Text>This is empty date!</Text>
      </View>
    );
  };

  rowHasChanged = (r1: AgendaEntry, r2: AgendaEntry) => {
    return r1.name !== r2.name;
  };

  timeToString(time: number) {
    const date = new Date(time);
    return date.toISOString().split('T')[0];
  }
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
  },
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
});
