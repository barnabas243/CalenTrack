import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import Modal from 'react-native-modal';
import {AddTodoModalProps, HighlightedElementType} from './addTodoModal.types';
import * as chrono from 'chrono-node';
import {Text, useTheme, Chip, Divider, Icon} from 'react-native-paper';
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet';
import DateTimePicker, {DateType} from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import isBetween from 'dayjs/plugin/isBetween';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {RRule} from 'rrule';
import {getBorderColor} from '../ToDoItem';
import {PriorityType} from '@/store/todo/types';
import {useAuth} from '@/hooks/useAuth';

dayjs.extend(isBetween);
dayjs.extend(calendar);

// const test = RRule.fromText('every 2 hours on monday,tuesday,thursday');
// test.options.until = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

let count = 0;
const AddTodoModal = ({
  isVisible,
  setIsVisible,
  onBackdropPress,
  onSubmitEditing,
  sections,
  propSelectedSectionName = '',
  propSelectedDueDate = undefined,
}: AddTodoModalProps) => {
  console.log('AddTodoModal renderedq ', ++count);
  const {colors} = useTheme();
  const {user} = useAuth();

  const [todoName, setTodoName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [dueDate, setDueDate] = useState<Date | undefined>(propSelectedDueDate || dayjs().toDate());
  const [dueDateTitle, setDueDateTitle] = useState(
    dayjs(new Date()).endOf('day').format('[Today] h:mm A'),
  );
  const [recurrenceRule, setRecurrenceRule] = useState<RRule | null>(null);

  const [todoPriority, setTodoPriority] = useState<PriorityType>('4');
  const [todoPriorityTitle, setTodoPriorityTitle] = useState('P4');

  const [highlightedText, setHighlightedText] = useState<HighlightedElementType[]>([]);
  const [textLength, setTextLength] = useState(0);
  const inputRef = useRef<TextInput>(null);

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipX, setTooltipX] = useState(0);
  const [tooltipY, setTooltipY] = useState(0);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  const [shortcut, setShortcut] = useState('');

  console.log('propSelectedSectionName ', propSelectedSectionName);
  const [selectedSection, setSelectedSection] = useState(propSelectedSectionName ?? 'Inbox');
  const [sectionId, setSectionId] = useState<number | undefined>();

  const dueDateBottomSheetRef = useRef<BottomSheet>(null);

  const shortcutsBtns = [
    {
      title: dueDateTitle,
      icon: 'calendar',
      color: colors.primaryContainer,
      iconColor: colors.primary,
      onPress: () => {
        if (dueDateBottomSheetRef.current) {
          dueDateBottomSheetRef.current.expand();
          setIsVisible(false);
        }
      },
    },
    {
      title: todoPriorityTitle,
      icon: 'flag',
      color: colors.secondaryContainer,
      iconColor: getBorderColor(todoPriority),
      onPress: () => {
        setShortcut('priority');
        insertShortcutText('!');
      },
    },
    {
      title: selectedSection || 'Inbox',
      icon: 'label',
      color: colors.secondaryContainer,
      iconColor: colors.primary,
      onPress: () => {
        setShortcut('label');
        insertShortcutText('@');
      },
    },
  ];

  const resetUserToDoInput = () => {
    setHighlightedText([]);
    setTodoName('');
    setTodoPriority('4');
    setDueDate(dayjs().toDate());
    setDueDateTitle(dayjs(new Date()).endOf('day').format('[Today] h:mm A'));
    setStartDate(undefined);
    setShortcut('');
    setSelectedSection('');
    setRecurrenceRule(null);
  };

  const handleTextChange = (text: string) => {
    const highlightedElements = parseText(text);
    setHighlightedText(highlightedElements);
    setTextLength(text.length);
  };

  const parseText = (text: string) => {
    let highlightedElements: HighlightedElementType[] = Array.from(text);

    if (text.trim()) {
      try {
        const parsedResult = chrono.parse(text);

        if (parsedResult.length === 0 && dueDateTitle === 'Due Date') {
          setDueDate(chrono.parseDate('today') || new Date());
          setDueDateTitle('Today');
        }

        highlightedElements = highlightDatesAndMentions(parsedResult, text, highlightedElements);
        const stringElements = highlightedElements.filter(el => typeof el === 'string');
        const todoName = stringElements.join('').replace(/ +/g, ' '); // remove consecutive spaces

        setTodoName(todoName);
      } catch (error) {
        console.error('Error parsing date:', error);
        setTooltipVisible(false);
      }
    } else {
      setTooltipVisible(false);
    }

    return highlightedElements;
  };

  const highlightDatesAndMentions = (
    parsedResult: any,
    text: string,
    highlightedElements: HighlightedElementType[],
  ) => {
    parsedResult.forEach((data: any) => {
      const interpretedDate = data.start.date();
      const formattedDate = getCustomFormattedDate(dayjs(interpretedDate));

      setDueDate(interpretedDate);
      setDueDateTitle(formattedDate);

      const parsedText = data.text;
      const startIndex = text.indexOf(parsedText);
      const endIndex = startIndex + parsedText.length;

      for (let i = startIndex; i < endIndex; i++) {
        highlightedElements[i] = null;
      }
      highlightedElements[startIndex] = (
        <Text key={`date-${startIndex}`} style={styles.highlight}>
          {parsedText}
        </Text>
      );
    });

    highlightMentions(text, highlightedElements);
    highlightRecurrence(text);

    return highlightedElements.filter(el => el !== null);
  };

  const highlightMentions = (text: string, highlightedElements: HighlightedElementType[]) => {
    let wordStartIndex = 0;

    if (text.trim() === '') {
      setTooltipVisible(false);
    }

    text.split(' ').forEach((word: string) => {
      if ((word.startsWith('@') || word.startsWith('!')) && word.length === 1) {
        const symbol = word === '@' ? 'label' : 'priority';
        setSelectedSection('');
        setTodoPriority('4');
        setTodoPriorityTitle('P4');
        setShortcut(symbol);
        setTooltipVisible(true);
      } else if (word.startsWith('@')) {
        setTooltipVisible(true);
        highlightWord(word, text, highlightedElements, wordStartIndex, 'label');
        console.log('word:', word.slice(1));
        setSelectedSection(word.slice(1));
      } else if (word.startsWith('!') && isValidPriorityType(word.slice(1))) {
        highlightWord(word, text, highlightedElements, wordStartIndex, 'priority');
        setTodoPriority(word.slice(1) as PriorityType);
        setTodoPriorityTitle(`P${word.slice(1)}`);
        setTooltipVisible(false);
      } else {
        setTooltipVisible(false);
      }
      wordStartIndex = text.indexOf(word, wordStartIndex) + word.length;
    });
  };

  const highlightRecurrence = (text: string) => {
    // Check if the text contains "every"
    // Define the pattern to match "every" and everything that follows
    const everyPattern = /\bevery\s+.*/i;

    // Use the pattern to find the match
    const match = text.match(everyPattern);

    if (match) {
      try {
        // Extract the substring starting from "every"
        const result = match[0].trim();
        // Parse the recurrence rule from the text
        const rule = RRule.fromText(result);
        if (rule) {
          setRecurrenceRule(rule);
          setTooltipVisible(false);
          console.log('Recurrence rule:', rule.toString());
        }
      } catch (error) {
        console.error('Error parsing recurrence rule:', error);
        setRecurrenceRule(null);
      }
    } else {
      // Handle cases where text does not contain "every"
      setRecurrenceRule(null);
    }
  };

  const highlightWord = (
    word: string,
    text: string,
    highlightedElements: HighlightedElementType[],
    wordStartIndex: number,
    shortcutType: string,
  ) => {
    const startIndex = text.indexOf(word, wordStartIndex);
    const endIndex = startIndex + word.length;

    for (let i = startIndex; i < endIndex; i++) {
      highlightedElements[i] = null;
    }
    highlightedElements[startIndex] = (
      <Text key={`${shortcutType}-${startIndex}`} style={styles.mention}>
        {word}
      </Text>
    );
  };

  if (propSelectedSectionName) {
    highlightMentions(propSelectedSectionName, highlightedText);
  }

  const isValidPriorityType = (value: string): value is PriorityType => {
    return ['1', '2', '3', '4'].includes(value);
  };

  const handlePriorityPress = (priority: PriorityType) => {
    setTodoPriority(priority as PriorityType);
    setTodoPriorityTitle(`P${priority}`);
    updateTextIfSymbolIsLastChar('!', priority.toString());
  };

  function handleLabelPress(label: SectionItem): void {
    updateTextIfSymbolIsLastChar('@', label);
  }
  const handleSubmitEditing = () => {
    onSubmitEditing(
      {
        title: todoName.trim(),
        summary: '',
        completed: false,
        completed_at: undefined,
        due_date: dueDate || undefined,
        start_date: startDate || dayjs(dueDate).startOf('day').toDate(),
        recurrence: recurrenceRule?.toString() || undefined,
        priority: todoPriority,
        section_id: sectionId,
        created_by: user!.id,
        parent_id: undefined,
      },
      selectedSection,
    );

    resetUserToDoInput();
  };

  // render tooltip items from shortcut char
  const renderTooltipRows = (shortcut: string) => {
    let tooltipRows: JSX.Element[] = [];

    if (shortcut === 'priority') {
      tooltipRows = Array.from({length: 4}, (_, i) => (
        <TouchableOpacity
          key={`priority-${i + 1}`}
          onPress={() => handlePriorityPress((i + 1).toString() as PriorityType)}>
          <Text>Priority {i + 1}</Text>
        </TouchableOpacity>
      ));
    } else if (shortcut === 'label') {
      tooltipRows = renderLabelTooltipRows();
    }

    return tooltipRows.length > 0 ? <>{tooltipRows}</> : null;
  };

  const renderLabelTooltipRows = () => {
    const tooltipRows: JSX.Element[] = [];

    Object.entries(sections)
      .filter(([, labelValue]) =>
        labelValue.name.toLowerCase().includes(selectedSection.toLowerCase()),
      )
      .forEach(([, labelValue]) => {
        tooltipRows.push(
          <TouchableOpacity key={labelValue.id} onPress={() => handleLabelPress(labelValue)}>
            <Text>{labelValue.name}</Text>
          </TouchableOpacity>,
        );
      });

    if (
      selectedSection.trim() &&
      !sections.some(label => label.name.toLowerCase() === selectedSection.toLowerCase())
    ) {
      tooltipRows.push(
        <TouchableOpacity key="create-new-label" onPress={() => handleLabelPress(selectedSection)}>
          <Text>+ create Label {selectedSection}</Text>
        </TouchableOpacity>,
      );
    }

    return tooltipRows;
  };

  const updateTextIfSymbolIsLastChar = (symbol: string, label: SectionItem | PriorityType) => {
    // console.log("highlightedText: ", highlightedText);
    // console.log("option: ", option);
    // console.log("cursorPos: ", cursorPosition);

    // Check if the symbol is present within any JSX element in the highlightedText array
    const symbolPresent = highlightedText.some(element => {
      if (typeof element === 'string') {
        return element.includes(symbol);
      } else {
        // Handle JSX elements
        return element?.props.children?.toString().includes(symbol);
      }
    });

    if (!symbolPresent) {
      setTooltipVisible(true);

      return;
    }

    const labelValue = label?.name || label;
    const newText = (
      <Text key={`${symbol}${labelValue}`} style={styles.mention}>
        {symbol + labelValue}
      </Text>
    );

    // Copy the existing array and replace the last element with the new text
    const updatedText = [...highlightedText];
    updatedText.pop(); // Remove the last element
    updatedText.push(newText); // Add the new text
    setHighlightedText([...updatedText, ' ']);
    setTooltipVisible(false);

    if (typeof label !== 'string') {
      setSectionId(label.id);
      setSelectedSection(label.name);
    }
  };

  const insertShortcutText = (symbol: string) => {
    inputRef.current?.focus(); // Focus the TextInput
    const newPosition = textLength ?? 0; // Calculate the new cursor position (end of text)
    inputRef.current?.setSelection(newPosition, newPosition); // Set the cursor position to the end

    // Check if the symbol is already present in any JSX element in the highlightedText array
    const existingIndex = highlightedText.findIndex(element => {
      if (typeof element === 'string') {
        return element === symbol;
      } else {
        // Handle JSX elements
        return element?.props.children?.toString().includes(symbol);
      }
    });

    if (existingIndex !== -1) {
      // If the symbol already exists, remove it
      const newHighlightedText = [...highlightedText];
      newHighlightedText.splice(existingIndex, 2); // Remove the existing symbol

      if (symbol === '@') {
        setSectionId(undefined);
        setSelectedSection('');
      } else if (symbol === '!') {
        setTodoPriority('4');
        setTodoPriorityTitle('P4');
      }

      setHighlightedText(newHighlightedText);
      setTooltipVisible(false);
    } else {
      // If the symbol does not exist, add it
      if (highlightedText.length === 0 || highlightedText[highlightedText.length - 1] === ' ') {
        setHighlightedText([...highlightedText, symbol]);
      } else {
        setHighlightedText([...highlightedText, ' ', symbol]);
      }
      setTooltipVisible(true);
    }
  };

  function getCustomFormattedDate(date: dayjs.Dayjs): string {
    const now = dayjs();
    const dateObj = dayjs(date);

    // Define the start and end of the current week
    const startOfThisWeek = now.startOf('week');
    const endOfThisWeek = startOfThisWeek.endOf('week');

    // Define the start and end of the next week
    const startOfNextWeek = startOfThisWeek.add(1, 'week');
    const endOfNextWeek = startOfNextWeek.endOf('week');

    // Define the start and end of the last week
    const startOfLastWeek = startOfThisWeek.subtract(1, 'week');
    const endOfLastWeek = startOfLastWeek.endOf('week');

    // Check if the date is today
    if (dateObj.isSame(now, 'day')) {
      return dateObj.format('[Today] h:mm A');
    }
    // Check if the date is yesterday
    if (dateObj.isSame(now.subtract(1, 'day'), 'day')) {
      return dateObj.format('[Yesterday] h:mm A');
    }
    // Check if the date is tomorrow
    if (dateObj.isSame(now.add(1, 'day'), 'day')) {
      return dateObj.format('[Tomorrow] h:mm A');
    }
    // Check if the date is within the current week
    if (dateObj.isBetween(startOfThisWeek, endOfThisWeek, 'week', '[]')) {
      return dateObj.format('dddd h:mm A');
    }
    if (dateObj.isBetween(startOfNextWeek, endOfNextWeek, 'week', '[]')) {
      return dateObj.format('[Next] dddd h:mm A');
    }
    if (dateObj.isBetween(startOfLastWeek, endOfLastWeek, 'week', '[]')) {
      return dateObj.format('[Last] dddd h:mm A');
    }

    // For all other dates exceeding the range of +/- 7days
    return dateObj.format('DD/MM/YYYY h:mm A');
  }

  const handleDateChange = (newDate: DateType) => {
    // Use setDueDate to update the state with the new date
    const date = getCustomFormattedDate(dayjs(newDate));

    console.log(date);

    setDueDate(dayjs(newDate).toDate());
    // Use setDueDateTitle to update the title based on the new due date
    setDueDateTitle(date);
  };
  const handleSheetChanges = useCallback(
    (index: number) => {
      console.log('handleSheetChanges', index);
      if (index === -1) {
        setIsVisible(true);
      }
    },
    [setIsVisible],
  );
  const snapPoints = useMemo(() => ['50%', '75%'], []);
  return (
    <>
      <Modal
        isVisible={isVisible}
        onBackdropPress={onBackdropPress}
        style={{
          width: '100%',
          padding: 0,
          margin: 0,
          zIndex: 0,
        }}
        animationIn="fadeInUp">
        <View style={[styles.inputModal, {backgroundColor: colors.inverseOnSurface}]}>
          <TextInput
            ref={inputRef}
            placeholder="Task Name"
            onChangeText={handleTextChange}
            onSelectionChange={e => {
              const selection = e.nativeEvent.selection;
              let start = 20 + selection.start * 5.6;
              if (screenWidth < start + tooltipWidth + 20) start = screenWidth - tooltipWidth;
              setTooltipX(start);
            }}
            autoFocus
            onSubmitEditing={handleSubmitEditing}
            style={[styles.textInput, {color: colors.onSurface}]}
            blurOnSubmit={false}>
            <Text style={[styles.highlightContainer]}>{highlightedText}</Text>
          </TextInput>

          {tooltipVisible && (
            <View
              style={[
                styles.tooltip,
                {
                  left: tooltipX,
                  top: -tooltipY,
                  backgroundColor: colors.surface,
                },
              ]}
              onLayout={event => {
                const {height, width} = event.nativeEvent.layout;
                setTooltipY(height);
                setTooltipWidth(width);
              }}>
              {renderTooltipRows(shortcut)}
            </View>
          )}
          <FlatList
            horizontal
            keyboardShouldPersistTaps="always"
            data={shortcutsBtns}
            renderItem={({item}) => (
              <View style={styles.buttonContainer}>
                <Chip
                  mode="flat"
                  selectedColor={item.iconColor}
                  icon={() => <Icon source={item.icon} size={16} color={item.iconColor} />}
                  onPress={item.onPress}
                  style={{backgroundColor: item.color}}>
                  {item.title.toString()}
                </Chip>
              </View>
            )}
          />
        </View>
      </Modal>
      <BottomSheet
        ref={dueDateBottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enableContentPanningGesture={false}
        enablePanDownToClose={true}
        backgroundStyle={{backgroundColor: colors.inverseOnSurface, flex: 1}}
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
        )}>
        <BottomSheetView style={[styles.container, {backgroundColor: colors.inverseOnSurface}]}>
          <KeyboardAvoidingView style={{flex: 1}} behavior="padding">
            <View style={{flexDirection: 'row', marginVertical: 20}}>
              <MaterialCommunityIcons name="pen" size={24} color={colors.onSurface} />
              <Text style={{color: colors.onSurface, marginLeft: 10}}>{dueDateTitle}</Text>
            </View>
            <Divider style={{backgroundColor: colors.secondary}} />
            <View style={{marginVertical: 20}}>
              <View style={{marginVertical: 20}}>
                <DateTimePicker
                  mode="single"
                  date={dueDate}
                  minDate={dayjs().toDate()}
                  weekDaysTextStyle={{color: colors.onSurface}}
                  headerTextStyle={{color: colors.onSurface}}
                  timePickerTextStyle={{color: colors.onSurface}}
                  calendarTextStyle={{color: colors.onSurface}}
                  yearContainerStyle={{backgroundColor: colors.inverseOnSurface}}
                  dayContainerStyle={{backgroundColor: colors.inverseOnSurface}}
                  monthContainerStyle={{backgroundColor: colors.inverseOnSurface}}
                  timePickerIndicatorStyle={{backgroundColor: colors.inverseOnSurface}}
                  onChange={params => {
                    handleDateChange(params.date);
                  }}
                  timePicker
                />
              </View>
            </View>
            {/* Add the recurrence options here */}
          </KeyboardAvoidingView>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.58,
    shadowRadius: 16.0,

    elevation: 24,
    zIndex: 30,
  },
  inputModal: {
    padding: 20,
    width: '100%',
    top: 155,
  },
  textInput: {
    marginBottom: 10,
    width: '100%',
    fontSize: 18,
  },
  highlightContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  highlight: {
    backgroundColor: 'yellow',
  },
  mention: {
    backgroundColor: 'orange',
  },
  roundButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  collapsible: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'grey',
    padding: 10,
  },
  tooltip: {
    position: 'absolute',
    width: '80%',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    top: -40,
    zIndex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center', // Align badges vertically in the center
    paddingVertical: 10, // Adjust vertical padding as needed
    marginHorizontal: 10,
  },
  sectionHeader: {
    flex: 1,
    paddingTop: 15,
    paddingLeft: 10,
    fontSize: 15,
  },
  emptyView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
export default AddTodoModal;
