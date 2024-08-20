import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {TouchableOpacity, StyleSheet, View, LayoutAnimation, Dimensions} from 'react-native';
import CheckBox from 'expo-checkbox';
import Animated, {useAnimatedStyle, useSharedValue, withSpring} from 'react-native-reanimated';
import {Icon, Text} from 'react-native-paper';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import SwipeableItem, {
  useSwipeableItemParams,
  OpenDirection,
  SwipeableItemImperativeRef,
} from 'react-native-swipeable-item';
import dayjs from 'dayjs';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {PriorityType} from '@/store/todo/types';
import {Section, Todo} from '@/powersync/AppSchema';

const OVERSWIPE_DIST = 20;

export interface ToDoProps {
  item: Todo;
  getIndex: () => number | undefined;
  drag: () => void;
  isActive: boolean;
  colors: MD3Colors;
  enableSwipe?: boolean;
  itemRefs: React.MutableRefObject<Map<string, SwipeableItemImperativeRef>>;
  onToggleComplete: (id: string) => void;
  openEditBottomSheet: (item: Todo) => void;
  deleteTodo: (id: string) => void;
  sections: Section[];
}

export const getBorderColor = (priority: PriorityType) => {
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

export interface UnderlayLeftProps {
  deleteTodo: (id: string) => void;
  todoId: string;
}

export interface UnderlayRightProps {
  onToggleComplete: (id: string) => void;
  todo: Todo;
}

const WIDTH = Dimensions.get('window').width;

const UnderlayLeft = ({deleteTodo, todoId}: UnderlayLeftProps) => {
  const {percentOpen} = useSwipeableItemParams();
  const animStyle = useAnimatedStyle(
    () => ({
      opacity: percentOpen.value,
    }),
    [percentOpen],
  );

  const handleDelete = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    deleteTodo(todoId);
  };

  return (
    <Animated.View style={[styles.row, styles.underlayLeft, animStyle]}>
      <TouchableOpacity
        testID="delete-touchableOpacity"
        onPress={handleDelete}
        style={styles.deleteButton}>
        <Icon source="delete" size={24} color="white" />
        <Text style={styles.text}>delete</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const UnderlayRight = ({onToggleComplete, todo}: UnderlayRightProps) => {
  const {percentOpen} = useSwipeableItemParams();
  const animStyle = useAnimatedStyle(
    () => ({
      opacity: percentOpen.value,
    }),
    [percentOpen],
  );

  const handleComplete = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    onToggleComplete(todo.id);
  };

  return (
    <Animated.View style={[styles.row, styles.underlayRight, animStyle]}>
      <TouchableOpacity onPress={handleComplete} style={styles.deleteButton}>
        {/* Conditionally render the content if todo is not completed */}
        {!todo.completed ? (
          <>
            <Icon source="check-circle" size={24} color="white" />
            <Text style={styles.text}>Complete</Text>
          </>
        ) : (
          <>
            <Icon source="close-box" size={24} color="white" />
            <Text style={styles.text}>undo Complete</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const ToDoItem = ({
  item,
  isActive,
  drag,
  colors,
  enableSwipe = false,
  itemRefs,
  onToggleComplete,
  openEditBottomSheet,
  deleteTodo,
  sections,
}: ToDoProps) => {
  const {title, priority, id, completed, summary, due_date, section_id} = item;
  const [toggleCheckBox, setToggleCheckBox] = useState<0 | 1>(completed as 0 | 1);

  // Shared values for translation
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Update animation based on isActive
    // Update animation based on isActive
    translateX.value = withSpring(isActive ? 40 : 0, {
      damping: 20, // Lower damping for faster animation
      stiffness: 300, // Higher stiffness for faster animation
      mass: 1, // Default mass
      velocity: 10, // Higher velocity for quicker start
    });
    translateY.value = withSpring(isActive ? -20 : 0, {
      damping: 20, // Lower damping for faster animation
      stiffness: 300, // Higher stiffness for faster animation
      mass: 1, // Default mass
      velocity: 100, // Higher velocity for quicker start
    });
  }, [isActive, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{translateX: translateX.value}, {translateY: translateY.value}],
    }),
    [translateX.value, translateY.value],
  );

  const openEditTodoModal = (item: Todo) => {
    openEditBottomSheet(item);
  };

  const getSectionNameById = useCallback(
    (section_id: string) => {
      const section = sections.find(sec => sec.id === section_id);
      return section ? section.name : '[invalid section id] ';
    },
    [sections],
  );

  const contentStyle = useMemo(
    () => ({
      borderColor: getBorderColor(priority as PriorityType),
      opacity: toggleCheckBox ? 0.5 : 1,
      marginVertical: 3,
      marginHorizontal: 10,
    }),
    [priority, toggleCheckBox],
  );

  return (
    <TouchableOpacity
      testID="todo-item"
      activeOpacity={1}
      onLongPress={drag}
      onPress={() => openEditTodoModal(item)}
      style={contentStyle}>
      <SwipeableItem
        key={id}
        item={item}
        ref={ref => {
          if (!id) return;
          if (ref && !itemRefs.current.has(id)) {
            itemRefs.current.set(id, ref);
          }
        }}
        onChange={({openDirection, snapPoint}) => {
          if (!id) return;
          if (openDirection !== OpenDirection.NONE) {
            [...itemRefs.current.entries()].forEach(([key, ref]) => {
              if (key !== id && ref) ref.close();
            });
          }

          if (snapPoint === WIDTH) {
            if (openDirection === OpenDirection.LEFT) {
              deleteTodo(id);
            } else {
              onToggleComplete(id);
            }
          }
        }}
        swipeEnabled={enableSwipe}
        overSwipe={OVERSWIPE_DIST}
        renderUnderlayLeft={() => <UnderlayLeft deleteTodo={deleteTodo} todoId={item.id!} />}
        renderUnderlayRight={() => (
          <UnderlayRight onToggleComplete={onToggleComplete} todo={item} />
        )}
        snapPointsRight={[130, WIDTH]}
        snapPointsLeft={[100, WIDTH]}>
        <Animated.View
          style={[
            styles.contentContainer,
            animatedStyle,
            {backgroundColor: colors.inverseOnSurface},
          ]}>
          <CheckBox
            role="checkbox"
            testID="todo-checkbox"
            disabled={false}
            value={toggleCheckBox === 1} // Use boolean value for checkbox
            onValueChange={() => {
              const newValue = toggleCheckBox === 1 ? 0 : 1; // Toggle between 0 and 1
              setToggleCheckBox(newValue);
              onToggleComplete(id);
            }}
            style={{borderColor: getBorderColor(priority as PriorityType)}}
            color={toggleCheckBox ? '#CCCCCC' : undefined}
          />
          <View style={styles.textContainer}>
            <Text
              variant="titleSmall"
              style={{
                marginLeft: 10,
                textDecorationLine: toggleCheckBox ? 'line-through' : 'none',
              }}>
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
              {getSectionNameById(section_id as string)}
            </Text>
          </View>
        </Animated.View>
      </SwipeableItem>
    </TouchableOpacity>
  );
};

export default ToDoItem;
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
    backgroundColor: 'green',
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
