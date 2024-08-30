import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import React, {useCallback, useMemo, useState, useRef} from 'react';
import {useWindowDimensions, StyleSheet, View} from 'react-native';
import {Calendar, ICalendarEventBase} from 'react-native-big-calendar';
import {Divider, List, Text, TextInput} from 'react-native-paper';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import AddTodoModal from '../modals/addTodoModal';
import {Section, Todo} from '@/powersync/AppSchema';
import {getFormattedDate} from '../modals/EditTodoModalContent';
import DatePicker from 'react-native-date-picker';

export interface ICustomCalendarEvent extends ICalendarEventBase {
  id: string;
  type: string;
  reminder_option: string | null;
  notification_id: string | null;
}

export interface WeekCalendarProps {
  events: ICustomCalendarEvent[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  colors: MD3Colors;
  sections: Section[];
  onSubmitEditing: (todo: Todo) => void;
  onWeekCalendarSubmitEditing: (todo: ICustomCalendarEvent) => void;
}

const WeekCalendar = ({
  selectedDate,
  events,
  onSubmitEditing,
  onWeekCalendarSubmitEditing,
  sections,
  colors,
}: WeekCalendarProps) => {
  const {height} = useWindowDimensions();
  const [selectedEvent, setSelectedEvent] = useState<ICustomCalendarEvent | null>(null);

  const [isAddTodoModalVisible, setIsAddTodoModalVisible] = useState(false);
  const toggleAddTodoModal = useCallback((isVisible: boolean) => {
    setIsAddTodoModalVisible(isVisible);
  }, []);

  const [selectedRange, setSelectedRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  } | null>(null);

  const titleInputRef = useRef(null);

  const [titleInputFocus, setTitleInputFocus] = useState(false);
  const [titleInputHeight, setTitleInputHeight] = useState(20);

  const handleTitleContentSizeChange = (event: any) => {
    setTitleInputHeight(event.nativeEvent.contentSize.height);
  };

  const handleTitleChange = (text: string) => {
    setSelectedEvent(prevEvent => {
      if (prevEvent) {
        // Update the event only if prevEvent is not null
        return {...prevEvent, title: text};
      }
      // Return null if prevEvent was null
      return null;
    });
  };
  const handleDateChange = (date: Date, type: 'start' | 'end') => {
    const newDate = dayjs(date);
    const currentStartDate = dayjs(selectedEvent?.start);
    const currentDueDate = dayjs(selectedEvent?.end);

    if (type === 'start') {
      if (newDate.isAfter(currentDueDate) && newDate.hour() < currentDueDate.hour()) {
        const newDueDate = newDate
          .set('hour', currentDueDate.hour())
          .set('minute', currentDueDate.minute())
          .set('second', currentDueDate.second());

        setSelectedEvent(prevState =>
          prevState
            ? {
                ...prevState,
                start: newDate.toDate(), // Use Date object directly
                end: newDueDate.toDate(), // Use Date object directly
              }
            : null,
        );
      } else if (newDate.isAfter(currentDueDate) && newDate.hour() > currentDueDate.hour()) {
        const newDueDate = newDate
          .add(1, 'day')
          .set('hour', currentDueDate.hour())
          .set('minute', currentDueDate.minute())
          .set('second', currentDueDate.second());

        setSelectedEvent(prevState =>
          prevState
            ? {
                ...prevState,
                start: newDate.toDate(), // Use Date object directly
                end: newDueDate.toDate(), // Use Date object directly
              }
            : null,
        );
      } else {
        // Update only the start date
        setSelectedEvent(prevState =>
          prevState
            ? {
                ...prevState,
                start: newDate.toDate(), // Use Date object directly
              }
            : null,
        );
      }
    } else if (type === 'end') {
      if (newDate.isBefore(currentStartDate) && newDate.hour() > currentStartDate.hour()) {
        const newStartDate = newDate
          .set('hour', currentStartDate.hour())
          .set('minute', currentStartDate.minute())
          .set('second', currentStartDate.second());

        setSelectedEvent(prevState =>
          prevState
            ? {
                ...prevState,
                start: newStartDate.toDate(), // Use Date object directly
                end: newDate.toDate(), // Use Date object directly
              }
            : null,
        );
      } else if (newDate.isBefore(currentStartDate) && newDate.hour() < currentStartDate.hour()) {
        const newStartDate = newDate
          .subtract(1, 'day')
          .set('hour', currentStartDate.hour())
          .set('minute', currentStartDate.minute())
          .set('second', currentStartDate.second());

        setSelectedEvent(prevState =>
          prevState
            ? {
                ...prevState,
                start: newStartDate.toDate(), // Use Date object directly
                end: newDate.toDate(), // Use Date object directly
              }
            : null,
        );
      } else {
        // Update only the due date
        setSelectedEvent(prevState =>
          prevState
            ? {
                ...prevState,
                end: newDate.toDate(), // Use Date object directly
              }
            : null,
        );
      }
    }
  };

  const snapPoints = useMemo(() => ['25%', '50%', '80%'], []);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Callback to add a new event
  const addEvent = useCallback(
    (start: Date) => {
      const end = dayjs(start).add(29, 'minute').toDate();
      setSelectedRange({start, end});
      setTimeout(() => toggleAddTodoModal(true), 0);
    },
    [toggleAddTodoModal],
  );

  // Callback to add a long event
  const addLongEvent = useCallback(
    (start: Date) => {
      const end = dayjs(start).add(59, 'minute').toDate();
      setSelectedRange({start, end});
      setTimeout(() => toggleAddTodoModal(true), 0);
    },
    [toggleAddTodoModal],
  );

  const renderEventDetails = () => (
    <View style={[styles.eventDetailsContainer, {backgroundColor: colors.background}]}>
      <Text
        variant="titleMedium"
        style={{marginLeft: 15, color: selectedEvent?.type === 'todo' ? 'blue' : 'orange'}}>
        {selectedEvent?.type}
      </Text>
      <View style={{flexDirection: 'row'}}>
        <TextInput
          ref={titleInputRef}
          mode="outlined"
          outlineStyle={{borderWidth: 0, borderBottomWidth: titleInputFocus ? 1 : 0}}
          multiline
          placeholder="Title"
          textBreakStrategy="highQuality"
          value={selectedEvent?.title}
          onChangeText={handleTitleChange}
          style={{
            flex: 1,
            borderWidth: 0,
            height: Math.max(20, titleInputHeight),
            justifyContent: 'flex-start',
          }}
          onFocus={() => setTitleInputFocus(true)}
          onBlur={() => setTitleInputFocus(false)}
          onContentSizeChange={handleTitleContentSizeChange}
          disabled={selectedEvent?.type !== 'todo'}
        />
      </View>

      <Divider bold />
      <List.AccordionGroup>
        <List.Accordion
          left={props => <List.Icon {...props} icon="calendar-start" />}
          right={() => <></>}
          titleStyle={{alignSelf: 'flex-end'}}
          title={getFormattedDate(
            selectedEvent?.start.toString() || '',
            selectedEvent?.start.toString() || '',
            'start',
          )}
          id="1">
          <List.Item
            title=""
            right={() => (
              <DatePicker
                date={dayjs(selectedEvent?.start).toDate()}
                onDateChange={date => handleDateChange(date, 'start')}
                dividerColor={colors.primary}
              />
            )}
          />
        </List.Accordion>
        <Divider />
        <List.Accordion
          left={props => <List.Icon {...props} icon="calendar-end" />}
          right={() => <></>}
          titleStyle={{alignSelf: 'flex-end'}}
          title={getFormattedDate(
            selectedEvent?.start.toString() || '',
            selectedEvent?.end.toString() || '',
            'end',
          )}
          id="2">
          <List.Item
            title=""
            right={() => (
              <DatePicker
                date={dayjs(selectedEvent?.end).toDate()}
                onDateChange={date => handleDateChange(date, 'end')}
                dividerColor={colors.primary}
              />
            )}
          />
        </List.Accordion>
      </List.AccordionGroup>
      <Divider />
    </View>
  );

  return (
    <>
      <Calendar
        date={dayjs(selectedDate).toDate()}
        height={height - 60}
        events={events}
        maxVisibleEventCount={3}
        showAllDayEventCell={false} // Show all day event cell
        onLongPressCell={addLongEvent}
        onPressCell={addEvent}
        onPressEvent={event => {
          setSelectedEvent(event);
          bottomSheetRef.current?.expand();
        }}
        mode={'week'}
        dayHeaderHighlightColor={colors.primary}
        weekDayHeaderHighlightColor={colors.primary}
        itemSeparatorComponent={() => <Divider bold horizontalInset />}
      />
      <BottomSheet
        backdropComponent={props => (
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
        backgroundStyle={{backgroundColor: colors.background}}
        onChange={index => {
          if (index === -1) {
            onWeekCalendarSubmitEditing(selectedEvent as ICustomCalendarEvent);
            setSelectedEvent(null);
          }
        }}
        snapPoints={snapPoints}>
        {renderEventDetails()}
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
