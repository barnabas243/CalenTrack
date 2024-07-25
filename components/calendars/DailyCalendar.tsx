import React, {createRef, PureComponent, useMemo} from 'react';
import {Alert, View, Text, StyleSheet} from 'react-native';
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
import filter from 'lodash/filter';
import find from 'lodash/find';
import dayjs from 'dayjs';
import {TodoItem} from '@/contexts/TodoContext.types';

const EVENT_COLOR = '#e6add8';
const today = new Date();
const getDate = (offset = 0) =>
  CalendarUtils.getCalendarDateString(new Date().setDate(today.getDate() + offset));

const timelineEvents: TimelineEventProps[] = [
  {
    start: `${getDate()} 09:20:00`,
    end: `${getDate()} 12:00:00`,
    title: 'Merge Request to React Native Calendars',
    summary: 'Merge Timeline Calendar to React Native Calendars',
  },
  {
    start: `${getDate()} 01:15:00`,
    end: `${getDate()} 02:30:00`,
    title: 'Meeting A',
    summary: 'Summary for meeting A',
    color: EVENT_COLOR,
  },
  {
    start: `${getDate()} 01:30:00`,
    end: `${getDate()} 02:30:00`,
    title: 'Meeting B',
    summary: 'Summary for meeting B',
    color: EVENT_COLOR,
  },
  {
    start: `${getDate()} 01:45:00`,
    end: `${getDate()} 02:45:00`,
    title: 'Meeting C',
    summary: 'Summary for meeting C',
    color: EVENT_COLOR,
  },
  {
    start: `${getDate()} 02:40:00`,
    end: `${getDate()} 03:10:00`,
    title: 'Meeting D',
    summary: 'Summary for meeting D',
    color: EVENT_COLOR,
  },
  {
    start: `${getDate()} 02:50:00`,
    end: `${getDate()} 03:20:00`,
    title: 'Meeting E',
    summary: 'Summary for meeting E',
    color: EVENT_COLOR,
  },
  {
    start: `${getDate()} 04:30:00`,
    end: `${getDate()} 05:30:00`,
    title: 'Meeting F',
    summary: 'Summary for meeting F',
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(1)} 00:30:00`,
    end: `${getDate(1)} 01:30:00`,
    title: 'Visit Grand Mother',
    summary: 'Visit Grand Mother and bring some fruits.',
    color: 'lightblue',
  },
  {
    start: `${getDate(1)} 02:30:00`,
    end: `${getDate(1)} 03:20:00`,
    title: 'Meeting with Prof. Behjet Zuhaira',
    summary: 'Meeting with Prof. Behjet at 130 in her office.',
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(1)} 04:10:00`,
    end: `${getDate(1)} 04:40:00`,
    title: 'Tea Time with Dr. Hasan',
    summary: 'Tea Time with Dr. Hasan, Talk about Project',
  },
  {
    start: `${getDate(1)} 01:05:00`,
    end: `${getDate(1)} 01:35:00`,
    title: 'Dr. Mariana Joseph',
    summary: '3412 Piedmont Rd NE, GA 3032',
  },
  {
    start: `${getDate(1)} 14:30:00`,
    end: `${getDate(1)} 16:30:00`,
    title: 'Meeting Some Friends in ARMED',
    summary: 'Arsalan, Hasnaat, Talha, Waleed, Bilal',
    color: 'pink',
  },
  {
    start: `${getDate(2)} 01:40:00`,
    end: `${getDate(2)} 02:25:00`,
    title: 'Meet Sir Khurram Iqbal',
    summary: 'Computer Science Dept. Comsats Islamabad',
    color: 'orange',
  },
  {
    start: `${getDate(2)} 04:10:00`,
    end: `${getDate(2)} 04:40:00`,
    title: 'Tea Time with Colleagues',
    summary: 'WeRplay',
  },
  {
    start: `${getDate(2)} 00:45:00`,
    end: `${getDate(2)} 01:45:00`,
    title: 'Lets Play Apex Legends',
    summary: 'with Boys at Work',
  },
  {
    start: `${getDate(2)} 11:30:00`,
    end: `${getDate(2)} 12:30:00`,
    title: 'Dr. Mariana Joseph',
    summary: '3412 Piedmont Rd NE, GA 3032',
  },
  {
    start: `${getDate(4)} 12:10:00`,
    end: `${getDate(4)} 13:45:00`,
    title: 'Merge Request to React Native Calendars',
    summary: 'Merge Timeline Calendar to React Native Calendars',
  },
];

