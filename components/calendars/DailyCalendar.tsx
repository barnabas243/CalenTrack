import React, {createRef, PureComponent} from 'react';
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
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import Animated from 'react-native-reanimated';
// import dayjs from 'dayjs';

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
  colors: MD3Colors;
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
