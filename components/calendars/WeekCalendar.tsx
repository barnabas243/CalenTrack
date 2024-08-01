import dayjs from 'dayjs';
import React, {useCallback, useMemo, useState} from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {Calendar, ICalendarEventBase} from 'react-native-big-calendar';

// Generate initial events
const generateEvents = () => {
  return Array.from({length: 30}, (_, index) => ({
    title: `Event ${index + 1}`,
    start: dayjs()
      .add(index, 'days')
      .set('hour', 9 + (index % 8))
      .set('minute', 30)
      .toDate(),
    end: dayjs()
      .add(index, 'days')
      .set('hour', 10 + (index % 8))
      .set('minute', 30)
      .toDate(),
  }));
};

const WeekCalendar = ({selectedDate, setSelectedDate}) => {
  const {height} = useWindowDimensions();
  const [additionalEvents, setAdditionalEvents] = useState<ICalendarEventBase[]>([]);

  // Memoize initial events
  const events = useMemo(() => generateEvents(), []);

  // Combine initial and additional events
  const filteredEvents = useMemo(
    () => [...events, ...additionalEvents],
    [additionalEvents, events],
  );

  // Callback to add a new event
  const addEvent = useCallback((start: Date) => {
    const title = 'new Event';
    const end = dayjs(start).add(29, 'minute').toDate();
    setAdditionalEvents(prevEvents => [...prevEvents, {start, end, title}]);
  }, []);

  // Callback to add a long event
  const addLongEvent = useCallback((start: Date) => {
    const title = 'new Long Event';
    const end = dayjs(start).add(2, 'hour').add(59, 'minute').toDate();
    setAdditionalEvents(prevEvents => [...prevEvents, {start, end, title}]);
  }, []);

  // Memoize the item separator component
  const itemSeparatorComponent = useMemo(() => <View style={styles.itemSeparator} />, []);

  return (
    <Calendar
      date={selectedDate}
      height={height - 60}
      events={filteredEvents}
      maxVisibleEventCount={3}
      onLongPressCell={addLongEvent}
      onPressCell={addEvent}
      sortedMonthView={false}
      mode={'week'}
      moreLabel="+{moreCount}"
      // onPressMoreLabel={useCallback(moreEvents => {
      //   console.log(moreEvents);
      // }, [])}
      itemSeparatorComponent={itemSeparatorComponent}
    />
  );
};

export default WeekCalendar;

const styles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginEnd: 15,
  },
  buttonContainerActive: {
    borderBottomColor: 'blue',
    borderBottomWidth: 3,
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f1f1f1',
  },
  arrow: {
    fontSize: 24,
    color: '#000',
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
