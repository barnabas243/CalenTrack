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

/**
 * Props for ToDoItem component
 * @property {Todo} item - The todo item
 * @property {() => number | undefined} getIndex - Function to get the index of the item
 * @property {() => void} drag - Function to handle drag event
 * @property {boolean} isActive - Indicates if the item is active
 * @property {MD3Colors} colors - The color theme for the item
 * @property {boolean} enableSwipe - Indicates if swipe is enabled
 * @property {React.MutableRefObject<Map<string, SwipeableItemImperativeRef>>} itemRefs - Ref for the swipeable item
 * @property {(id: string) => void} onToggleComplete - Function to toggle the completion status of the item
 * @property {(item: Todo) => void} openEditBottomSheet - Function to open the edit bottom sheet
 * @property {(item: Todo) => void} deleteTodo - Function to delete the todo item
 * @property {Section[]} sections - The list of sections
 * @property {Todo[]} subItems - The list of sub-todo items
 * @property {string} key - The key for the item
 * @returns {React.ReactElement} A React component
 */
export interface ToDoProps {
  item: Todo;
  getIndex?: () => number | undefined;
  drag?: () => void;
  isActive?: boolean;
  colors: MD3Colors;
  enableSwipe?: boolean;
  itemRefs?: React.MutableRefObject<Map<string, SwipeableItemImperativeRef>>;
  onToggleComplete: (id: string) => void;
  openEditBottomSheet: (item: Todo) => void;
  deleteTodo: (item: Todo) => void;
  sections: Section[];
  subItems?: Todo[];
  key?: string;
}

/**
 * Get the border color based on the priority level
 * @param {PriorityType} priority - The priority level
 * @returns {string} The border color
 */
export const getBorderColor = (priority: PriorityType) => {
  switch (priority) {
    case '1':
      return 'red';
    case '2':
      return 'orange';
    case '3':
      return 'blue';
    default:
      return '#CCCCCC';
  }
};

export interface UnderlayLeftProps {
  deleteTodo: (item: Todo) => void;
  todo: Todo;
}

export interface UnderlayRightProps {
  onToggleComplete: (id: string) => void;
  todo: Todo;
}

const WIDTH = Dimensions.get('window').width;

const UnderlayLeft = ({deleteTodo, todo}: UnderlayLeftProps) => {
  const {percentOpen} = useSwipeableItemParams();
  const animStyle = useAnimatedStyle(
    () => ({
      opacity: percentOpen.value,
    }),
    [percentOpen],
  );

  return (
    <Animated.View style={[styles.row, styles.underlayLeft, animStyle]}>
      <TouchableOpacity
        testID="delete-touchableOpacity"
        onPressIn={() => deleteTodo(todo)}
        disabled={todo.type !== 'todo'}
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

  return (
    <Animated.View style={[styles.row, styles.underlayRight, animStyle]}>
      <TouchableOpacity
        onPress={() => onToggleComplete(todo.id)}
        style={styles.deleteButton}
        disabled={todo.type !== 'todo'}>
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
  subItems = [],
  key = item.id,
}: ToDoProps) => {
  const {title, priority, id, completed, summary, due_date, section_id} = item;
  const [toggleCheckBox, setToggleCheckBox] = useState<0 | 1>(completed as 0 | 1);

  useEffect(() => {
    // Update toggleCheckBox when completed prop changes
    setToggleCheckBox(prev => {
      if (prev !== completed) return completed as 0 | 1;
      return prev;
    });
  }, [completed]);

  // Shared values for translation
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Update animation based on isActive
    translateX.value = withSpring(isActive ? 40 : 0, {
      damping: 20, // Lower damping for faster animation
      stiffness: 300, // Higher stiffness for faster animation
      mass: 1,
      velocity: 10,
    });
    translateY.value = withSpring(isActive ? -20 : 0, {
      damping: 20,
      stiffness: 300,
      mass: 1,
      velocity: 100,
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

  const handleComplete = async (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    onToggleComplete(id);
  };

  const handleDelete = async (item: Todo) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    deleteTodo(item);
  };

  const getSectionNameById = useCallback(
    (section_id: string) => {
      const section = sections.find(sec => sec.id === section_id);
      return section ? section.name : `[invalid id: ${section_id}]`;
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
      key={key}
      testID="todo-item"
      activeOpacity={1}
      onLongPress={drag}
      onPress={() => openEditTodoModal(item)}
      style={contentStyle}>
      <SwipeableItem
        // key={id}
        item={item}
        ref={ref => {
          if (!id || !itemRefs) return;
          if (ref && !itemRefs.current.has(id)) {
            itemRefs.current.set(id, ref);
          }
        }}
        onChange={({openDirection, snapPoint}) => {
          if (!id) return;
          if (openDirection !== OpenDirection.NONE) {
            if (itemRefs)
              [...itemRefs.current.entries()].forEach(([key, ref]) => {
                if (key !== id && ref) ref.close();
              });
          }

          if (snapPoint === WIDTH) {
            if (openDirection === OpenDirection.LEFT) {
              handleDelete(item);
            } else {
              handleComplete(id);
            }
          }
        }}
        swipeEnabled={enableSwipe}
        overSwipe={OVERSWIPE_DIST}
        renderUnderlayLeft={() => <UnderlayLeft deleteTodo={handleDelete} todo={item} />}
        renderUnderlayRight={() => <UnderlayRight onToggleComplete={handleComplete} todo={item} />}
        snapPointsRight={[130, WIDTH]}
        snapPointsLeft={[100, WIDTH]}>
        <Animated.View
          style={[
            styles.contentContainer,
            animatedStyle,
            {backgroundColor: colors.inverseOnSurface},
          ]}>
          {item.type === 'todo' ? (
            <CheckBox
              role="checkbox"
              testID="todo-checkbox"
              disabled={item.type !== 'todo'}
              value={toggleCheckBox === 1} // Use boolean value for checkbox
              onValueChange={() => {
                const newValue = toggleCheckBox === 1 ? 0 : 1; // Toggle between 0 and 1
                setToggleCheckBox(newValue);
                onToggleComplete(id);
              }}
              style={{marginTop: 5, borderColor: getBorderColor(priority as PriorityType)}}
              color={toggleCheckBox ? '#CCCCCC' : undefined}
            />
          ) : null}
          <View style={styles.textContainer}>
            <Text
              variant="titleMedium"
              numberOfLines={2}
              style={{
                marginLeft: 10,
                textDecorationLine: toggleCheckBox ? 'line-through' : 'none',
              }}>
              {title}
            </Text>
            {summary && (
              <Text
                variant="bodySmall"
                numberOfLines={1}
                style={{marginLeft: 10, marginVertical: 5}}>
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
            {subItems.length > 0 && (
              <>
                <View style={styles.dueDateContainer}>
                  <MaterialCommunityIcons
                    name="transit-connection-horizontal"
                    size={14}
                    color={colors.error}
                    style={styles.icon}
                  />
                  <Text variant="bodySmall" style={[styles.dueDateText, {color: colors.error}]}>
                    {subItems.filter(subItem => subItem.completed).length}/{subItems.length}
                  </Text>
                </View>
              </>
            )}

            <Text variant="bodySmall" style={styles.bottomRightText}>
              {item.type === 'todo' ? getSectionNameById(section_id as string) : 'google calendar'}
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
