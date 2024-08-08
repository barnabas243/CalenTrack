import React, {useEffect, useState} from 'react';
import {TouchableOpacity, StyleSheet, View, LayoutAnimation} from 'react-native';
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
import {PriorityType, TodoItem} from '@/store/todo/types';
import {SectionItem} from '@/store/section/types';

const OVERSWIPE_DIST = 20;

export interface ToDoItemProps {
  item: TodoItem;
  getIndex: () => number | undefined;
  drag: () => void;
  isActive: boolean;
  colors: MD3Colors;
  enableSwipe?: boolean;
  itemRefs: React.MutableRefObject<Map<string, SwipeableItemImperativeRef>>;
  onToggleComplete: (id: string) => void;
  openEditBottomSheet: (item: TodoItem) => void;
  deleteTodo: (id: string) => void;
  sections: SectionItem[];
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
const ToDoItem = ({...props}: ToDoItemProps) => {
  const [toggleCheckBox, setToggleCheckBox] = useState(false);

  const {
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
  } = props;

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

  const openEditTodoModal = (item: TodoItem) => {
    openEditBottomSheet(item);
  };

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
      deleteTodo(id);
    };

    return (
      <Animated.View style={[styles.row, styles.underlayLeft, animStyle]}>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Icon source={'delete'} size={24} color="white" />
          <Text style={styles.text}>delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  function getSectionNameById(section_id: number) {
    const section = sections.find(sec => sec.id === section_id);
    return section ? section.name : '[invalid section id] ';
  }

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
          zIndex: isActive ? 99 : 0,
        },
      ]}>
      {enableSwipe ? (
        <SwipeableItem
          key={id!}
          item={item}
          ref={ref => {
            if (ref && !itemRefs.current.has(id)) {
              itemRefs.current.set(id, ref);
            }
          }}
          onChange={({openDirection}) => {
            if (openDirection !== OpenDirection.NONE) {
              // Close all other open items
              [...itemRefs.current.entries()].forEach(([key, ref]) => {
                if (key !== id && ref) ref.close();
              });
            }
          }}
          overSwipe={OVERSWIPE_DIST}
          renderUnderlayLeft={() => <UnderlayLeft />}
          snapPointsLeft={[100]}>
          <Animated.View
            style={[
              styles.contentContainer,
              animatedStyle,
              {backgroundColor: colors.inverseOnSurface},
            ]}>
            <CheckBox
              disabled={false}
              value={toggleCheckBox}
              onValueChange={() => onToggleComplete(id)}
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
                {getSectionNameById(section_id || 1)}
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
            onValueChange={() => onToggleComplete(id)}
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
              {getSectionNameById(section_id || 1)}
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ToDoItem;