const EVENTS: TimelineEventProps[] = timelineEvents;

interface DailyCalendarState {
  currentDate: string;
  events: TimelineEventProps[];
  eventsByDate: {[key: string]: TimelineEventProps[]};
  selectedEvent: TimelineEventProps | null;
}
interface DailyCalendarProps {
  events: TimelineEventProps[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
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

  onDateChanged = (date: string, source: string) => {
    console.log('DailyCalendar onDateChanged: ', date, source);
    this.props.setSelectedDate(date);
  };

  onMonthChange = (month: any, updateSource: any) => {
    console.log('DailyCalendar onMonthChange: ', month, updateSource);
  };

  createNewEvent: TimelineProps['onBackgroundLongPressOut'] = (timeString, timeObject) => {
    const {eventsByDate} = this.state;
    const hourString = `${(timeObject.hour + 1).toString().padStart(2, '0')}`;
    const minutesString = `${timeObject.minutes.toString().padStart(2, '0')}`;

    const newEvent = {
      id: 'draft',
      start: `${timeString}`,
      end: `${timeObject.date} ${hourString}:${minutesString}:00`,
      title: 'New Event',
      color: 'white',
    };

    if (timeObject.date) {
      if (eventsByDate[timeObject.date]) {
        eventsByDate[timeObject.date] = [...eventsByDate[timeObject.date], newEvent];
        this.setState({eventsByDate});
      } else {
        eventsByDate[timeObject.date] = [newEvent];
        this.setState({eventsByDate: {...eventsByDate}});
      }
    }
  };

  approveNewEvent: TimelineProps['onBackgroundLongPress'] = (_timeString, timeObject) => {
    const {eventsByDate} = this.state;

    Alert.alert('New Event', 'Enter event title', [
      {
        text: 'Cancel',
        onPress: () => {
          if (timeObject.date) {
            eventsByDate[timeObject.date] = filter(
              eventsByDate[timeObject.date],
              e => e.id !== 'draft',
            );

            this.setState({
              eventsByDate,
            });
          }
        },
      },
      {
        text: 'Create',
        onPress: eventTitle => {
          if (timeObject.date) {
            const draftEvent = find(eventsByDate[timeObject.date], {
              id: 'draft',
            });
            if (draftEvent) {
              draftEvent.id = undefined;
              draftEvent.title = eventTitle ?? 'New Event';
              draftEvent.color = 'lightgreen';
              eventsByDate[timeObject.date] = [...eventsByDate[timeObject.date]];

              this.setState({
                eventsByDate,
              });
            }
          }
        },
      },
    ]);
  };

  viewEvent: TimelineProps['onEventPress'] = event => {
    this.setState({selectedEvent: event}, () => {
      if (this.bottomSheetRef.current) {
        this.bottomSheetRef.current.expand();
      }
    });
  };

  private timelineProps: Partial<TimelineProps> = {
    format24h: true,
    onBackgroundLongPress: this.createNewEvent,
    onBackgroundLongPressOut: this.approveNewEvent,
    onEventPress: this.viewEvent,
    overlapEventsSpacing: 8,
    rightEdgeSpacing: 24,
  };

  renderEventDetails = () => {
    const {selectedEvent}: {selectedEvent: TimelineEventProps | null} = this.state;

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
    const {currentDate, eventsByDate} = this.state;

    return (
      <CalendarProvider
        date={currentDate}
        onDateChanged={this.onDateChanged}
        onMonthChange={this.onMonthChange}
        showTodayButton
        disabledOpacity={0.6}>
        <ExpandableCalendar firstDay={1} markedDates={this.marked} />
        <TimelineList
          events={eventsByDate}
          timelineProps={this.timelineProps}
          showNowIndicator
          scrollToNow
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
          ref={this.bottomSheetRef}
          index={-1}
          snapPoints={['50%', '75%']}>
          {this.renderEventDetails()}
        </BottomSheet>
      </CalendarProvider>
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
