import React, {useState, useRef, useCallback} from 'react';
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import {Appbar, Text, useTheme} from 'react-native-paper';
import dayjs from 'dayjs';
import {useTodo} from '@/contexts/TodoContext';
import MonthCalendar from '@/components/calendars/MonthCalendar';
import DailyCalendar from '@/components/calendars/DailyCalendar';
import AgendaCalendar from '@/components/calendars/AgendaCalendar';
import WeekCalendar from '@/components/calendars/WeekCalendar';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import Animated, {useAnimatedStyle, useSharedValue, withSpring} from 'react-native-reanimated';

export type Mode = 'month' | 'day' | 'week' | 'agenda';

let count = 0;
const CalendarPage = () => {
  console.log('CalendarPage rendered', count++);
  const {colors} = useTheme();
  const {timelineTodoEvents, monthlyTodoArray, monthlyTodoRecord, handleEndDrag} = useTodo();
  const [mode, setMode] = useState<Mode>('month');
  const [selectedDate, setSelectedDate] = useState(dayjs(new Date()).format('YYYY-MM-DD'));
  const [expanded, setExpanded] = useState(false);

  const previousExpanded = useRef(expanded);
  const heightAnim = useSharedValue(expanded ? 80 : 0);

  // useCallback to memoize the effect and prevent unnecessary updates
  const updateAnimation = useCallback(() => {
    heightAnim.value = withSpring(expanded ? 80 : 0, {
      damping: 20, // dont set below 19 because it will bounce to the max height 80
      stiffness: 100, // do not adjust stiffness too much because it will make the animation bounce to the max height 80
    });
    previousExpanded.current = expanded;
  }, [expanded, heightAnim]);

  React.useEffect(() => {
    if (expanded !== previousExpanded.current) {
      updateAnimation();
    }
  }, [expanded, updateAnimation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: heightAnim.value,
      overflow: 'hidden',
    };
  });

  const changeMode = (m: Mode) => {
    setExpanded(prev => !prev);
    setTimeout(() => {
      setMode(m);
    }, 300); // adjust the timeout to match the animation duration
  };

  const renderCalendarComponent = () => {
    switch (mode) {
      case 'month':
        return (
          <MonthCalendar
            monthlyTodoArray={monthlyTodoArray}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            colors={colors}
            handleEndDrag={handleEndDrag}
          />
        );
      case 'day':
        return (
          <DailyCalendar
            events={timelineTodoEvents}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        );
      case 'week':
        return <WeekCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
      case 'agenda':
        return (
          <AgendaCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            colors={colors}
            monthlyTodoRecord={monthlyTodoRecord}
          />
        );
      default:
        return (
          <DailyCalendar
            events={timelineTodoEvents}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            colors={colors}
          />
        );
    }
  };

  const onMenuPress = () => {
    setExpanded(prev => !prev);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <GestureHandlerRootView style={{flex: 1}}>
        <Appbar.Header>
          <Appbar.Content title={dayjs(selectedDate).format('MMM YYYY')} />
          <Appbar.Action
            icon={
              mode === 'month'
                ? 'calendar-month'
                : mode === 'day'
                  ? 'view-day'
                  : mode === 'week'
                    ? 'view-week'
                    : mode === 'agenda'
                      ? 'view-agenda'
                      : 'calendar-month-outline' // default icon
            }
            onPress={onMenuPress}
          />

          <Appbar.Action icon="dots-vertical" onPress={() => {}} />
        </Appbar.Header>
        <Animated.View style={[animatedStyle]}>
          <View style={styles.buttonRow} collapsable>
            <TouchableOpacity
              key="month"
              onPress={() => changeMode('month' as Mode)}
              style={[
                styles.buttonContainer,
                mode === 'month' && {
                  borderBottomColor: colors.tertiary,
                  borderBottomWidth: 2,
                },
              ]}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={mode === 'month' ? 'calendar-month' : 'calendar-month-outline'}
                  size={30}
                  color={mode === 'month' ? colors.tertiary : colors.onBackground}
                />
                <Text style={{color: mode === 'month' ? colors.tertiary : colors.onBackground}}>
                  Month
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              key="day"
              onPress={() => changeMode('day' as Mode)}
              style={[
                styles.buttonContainer,
                mode === 'day' && {
                  borderBottomColor: colors.tertiary,
                  borderBottomWidth: 2,
                },
              ]}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={mode === 'day' ? 'view-day' : 'view-day-outline'}
                  size={30}
                  color={mode === 'day' ? colors.tertiary : colors.onBackground}
                />
                <Text style={{color: mode === 'day' ? colors.tertiary : colors.onBackground}}>
                  Day
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              key="week"
              onPress={() => changeMode('week' as Mode)}
              style={[
                styles.buttonContainer,
                mode === 'week' && {
                  borderBottomColor: colors.tertiary,
                  borderBottomWidth: 2,
                },
              ]}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={mode === 'week' ? 'view-week' : 'view-week-outline'}
                  size={30}
                  color={mode === 'week' ? colors.tertiary : colors.onBackground}
                />
                <Text style={{color: mode === 'week' ? colors.tertiary : colors.onBackground}}>
                  Week
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              key="agenda"
              onPress={() => changeMode('agenda' as Mode)}
              style={[
                styles.buttonContainer,
                mode === 'agenda' && {
                  borderBottomColor: colors.tertiary,
                  borderBottomWidth: 2,
                },
              ]}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={mode === 'agenda' ? 'view-agenda' : 'view-agenda-outline'}
                  size={30}
                  color={mode === 'agenda' ? colors.tertiary : colors.onBackground}
                />
                <Text style={{color: mode === 'agenda' ? colors.tertiary : colors.onBackground}}>
                  Agenda
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
        {renderCalendarComponent()}
      </GestureHandlerRootView>
    </View>
  );
};

export default CalendarPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginEnd: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  iconContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
