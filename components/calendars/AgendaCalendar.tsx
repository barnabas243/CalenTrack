import {TodoItem} from '@/contexts/TodoContext.types';
import dayjs from 'dayjs';
import {set} from 'lodash';
import React, {createRef, PureComponent} from 'react';
import {Alert, StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {Agenda, DateData, AgendaEntry} from 'react-native-calendars';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';

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
    this.props.setSelectedDate(day.dateString);
  };

  onMonthChange = (date: DateData) => {
    this.props.setSelectedDate(date.dateString);
  };
  render() {
    return (
      <Agenda
        ref={this.agendaRef}
        pastScrollRange={50}
        // onMonthChange={(date: DateData) => this.onMonthChange(date)}
        onMomentumScrollEnd={() => {
          const date = dayjs(this.agendaRef.current?.state.selectedDay).format('YYYY-MM-DD');
          console.log('onMomentumScrollEnd', date);

          setTimeout(() => {
            this.props.setSelectedDate(date);
          }, 0);
        }}
        items={this.state.items}
        loadItemsForMonth={this.loadItemsForMonth}
        selected={this.props.selectedDate}
        renderItem={this.renderItem}
        renderEmptyDate={this.renderEmptyDate}
        rowHasChanged={this.rowHasChanged}
        showClosingKnob={true}
        // onDayChange={this.onDayChange}
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
      <View style={styles.emptyDate}>
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
