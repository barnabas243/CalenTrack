import React, {useEffect, useState, useRef} from 'react';
import {TouchableOpacity, StyleSheet, View, LayoutAnimation} from 'react-native';
import CheckBox from 'expo-checkbox';
import {useTodo} from '@/contexts/TodoContext';
import {PriorityType, TodoItem} from '@/contexts/TodoContext.types';
import Animated, {useAnimatedStyle, useSharedValue, withSpring} from 'react-native-reanimated';
import {Text} from 'react-native-paper';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import SwipeableItem, {useSwipeableItemParams, OpenDirection} from 'react-native-swipeable-item';
import dayjs from 'dayjs';
import {MaterialCommunityIcons} from '@expo/vector-icons';

const OVERSWIPE_DIST = 20;

export interface ToDoItemProps {
  item: TodoItem;
  getIndex: () => number | undefined;
  drag: () => void;
  isActive: boolean;
  colors: MD3Colors;
  enableSwipe?: boolean;
}

const ToDoItem = ({item, drag, isActive, colors, enableSwipe = true}: ToDoItemProps) => {
  const [toggleCheckBox, setToggleCheckBox] = useState(false);
  const {toggleCompleteTodo, openEditBottomSheet, deleteTodo, sections} = useTodo();
  const {title, priority, id, completed, summary, due_date, section_id} = item;

  // Shared values for translation
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Update the toggleCheckBox state based on the completed prop
    setToggleCheckBox(completed);
  }, [completed]);

  useEffect(() => {
    // Update animation based on isActive
    translateX.value = withSpring(isActive ? 40 : 0, {damping: 20});
    translateY.value = withSpring(isActive ? -20 : 0, {damping: 20});
  }, [isActive, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{translateX: translateX.value}, {translateY: translateY.value}],
    }),
    [translateX.value, translateY.value],
  );

  const toggleComplete = (id: number) => {
    toggleCompleteTodo(id);
  };

  const getBorderColor = (priority: PriorityType) => {
    switch (priority) {
      case '1':
        return 'red';
      case '2':
        return 'orange';
      case '3':
        return 'green';
      default:
        return '#CCCCCC';
    }
  };

  const openEditTodoModal = (item: TodoItem) => {
    openEditBottomSheet(item);
  };

  // Swipeable item params
  const itemRefs = useRef(new Map());

  const UnderlayLeft = () => {
    const {percentOpen} = useSwipeableItemParams();
    const animStyle = useAnimatedStyle(
      () => ({
        opacity: percentOpen.value,
      }),
      [percentOpen],
    );

    const handleDelete = async () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      await deleteTodo(id);
    };
    return (
      <Animated.View style={[styles.row, styles.underlayLeft, animStyle]}>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.text}>{`[delete]`}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onLongPress={drag}
      onPress={() => openEditTodoModal(item)}
      style={[
        {
          flex: 1,
          borderColor: getBorderColor(priority),
          opacity: completed ? 0.5 : 1,
          marginVertical: 3,
          marginHorizontal: 10,
        },
      ]}>
      {enableSwipe ? (
        <SwipeableItem
          key={id.toString()}
          item={item}
          ref={ref => {
            if (ref && !itemRefs.current.get(id)) {
              itemRefs.current.set(id, ref);
            }
          }}
          onChange={({openDirection}) => {
            if (openDirection !== OpenDirection.NONE) {
              [...itemRefs.current.entries()].forEach(([key, ref]) => {
                if (key !== id && ref) ref.close();
              });
            }
          }}
          overSwipe={OVERSWIPE_DIST}
          renderUnderlayLeft={() => <UnderlayLeft />}
          snapPointsLeft={[150]}>
          <Animated.View
            style={[
              styles.contentContainer,
              animatedStyle,
              {backgroundColor: colors.inverseOnSurface},
            ]}>
            <CheckBox
              disabled={false}
              value={toggleCheckBox}
              onValueChange={() => toggleComplete(id)}
              style={{borderColor: getBorderColor(priority)}}
              color={toggleCheckBox ? '#CCCCCC' : undefined}
            />
            <View style={styles.textContainer}>
              <Text
                variant="titleSmall"
                style={{marginLeft: 10, textDecorationLine: completed ? 'line-through' : 'none'}}>
                {title}
              </Text>
              {summary && (
                <Text variant="bodySmall" style={{marginLeft: 10, marginVertical: 5}}>
                  {summary}
                </Text>
              )}
              <View style={styles.dueDateContainer}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={14}
                  color={colors.tertiary}
                  style={styles.icon}
                />
                <Text variant="bodySmall" style={[styles.dueDateText, {color: colors.tertiary}]}>
                  {dayjs(due_date).format('DD MMMM')}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.bottomRightText}>
                {sections[section_id ?? 0]?.name}
              </Text>
            </View>
          </Animated.View>
        </SwipeableItem>
      ) : (
        <Animated.View
          style={[
            styles.contentContainer,
            animatedStyle,
            {backgroundColor: colors.inverseOnSurface},
          ]}>
          <CheckBox
            disabled={false}
            value={toggleCheckBox}
            onValueChange={() => toggleComplete(id)}
            style={{borderColor: getBorderColor(priority)}}
            color={toggleCheckBox ? '#CCCCCC' : undefined}
          />
          <View style={styles.textContainer}>
            <Text
              variant="titleSmall"
              style={{marginLeft: 10, textDecorationLine: completed ? 'line-through' : 'none'}}>
              {title}
            </Text>
            {summary && (
              <Text variant="bodySmall" style={{marginLeft: 10, marginVertical: 5}}>
                {summary}
              </Text>
            )}
            <View style={styles.dueDateContainer}>
              <MaterialCommunityIcons
                name="calendar"
                size={14}
                color={colors.tertiary}
                style={styles.icon}
              />
              <Text variant="bodySmall" style={[styles.dueDateText, {color: colors.tertiary}]}>
                {dayjs(due_date).format('DD MMMM')}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.bottomRightText}>
              {sections[section_id ?? 0]?.name}
            </Text>
          </View>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    padding: 12,
    borderWidth: 1,
    borderRadius: 5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 5,
    padding: 12,
  },
  title: {
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  text: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
  },
  underlayLeft: {
    flex: 1,
    backgroundColor: 'tomato',
    justifyContent: 'flex-end',
  },
  underlayRight: {
    flex: 1,
    backgroundColor: 'teal',
    justifyContent: 'flex-start',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  icon: {
    marginRight: 3,
  },
  dueDateText: {
    fontSize: 12,
  },
  bottomRightText: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

export default ToDoItem;
