import React, {createRef, PureComponent, useRef} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  ExpandableCalendar,
  TimelineEventProps,
  TimelineList,
  CalendarProvider,
  TimelineProps,
  CalendarUtils,
} from 'react-native-calendars';
import BottomSheet, {BottomSheetBackdrop, BottomSheetModal} from '@gorhom/bottom-sheet';
import groupBy from 'lodash/groupBy';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import AddTodoModal from '../modals/addTodoModal';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {Section, Todo} from '@/powersync/AppSchema';
import {getFormattedDate} from '../modals/EditTodoModalContent';
import {Divider, Icon, List, TextInput} from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import {isEqual} from 'lodash';

dayjs.extend(utc);
dayjs.extend(timezone);

interface DailyCalendarState {
  currentDate: string;
  events: TimelineEventProps[];
  eventsByDate: {[key: string]: TimelineEventProps[]};
  selectedEvent: TimelineEventProps | null;
  isAddTodoModalVisible: boolean; // Add isAddTodoModalVisible to the state
  selectedRange: {start: Date | undefined; end: Date | undefined} | null;
  titleInputHeight: number;
  summaryHeight: number;
  titleInputFocus: boolean;
  renderKeyToForceUpdate: number;
}

interface DailyCalendarProps {
  events: TimelineEventProps[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  colors: MD3Colors;
  sections: Section[];
  onSubmitEditing: (todo: Todo) => void;
  onTimeLineSubmitEditing: (event: TimelineEventProps) => void;
}

export default class DailyCalendar extends PureComponent<DailyCalendarProps, DailyCalendarState> {
  bottomSheetRef = createRef<BottomSheet>();
  editBottomSheetRef = createRef<BottomSheetModal>();
  titleInputRef = createRef();
  summaryInputRef = createRef();

