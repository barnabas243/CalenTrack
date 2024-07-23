import React, {useEffect, useRef} from 'react';
import {StyleSheet, Dimensions, View, Text} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {Calendar, ICalendarEventBase} from 'react-native-big-calendar';
import dayjs from 'dayjs';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const events = Array.from({length: 10}, (_, index) => {
  const startDate = dayjs()
    .add(index, 'days')
    .set('hour', 9 + (index % 8))
    .set('minute', 30)
    .toDate();
  const endDate = dayjs()
    .add(index, 'days')
    .set('hour', 10 + (index % 8))
    .set('minute', 30)
    .toDate();

  return {
    title: `Event ${index + 1}`,
    start: startDate,
    end: endDate,
  };
});

const MyCalendarComponent = ({
  isClosed,
  setIsClosed,
  selectedDate,
}: {
  isClosed: boolean;
  setIsClosed: (closed: boolean) => void;
  selectedDate: Date;
}) => {
  const [additionalEvents, setAdditionalEvents] = React.useState<ICalendarEventBase[]>([]);
  const filteredEvents = React.useMemo(() => {
    return [...events, ...additionalEvents];
  }, [additionalEvents]);

  const addEvent = React.useCallback(
    (start: Date) => {
      const title = 'new Event';
      const end = dayjs(start).add(59, 'minute').toDate();
      setAdditionalEvents([...additionalEvents, {start, end, title}]);
    },
    [additionalEvents, setAdditionalEvents],
  );

  const addLongEvent = React.useCallback(
    (start: Date) => {
      const title = 'new Long Event';
      const end = dayjs(start).add(1, 'hour').add(59, 'minute').toDate();
      setAdditionalEvents([...additionalEvents, {start, end, title}]);
    },
    [additionalEvents, setAdditionalEvents],
  );

  const openHeight = SCREEN_HEIGHT - 120; // Full screen minus some padding
  const closedHeight = 350; // The initial visible height
  const threshold = 100;

  const translationY = useSharedValue(openHeight);
  const opacity = useSharedValue(1);

  const pan = Gesture.Pan()

    .onUpdate(event => {
      if (
        event.absoluteY + event.translationY < closedHeight ||
        event.absoluteY + event.translationY > openHeight
      ) {
        return;
      }

      translationY.value = event.absoluteY;
    })
    .onEnd(event => {
      const shouldClose = event.translationY < -threshold;
      const shouldOpen = event.translationY > threshold;
      if (shouldClose) {
        translationY.value = withSpring(closedHeight, {velocity: event.velocityY});
        runOnJS(setIsClosed)(true);
      } else if (shouldOpen) {
        translationY.value = withSpring(openHeight, {velocity: event.velocityY});
        runOnJS(setIsClosed)(false);
      } else {
        translationY.value = withSpring(isClosed ? closedHeight : openHeight);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: translationY.value,
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    if (isClosed) {
      opacity.value = withSpring(0, {velocity: 1});
    } else {
      translationY.value = withSpring(openHeight, {velocity: 1, stiffness: 60});
      opacity.value = withSpring(1, {velocity: 0.1});
    }
  }, [isClosed]);

  return (
    !isClosed && (
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <Calendar
            events={filteredEvents}
            height={SCREEN_HEIGHT / 2}
            showAllDayEventCell
            activeDate={selectedDate}
            mode="month"
            swipeEnabled
            onPressCell={addEvent}
            onLongPressCell={addLongEvent}
            eventCellStyle={{backgroundColor: 'red'}}
          />
          <View
            style={{height: 50, backgroundColor: 'blue', justifyContent: 'center'}}
            pointerEvents={'box-none'}>
            <Text style={{textAlign: 'center', color: 'white'}}>
              This is the knob. Customize this
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    top: 0, // Fixed at the top
    left: 0,
    right: 0,
    bottom: 0, // Fill the bottom
    zIndex: 10,
    elevation: 10,
  },
});

export default MyCalendarComponent;
