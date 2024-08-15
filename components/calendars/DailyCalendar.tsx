import React, {createRef, PureComponent} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  ExpandableCalendar,
  TimelineEventProps,
  TimelineList,
  CalendarProvider,
  TimelineProps,
  CalendarUtils,
} from 'react-native-calendars';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import groupBy from 'lodash/groupBy';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import Animated from 'react-native-reanimated';
import AddTodoModal from '../modals/addTodoModal';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {Section, Todo} from '@/powersync/AppSchema';

dayjs.extend(utc);
dayjs.extend(timezone);

interface DailyCalendarState {
  currentDate: string;
  events: TimelineEventProps[];
  eventsByDate: {[key: string]: TimelineEventProps[]};
  selectedEvent: TimelineEventProps | null;
  isAddTodoModalVisible: boolean; // Add isAddTodoModalVisible to the state
  selectedRange: {start: Date | undefined; end: Date | undefined} | null;
}

interface DailyCalendarProps {
  events: TimelineEventProps[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  colors: MD3Colors;
  sections: Section[];
  onSubmitEditing: (todo: Todo) => void;
}

export default class DailyCalendar extends PureComponent<DailyCalendarProps, DailyCalendarState> {
  bottomSheetRef = createRef<BottomSheet>();

  constructor(props: DailyCalendarProps) {
    super(props);

    this.state = {
      currentDate: props.selectedDate,
      events: props.events,
      eventsByDate: this.groupEventsByDate(props.events),
      selectedEvent: null,
      isAddTodoModalVisible: false, // Initialize isAddTodoModalVisible in state
      selectedRange: null,
    };
  }

  groupEventsByDate = (events: TimelineEventProps[]) => {
    return groupBy(events, e => CalendarUtils.getCalendarDateString(e.start));
  };

  marked = (() => {
    const marked: {[key: string]: any} = {};
    this.props.events.forEach(event => {
      const date = CalendarUtils.getCalendarDateString(event.start);
      marked[date] = {marked: true};
    });
    return marked;
  })();

  componentDidUpdate(prevProps: DailyCalendarProps) {
    if (prevProps.events !== this.props.events) {
      this.setState({
        eventsByDate: this.groupEventsByDate(this.props.events),
      });
    }
  }

  onDateChanged = (date: string, source: string) => {
    console.log('DailyCalendar onDateChanged: ', date, source);
    this.props.setSelectedDate(date);
  };

  onMonthChange = (month: any, updateSource: any) => {
    console.log('DailyCalendar onMonthChange: ', month, updateSource);
  };

  createNewEvent: TimelineProps['onBackgroundLongPressOut'] = (timeString, timeObject) => {
    // Use dayjs to parse and manipulate the start and end times
    const {eventsByDate} = this.state;

    const start = dayjs(timeString);
    const end = start.add(1, 'hour'); // Adds 1 hour to the start time

    // Create a new copy of the eventsByDate object
    const updatedEventsByDate = {...eventsByDate};

    const newEvent = {
      id: 'draft',
      start: start.toDate().toISOString(),
      end: end.toDate().toISOString(),
      title: 'New Event',
      color: 'white',
    };

    // Check if the date already exists in the updated object
    if (timeObject.date) {
      if (updatedEventsByDate[timeObject.date]) {
        // Append the new event to the existing array
        updatedEventsByDate[timeObject.date] = [...updatedEventsByDate[timeObject.date], newEvent];
      } else {
        // Create a new array with the new event
        updatedEventsByDate[timeObject.date] = [newEvent];
      }

      // Update the state with the new object reference
      this.setState({
        eventsByDate: updatedEventsByDate,
        selectedRange: {
          start: start.toDate(), // Format the start time
          end: end.toDate(), // Format the end time
        },
      });
    }
  };

  displayAddModal: TimelineProps['onBackgroundLongPressOut'] = (timeString, timeObject) => {
    this.toggleAddTodoModal(true);
  };

  viewEvent: TimelineProps['onEventPress'] = event => {
    console.log('Event pressed:', event);

    if (!event) return;
    this.setState({selectedEvent: event}, () => {
      if (this.bottomSheetRef.current) {
        this.bottomSheetRef.current.expand();
      }
    });
  };

  toggleAddTodoModal = (isVisible: boolean) => {
    this.setState({isAddTodoModalVisible: isVisible});
  };

  private timelineProps: Partial<TimelineProps> = {
    format24h: true,
    onBackgroundLongPress: this.createNewEvent,
    onBackgroundLongPressOut: this.displayAddModal,
    onEventPress: this.viewEvent,
    overlapEventsSpacing: 8,
    rightEdgeSpacing: 24,
  };

  renderEventDetails = () => {
    const {selectedEvent}: {selectedEvent: TimelineEventProps | null} = this.state;
    console.log('selectedEvent: ', selectedEvent);
    if (!selectedEvent) return null;

    return (
      <View style={styles.eventDetailsContainer}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{selectedEvent.title}</Text>
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventSummary}>{selectedEvent.summary}</Text>
          <Text style={styles.eventTime}>
            {selectedEvent.start} - {selectedEvent.end}
          </Text>
        </View>
        <View style={styles.eventFooter}>{/* empty for now */}</View>
      </View>
    );
  };

  render() {
    const {currentDate, eventsByDate, isAddTodoModalVisible} = this.state;
    return (
      <>
        <CalendarProvider
          date={currentDate}
          onDateChanged={this.onDateChanged}
          onMonthChange={this.onMonthChange}
          showTodayButton
          disabledOpacity={0.6}>
          <ExpandableCalendar firstDay={1} markedDates={this.marked} />
          <Animated.View style={{flex: 1}}>
            <TimelineList
              events={eventsByDate}
              timelineProps={this.timelineProps}
              showNowIndicator
              scrollToNow
            />
          </Animated.View>
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
            ref={this.bottomSheetRef}
            index={-1}
            enablePanDownToClose
            snapPoints={['50%', '75%']}>
            {this.renderEventDetails()}
          </BottomSheet>
        </CalendarProvider>
        <AddTodoModal
          isVisible={isAddTodoModalVisible}
          setIsVisible={this.toggleAddTodoModal} // Use the toggle method for visibility
          onBackdropPress={() => this.toggleAddTodoModal(false)}
          onSubmitEditing={this.props.onSubmitEditing}
          sections={this.props.sections}
          propSelectedStartDate={this.state.selectedRange?.start}
          propSelectedDueDate={this.state.selectedRange?.end}
        />
      </>
    );
  }
}

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
