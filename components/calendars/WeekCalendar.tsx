import {SectionItem} from '@/store/section/types';
import {TodoItem} from '@/store/todo/types';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import React, {useCallback, useMemo, useState} from 'react';
import {useWindowDimensions, StyleSheet, View} from 'react-native';
import {Calendar, ICalendarEventBase} from 'react-native-big-calendar';
import {Divider, Text} from 'react-native-paper';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import AddTodoModal from '../modals/addTodoModal';

export interface WeekCalendarProps {
  events: ICalendarEventBase[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  colors: MD3Colors;
  sections: SectionItem[];
  onSubmitEditing: (todo: TodoItem) => void;
}

const WeekCalendar = ({
  selectedDate,
  events,
  onSubmitEditing,
  sections,
  colors,
}: WeekCalendarProps) => {
  const {height} = useWindowDimensions();
  const [additionalEvents, setAdditionalEvents] = useState<ICalendarEventBase[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ICalendarEventBase | null>(null);

  const [isAddTodoModalVisible, setIsAddTodoModalVisible] = useState(false);
  const toggleAddTodoModal = useCallback((isVisible: boolean) => {
    setIsAddTodoModalVisible(isVisible);
  }, []);

  const [selectedRange, setSelectedRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  } | null>(null);

  const snapPoints = useMemo(() => ['25%', '50%', '80%'], []);
  const bottomSheetRef = React.createRef<BottomSheet>();

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
  const addLongEvent = useCallback(
    (start: Date) => {
      // const title = 'new Long Event';
      const end = dayjs(start).add(2, 'hour').add(59, 'minute').toDate();

      setSelectedRange({start, end});

      setTimeout(() => {
        toggleAddTodoModal(true);
      }, 0);
    },
    [toggleAddTodoModal],
  );

  const renderEventDetails = () => {
    return (
      <View style={styles.eventDetailsContainer}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{selectedEvent?.title}</Text>
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventTime}>
            {dayjs(selectedEvent?.start).isSame(selectedEvent?.end, 'day')
              ? `${dayjs(selectedEvent?.start).format('MMM DD, YYYY hh:mm A')} - ${dayjs(selectedEvent?.end).format('hh:mm A')}`
              : `${dayjs(selectedEvent?.start).format('MMM DD, YYYY hh:mm A')} - ${dayjs(selectedEvent?.end).format('MMM DD, YYYY hh:mm A')}`}
          </Text>
        </View>
        <View style={styles.eventFooter}>{/* empty for now */}</View>
      </View>
    );
  };

  return (
    <>
      <Calendar
        date={dayjs(selectedDate).toDate()}
        height={height - 60}
        events={filteredEvents}
        maxVisibleEventCount={3}
        onLongPressCell={addLongEvent}
        onPressCell={addEvent}
        onPressEvent={event => {
          setSelectedEvent(event);
          bottomSheetRef.current?.expand();
        }}
        sortedMonthView={false}
        mode={'week'}
        itemSeparatorComponent={() => <Divider bold horizontalInset />}
      />
      <BottomSheet
        backdropComponent={(
          props, // found from https://github.com/gorhom/react-native-bottom-sheet/issues/187
        ) => (
          <BottomSheetBackdrop
            {...props}
            opacity={0.5}
            enableTouchThrough={false}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            style={[{backgroundColor: 'rgba(0, 0, 0, 1)'}, StyleSheet.absoluteFillObject]}
          />
        )}
        ref={bottomSheetRef}
        index={-1}
        enablePanDownToClose
        snapPoints={snapPoints}>
        {renderEventDetails}
      </BottomSheet>
      <AddTodoModal
        isVisible={isAddTodoModalVisible}
        setIsVisible={toggleAddTodoModal} // Use the toggle method for visibility
        onBackdropPress={() => toggleAddTodoModal(false)}
        onSubmitEditing={onSubmitEditing}
        sections={sections}
        propSelectedStartDate={selectedRange?.start}
        propSelectedDueDate={selectedRange?.end}
      />
    </>
  );
};

export default WeekCalendar;
const styles = StyleSheet.create({
  eventDetailsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  eventHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  eventContent: {
    marginBottom: 20,
  },
  eventSummary: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  eventTime: {
    fontSize: 16,
    color: '#666',
  },
  eventFooter: {
    alignItems: 'center',
  },
});