  constructor(props: DailyCalendarProps) {
    super(props);

    this.state = {
      currentDate: props.selectedDate,
      events: props.events,
      eventsByDate: this.groupEventsByDate(props.events),
      selectedEvent: null,
      isAddTodoModalVisible: false, // Initialize isAddTodoModalVisible in state
      selectedRange: null,
      titleInputHeight: 20,
      summaryHeight: 20,
      titleInputFocus: false,
      renderKeyToForceUpdate: 0,
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

  componentDidUpdate(prevProps: {events: TimelineEventProps[]}) {
    if (!isEqual(prevProps.events, this.props.events)) {
      const newEventsByDate = this.groupEventsByDate(this.props.events);
      console.log('Previous eventsByDate:', this.state.eventsByDate);
      console.log('New eventsByDate:', newEventsByDate);
      this.setState({
        eventsByDate: newEventsByDate,
        renderKeyToForceUpdate: this.state.renderKeyToForceUpdate + 1,
      });
    }
  }

  onDateChanged = (date: string, source: string) => {
    console.log('DailyCalendar onDateChanged: ', date, source);
    this.props.setSelectedDate(date);
    this.setState({currentDate: date});
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

  handleDateChange = (date: Date, type: 'start' | 'end') => {
    const newDate = dayjs(date);
    const currentStartDate = dayjs(this.state.selectedEvent?.start);
    const currentDueDate = dayjs(this.state.selectedEvent?.end);

    if (type === 'start') {
      if (newDate.isAfter(currentDueDate) && newDate.hour() < currentDueDate.hour()) {
        const newDueDate = newDate
          .set('hour', currentDueDate.hour())
          .set('minute', currentDueDate.minute())
          .set('second', currentDueDate.second());

        this.setState(prevState => ({
          selectedEvent: {
            ...prevState.selectedEvent,
            start: newDate.format('YYYY-MM-DD HH:mm:ss'),
            end: newDueDate.format('YYYY-MM-DD HH:mm:ss'),
            title: prevState.selectedEvent?.title || '', // Ensuring title is not undefined
            summary: prevState.selectedEvent?.summary || '', // Ensuring summary is not undefined
            color: prevState.selectedEvent?.color || '', // Ensuring color is not undefined
            id: prevState.selectedEvent?.id, // ID can be undefined or remain as is
          },
        }));
      } else if (newDate.isAfter(currentDueDate) && newDate.hour() > currentDueDate.hour()) {
        const newDueDate = newDate
          .add(1, 'day')
          .set('hour', currentDueDate.hour())
          .set('minute', currentDueDate.minute())
          .set('second', currentDueDate.second());

        this.setState(prevState => ({
          selectedEvent: {
            ...prevState.selectedEvent,
            start: newDate.format('YYYY-MM-DD HH:mm:ss'),
            end: newDueDate.format('YYYY-MM-DD HH:mm:ss'),
            title: prevState.selectedEvent?.title || '', // Ensuring title is not undefined
            summary: prevState.selectedEvent?.summary || '', // Ensuring summary is not undefined
            color: prevState.selectedEvent?.color || '', // Ensuring color is not undefined
            id: prevState.selectedEvent?.id, // ID can be undefined or remain as is
          },
        }));
      } else {
        // Update only the start date
        this.setState(prevState => ({
          selectedEvent: {
            ...prevState.selectedEvent,
            start: newDate.format('YYYY-MM-DD HH:mm:ss'),
            end: prevState.selectedEvent?.end || '', // Ensuring end is not undefined
            title: prevState.selectedEvent?.title || '', // Ensuring title is not undefined
            summary: prevState.selectedEvent?.summary || '', // Ensuring summary is not undefined
            color: prevState.selectedEvent?.color || '', // Ensuring color is not undefined
            id: prevState.selectedEvent?.id, // ID can be undefined or remain as is
          },
        }));
      }
    } else if (type === 'end') {
      if (newDate.isBefore(currentStartDate) && newDate.hour() > currentStartDate.hour()) {
        const newStartDate = newDate
          .set('hour', currentStartDate.hour())
          .set('minute', currentStartDate.minute())
          .set('second', currentStartDate.second());

        this.setState(prevState => ({
          selectedEvent: {
            ...prevState.selectedEvent,
            start: newStartDate.format('YYYY-MM-DD HH:mm:ss'),
            end: newDate.format('YYYY-MM-DD HH:mm:ss'),
            title: prevState.selectedEvent?.title || '', // Ensuring title is not undefined
            summary: prevState.selectedEvent?.summary || '', // Ensuring summary is not undefined
            color: prevState.selectedEvent?.color || '', // Ensuring color is not undefined
            id: prevState.selectedEvent?.id, // ID can be undefined or remain as is
          },
        }));
      } else if (newDate.isBefore(currentStartDate) && newDate.hour() < currentStartDate.hour()) {
        const newStartDate = newDate
          .subtract(1, 'day')
          .set('hour', currentStartDate.hour())
          .set('minute', currentStartDate.minute())
          .set('second', currentStartDate.second());

        this.setState(prevState => ({
          selectedEvent: {
            ...prevState.selectedEvent,
            start: newStartDate.format('YYYY-MM-DD HH:mm:ss'),
            end: newDate.format('YYYY-MM-DD HH:mm:ss'),
            title: prevState.selectedEvent?.title || '', // Ensuring title is not undefined
            summary: prevState.selectedEvent?.summary || '', // Ensuring summary is not undefined
            color: prevState.selectedEvent?.color || '', // Ensuring color is not undefined
            id: prevState.selectedEvent?.id, // ID can be undefined or remain as is
          },
        }));
      } else {
        // Update only the due date
        this.setState(prevState => ({
          selectedEvent: {
            ...prevState.selectedEvent,
            end: newDate.format('YYYY-MM-DD HH:mm:ss'),
            start: prevState.selectedEvent?.start || '', // Ensuring start is not undefined
            title: prevState.selectedEvent?.title || '', // Ensuring title is not undefined
            summary: prevState.selectedEvent?.summary || '', // Ensuring summary is not undefined
            color: prevState.selectedEvent?.color || '', // Ensuring color is not undefined
            id: prevState.selectedEvent?.id, // ID can be undefined or remain as is
          },
        }));
      }
    }
  };

  handleTitleChange = (title: string) => {
    this.setState(prevState => ({
      selectedEvent: {
        ...prevState.selectedEvent,
        start: prevState.selectedEvent?.start || '', // Ensuring start is not undefined
        end: prevState.selectedEvent?.end || '', // Ensuring end is not undefined
        title: title || '', // Ensuring title is not undefined
        summary: prevState.selectedEvent?.summary || '', // Ensuring summary is not undefined
        color: prevState.selectedEvent?.color || '', // Ensuring color is not undefined
        id: prevState.selectedEvent?.id, // ID can be undefined or remain as is
      },
    }));
  };

  handleSummaryChange = (summary: string) => {
    this.setState(prevState => ({
      selectedEvent: {
        ...prevState.selectedEvent,
        start: prevState.selectedEvent?.start || '', // Ensuring start is not undefined
        end: prevState.selectedEvent?.end || '', // Ensuring end is not undefined
        title: prevState.selectedEvent?.title || '', // Ensuring title is not undefined
        summary: summary || '', // Ensuring summary is not undefined
        color: prevState.selectedEvent?.color || '', // Ensuring color is not undefined
        id: prevState.selectedEvent?.id, // ID can be undefined or remain as is
      },
    }));
  };
  handleTitleContentSizeChange = (event: any) => {
    this.setState({titleInputHeight: event.nativeEvent.contentSize.height});
  };

  handleSummaryContentSizeChange = (event: any) => {
    this.setState({summaryHeight: event.nativeEvent.contentSize.height});
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
    console.log('Selected event:', selectedEvent);
    if (!selectedEvent) return null;

    return (
      <View style={[styles.eventDetailsContainer, {backgroundColor: this.props.colors.background}]}>
        <View
          style={{
            flexDirection: 'row',
          }}>
          <TextInput
            ref={this.titleInputRef}
            mode="outlined"
            outlineStyle={{borderWidth: 0, borderBottomWidth: this.state.titleInputFocus ? 1 : 0}}
            multiline
            placeholder="Title"
            textBreakStrategy="highQuality"
            value={selectedEvent.title}
            onChangeText={this.handleTitleChange}
            style={{
              flex: 1,
              borderWidth: 0,
              height: Math.max(20, this.state.titleInputHeight),
              justifyContent: 'flex-start',
            }}
            onFocus={() => this.setState({titleInputFocus: true})}
            onBlur={() => this.setState({titleInputFocus: false})}
            onContentSizeChange={this.handleTitleContentSizeChange}
          />
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Icon source="playlist-edit" size={30} color={this.props.colors.onBackground} />
          <TextInput
            ref={this.summaryInputRef}
            mode="outlined"
            multiline
            placeholder="Add a description"
            outlineStyle={{
              borderWidth: 0,
            }}
            textBreakStrategy="highQuality"
            value={selectedEvent.summary}
            onChangeText={this.handleSummaryChange}
            style={{
              flex: 1,
              borderWidth: 0,
              paddingLeft: 0,
              paddingBottom: 0,
              height: Math.max(20, this.state.summaryHeight),
              justifyContent: 'flex-start',
            }}
            onContentSizeChange={this.handleSummaryContentSizeChange}
          />
        </View>
        <Divider bold />
        <List.AccordionGroup>
          <List.Accordion
            left={props => <List.Icon {...props} icon="calendar-start" />}
            right={() => <></>}
            titleStyle={{alignSelf: 'flex-end'}}
            title={getFormattedDate(selectedEvent.start || '', selectedEvent.start || '', 'start')}
            id="1">
            <List.Item
              title=""
              right={() => (
                <DatePicker
                  date={dayjs(selectedEvent.start).toDate()}
                  onDateChange={date => this.handleDateChange(date, 'start')}
                  dividerColor={this.props.colors.primary}
                />
              )}
            />
          </List.Accordion>
          <Divider />
          <List.Accordion
            left={props => <List.Icon {...props} icon="calendar-end" />}
            right={() => <></>}
            titleStyle={{alignSelf: 'flex-end'}}
            title={getFormattedDate(selectedEvent.start || '', selectedEvent.end || '', 'end')}
            id="2">
            <List.Item
              title=""
              right={() => (
                <DatePicker
                  date={dayjs(selectedEvent.end).toDate()}
                  onDateChange={date => this.handleDateChange(date, 'end')}
                  dividerColor={this.props.colors.primary}
                />
              )}
            />
          </List.Accordion>
        </List.AccordionGroup>
        <Divider />
      </View>
    );
  };

  render() {
    const {currentDate, eventsByDate, isAddTodoModalVisible, renderKeyToForceUpdate} = this.state;
    console.log('currentDate:', currentDate);
    return (
      <>
        <CalendarProvider
          key={renderKeyToForceUpdate}
          date={currentDate}
          onDateChanged={this.onDateChanged}
          onMonthChange={this.onMonthChange}
          showTodayButton
          style={{flex: 1, backgroundColor: 'white'}}
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
          }}
          disabledOpacity={0.6}>
          <ExpandableCalendar firstDay={1} markedDates={this.marked} />

          <TimelineList
            events={eventsByDate}
            timelineProps={this.timelineProps}
            showNowIndicator
            scrollToNow={false}
          />
        </CalendarProvider>
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
          backgroundStyle={{backgroundColor: this.props.colors.background}}
          onChange={index => {
            if (index === -1) {
              this.props.onTimeLineSubmitEditing(this.state.selectedEvent as TimelineEventProps);
              this.setState({
                selectedEvent: null,
              });
            }
          }}
          snapPoints={['30%', '70%']}>
          {this.renderEventDetails()}
        </BottomSheet>
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
