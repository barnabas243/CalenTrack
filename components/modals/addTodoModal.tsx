import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Modal from 'react-native-modal';
import {AddTodoModalProps, HighlightedElementType} from './addTodoModal.types';
import * as chrono from 'chrono-node';
import {
  Text,
  useTheme,
  Chip,
  Divider,
  Icon,
  IconButton,
  List,
  RadioButton,
} from 'react-native-paper';
import BottomSheet, {BottomSheetBackdrop, BottomSheetScrollView} from '@gorhom/bottom-sheet';
import DateTimePickerUI, {DateType} from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import isBetween from 'dayjs/plugin/isBetween';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {RRule} from 'rrule';
import {getBorderColor} from '../ToDoItem';
import {PriorityType} from '@/store/todo/types';
import {useAuth} from '@/hooks/useAuth';
import {ReminderOption, Section} from '@/powersync/AppSchema';
import DatePicker from 'react-native-date-picker';
import {getFormattedDate} from './EditTodoModalContent';
import {Portal} from 'react-native-portalize';
import {useSystem} from '@/powersync/system';

dayjs.extend(isBetween);
dayjs.extend(calendar);

const AddTodoModal = ({
  isVisible,
  setIsVisible,
  onBackdropPress,
  onSubmitEditing,
  sections,
  propSelectedSection = undefined,
  propSelectedStartDate = undefined,
  propSelectedDueDate = undefined,
  propParentId = null,
}: AddTodoModalProps) => {
  const {colors} = useTheme();
  const {user} = useAuth();
  const [todoName, setTodoName] = useState('');

  const {supabaseConnector} = useSystem();

  const [range, setRange] = useState<{startDate: DateType; endDate: DateType}>({
    startDate: propSelectedStartDate,
    endDate: propSelectedDueDate,
  });
  const [dueDateTitle, setDueDateTitle] = useState('');

  const [startDateTitle, setStartDateTitle] = useState('today');

  const [selectedSection, setSelectedSection] = useState(propSelectedSection?.name ?? 'Inbox');

  useEffect(() => {
    if (!propSelectedSection) return;
    handleTextChange(`#${propSelectedSection.name} `);
  }, [propSelectedSection]);
  // Initialize state only once
  useEffect(() => {
    const now = dayjs().toDate();
    const initialEndDate = propSelectedDueDate ?? dayjs().endOf('day').toDate();
    const initialStartDate = propSelectedStartDate ?? now;

    setRange({
      startDate: initialStartDate,
      endDate: initialEndDate,
    });

    setStartDateTitle(
      dayjs(initialStartDate).isSame(now)
        ? 'today'
        : dayjs(initialStartDate).isSame(now, 'day')
          ? dayjs(initialStartDate).format('[Today] h:mm A')
          : dayjs(initialStartDate).format('ddd, MMM D, h:mm A'),
    );

    setDueDateTitle(
      dayjs(initialEndDate).isSame(dayjs().endOf('day').toDate(), 'minute')
        ? ''
        : dayjs(initialEndDate).isSame(dayjs(initialStartDate), 'day')
          ? dayjs(initialEndDate).format('h:mm A')
          : dayjs(initialEndDate).format('ddd, MMM D, h:mm A'),
    );
  }, [propSelectedDueDate, propSelectedStartDate]); // Empty dependency array

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

  const [reminder_option, setReminderOption] = useState<ReminderOption | null>(null);

  const dueDateBottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      onBackdropPress();
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, [onBackdropPress]);

  const shortcutsBtns = [
    {
      title: `${startDateTitle}${dueDateTitle && dueDateTitle.trim() !== '' ? ` - ${dueDateTitle}` : ''}`,
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
        insertShortcutText('#');
      },
    },
  ];

  const resetUserToDoInput = () => {
    setHighlightedText([]);
    setTodoName('');
    setTodoPriority('4');
    setRange({startDate: undefined, endDate: undefined});
    setStartDateTitle('today');
    setDueDateTitle('');
    setShortcut('');
    setSelectedSection('Inbox');
    setRecurrenceRule(null);
    setReminderOption(null);
  };

  const handleTextChange = (text: string) => {
    const highlightedElements = parseText(text);
    setHighlightedText(highlightedElements);
    setTextLength(text.length);
  };

  const parseText = (text: string) => {
    let highlightedElements: HighlightedElementType[] = Array.from(text);

    if (text) {
      try {
        const parsedResult = chrono.parse(text);

        highlightedElements = highlightDatesAndMentions(parsedResult, text, highlightedElements);
        const stringElements = highlightedElements.filter(el => typeof el === 'string');
        const todoName = stringElements.join('').replace(/ +/g, ' '); // remove consecutive spaces

        setTodoName(todoName);
      } catch (error) {
        console.error('Error parsing date:', error);
        setTooltipVisible(false);
      }
    } else {
      resetUserToDoInput();
      setTooltipVisible(false);
    }

    return highlightedElements;
  };

  const highlightDatesAndMentions = (
    parsedResult: chrono.en.ParsedResult[],
    text: string,
    highlightedElements: HighlightedElementType[],
  ) => {
    // Get the last item from parsedResult

    if (parsedResult.length > 0) {
      const latestDates = parsedResult[parsedResult.length - 1];

      const isOnlyStartDate = latestDates.start && !latestDates.end;
      const startDate = latestDates.start.date();
      const endDate = isOnlyStartDate ? dayjs(startDate).add(1, 'hour') : latestDates.end!.date();

      setRange(prevRange => ({
        ...prevRange,
        startDate,
        endDate,
      }));

      const formattedStartDate = getCustomFormattedDate(dayjs(startDate));
      const formattedEndDate = getCustomFormattedDate(dayjs(endDate));

      if (dayjs(startDate).isSame(dayjs(endDate), 'day')) {
        setStartDateTitle(formattedStartDate);
        setDueDateTitle(dayjs(endDate).format('h:mm A'));
      } else {
        setStartDateTitle(formattedStartDate);
        setDueDateTitle(formattedEndDate);
      }
      const parsedText = latestDates.text;
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
    } else {
      setRange(prevRange => ({
        ...prevRange,
        startDate: dayjs(new Date()),
        endDate: dayjs(new Date()).endOf('day'),
      }));
      setStartDateTitle('today');
      setDueDateTitle('');
    }

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
      if ((word.startsWith('#') || word.startsWith('!')) && word.length === 1) {
        const symbol = word === '#' ? 'label' : 'priority';
        if (word === '#') {
          setSelectedSection('');
        } else if (word === '!') {
          setTodoPriority('4');
          setTodoPriorityTitle('P4');
        }

        setShortcut(symbol);
        setTooltipVisible(true);
      } else if (word.startsWith('#')) {
        setTooltipVisible(true);
        highlightWord(word, text, highlightedElements, wordStartIndex, 'label');
        setSelectedSection(word.slice(1));
      } else if (word.startsWith('!') && isValidPriorityType(word.slice(1))) {
        highlightWord(word, text, highlightedElements, wordStartIndex, 'priority');
        setTodoPriority(word.slice(1) as PriorityType);
        setTodoPriorityTitle(`P${word.slice(1)}`);
        setTooltipVisible(false);
      } else if (word.startsWith('!') && !isValidPriorityType(word.slice(1))) {
        setTodoPriority('4');
        setTodoPriorityTitle('P4');
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

    if (shortcutType === 'priority') {
      const color = getBorderColor(word.slice(1) as PriorityType);
      highlightedElements[startIndex] = (
        <Text key={`${shortcutType}-${startIndex}`} style={{backgroundColor: color || 'orange'}}>
          {word}
        </Text>
      );
    } else {
      highlightedElements[startIndex] = (
        <Text key={`${shortcutType}-${startIndex}`} style={styles.mention}>
          {word}
        </Text>
      );
    }
  };

  const isValidPriorityType = (value: string): value is PriorityType => {
    return ['1', '2', '3', '4'].includes(value);
  };

  const handlePriorityPress = (priority: PriorityType) => {
    setTodoPriority(priority as PriorityType);
    setTodoPriorityTitle(`P${priority}`);
    updateTextIfSymbolIsLastChar('!', priority.toString() as PriorityType);
  };

  function handleLabelPress(label: Section | string): void {
    updateTextIfSymbolIsLastChar('#', label);
  }
  const handleSubmitEditing = async () => {
    const start_date =
      dayjs(range?.startDate).toISOString() ||
      dayjs(range?.startDate).startOf('day').add(1, 'second').toISOString() || // Corrected from `endDate` to `startDate`
      null;

    const due_date =
      dayjs(range?.endDate).toISOString() ||
      dayjs(range?.endDate).endOf('day').toISOString() ||
      null;

    const newTodo = {
      title: todoName.trim(),
      summary: '',
      completed: 0,
      due_date: due_date,
      start_date: start_date,
      recurrence: recurrenceRule?.toString() || null,
      priority: todoPriority,
      section_id: null, // Logic looks correct
      created_by: user!.id,
      parent_id: propParentId ?? null,
      created_at: null,
      completed_at: null,
      reminder_option: reminder_option,
      notification_id: null,
      type: 'todo',
    };

    resetUserToDoInput();

    const uuid = await supabaseConnector.generateUUID().catch(error => {
      console.error('Error generating UUID:', error);
      return;
    });

    if (!uuid) {
      console.error('UUID is not defined');
      return;
    }

    const updatedTodo = {...newTodo, id: uuid};
    onSubmitEditing(updatedTodo, selectedSection);
  };

  // render tooltip items from shortcut char
  const renderTooltipRows = (shortcut: string) => {
    let tooltipRows: JSX.Element[] = [];

    if (shortcut === 'priority') {
      tooltipRows = Array.from({length: 4}, (_, i) => (
        <React.Fragment>
          <TouchableOpacity
            key={`priority-${i + 1}`}
            style={{flexDirection: 'row', padding: 10}}
            onPress={() => handlePriorityPress((i + 1).toString() as PriorityType)}>
            <Icon
              source="flag"
              size={24}
              color={getBorderColor((i + 1).toString() as PriorityType)}
            />
            <Text style={{marginLeft: 10}}>Priority {i + 1}</Text>
          </TouchableOpacity>
          {i < 3 && <Divider />}
        </React.Fragment>
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
        labelValue.name!.toLowerCase().includes(selectedSection.toLowerCase()),
      )
      .forEach(([key, labelValue], index, array) => {
        tooltipRows.push(
          <TouchableOpacity
            key={labelValue.id}
            style={styles.margin10}
            onPress={() => handleLabelPress(labelValue)}>
            <Text>#{labelValue.name}</Text>
          </TouchableOpacity>,
        );

        // Add divider if it's not the last item
        if (index < array.length - 1) {
          tooltipRows.push(<Divider />);
        }
      });

    if (
      selectedSection.trim() &&
      !sections.some(label => label.name!.toLowerCase() === selectedSection.toLowerCase())
    ) {
      tooltipRows.push(
        <TouchableOpacity
          style={styles.margin10}
          key="create-new-label"
          onPress={() => handleLabelPress(selectedSection)}>
          <Text>+ create Label {selectedSection}</Text>
        </TouchableOpacity>,
      );
    }

    return tooltipRows;
  };

  const updateTextIfSymbolIsLastChar = (symbol: string, label: Section | string | PriorityType) => {
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
      setSelectedSection(label.name!);
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

      if (symbol === '#') {
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

  const handleCalendarDateChange = ({
    newStartDate,
    newEndDate,
  }: {
    newStartDate?: DateType; // Allowing these to be optional
    newEndDate?: DateType;
  }) => {
    // Check if newStartDate is defined, otherwise set the title to an empty string
    const formattedStartDate = getCustomFormattedDate(dayjs(newStartDate));

    // Check if newEndDate is defined, otherwise set the title to an empty string
    const formattedEndDate = newEndDate ? getCustomFormattedDate(dayjs(newEndDate)) : '';

    if (dayjs(newStartDate).isSame(dayjs(newEndDate), 'day')) {
      setStartDateTitle(formattedStartDate);
      setDueDateTitle(dayjs(newEndDate).format('h:mm A'));
    } else {
      setStartDateTitle(formattedStartDate);
      setDueDateTitle(formattedEndDate);
    }
    // Update the range state
    setRange(prev => ({
      startDate: newStartDate,
      endDate: newEndDate,
    }));
  };

  const handleDateChange = (date: Date, type: 'start' | 'end') => {
    const newDate = dayjs(date);
    const currentStartDate = dayjs(range.startDate);
    const currentDueDate = dayjs(range.endDate);

    if (type === 'start') {
      if (newDate.isAfter(currentDueDate) && newDate.hour() < currentDueDate.hour()) {
        const newDueDate = newDate
          .set('hour', currentDueDate.hour())
          .set('minute', currentDueDate.minute())
          .set('second', currentDueDate.second());

        setRange(prev => ({
          ...prev,
          startDate: newDate,
          endDate: newDueDate,
        }));

        // Check if newStartDate is defined, otherwise set the title to an empty string
        const formattedStartDate = newDate ? getCustomFormattedDate(dayjs(newDate)) : '';

        // Check if newEndDate is defined, otherwise set the title to an empty string
        const formattedEndDate = newDueDate ? getCustomFormattedDate(dayjs(newDueDate)) : '';

        setStartDateTitle(formattedStartDate);
        setDueDateTitle(formattedEndDate);
      } else if (newDate.isAfter(currentDueDate) && newDate.hour() > currentDueDate.hour()) {
        const newDueDate = newDate
          .add(1, 'day')
          .set('hour', currentDueDate.hour())
          .set('minute', currentDueDate.minute())
          .set('second', currentDueDate.second());

        setRange(prev => ({
          ...prev,
          startDate: newDate,
          endDate: newDueDate,
        }));

        const formattedStartDate = newDate ? getCustomFormattedDate(dayjs(newDate)) : '';
        const formattedEndDate = newDueDate ? getCustomFormattedDate(dayjs(newDueDate)) : '';

        setStartDateTitle(formattedStartDate);
        setDueDateTitle(formattedEndDate);
      } else {
        // Update only the start date
        setRange(prev => ({
          ...prev,
          startDate: newDate,
        }));

        const formattedStartDate = newDate ? getCustomFormattedDate(dayjs(newDate)) : '';
        setStartDateTitle(formattedStartDate);
      }
    } else if (type === 'end') {
      if (newDate.isBefore(currentStartDate) && newDate.hour() > currentStartDate.hour()) {
        // If the new due date is before the current start date, set start date to be one day before the new due date
        const newStartDate = newDate
          .set('hour', currentStartDate.hour())
          .set('minute', currentStartDate.minute())
          .set('second', currentStartDate.second());

        setRange(prev => ({
          startDate: newStartDate,
          endDate: newDate,
        }));

        const formattedStartDate = newStartDate ? getCustomFormattedDate(dayjs(newStartDate)) : '';
        const formattedEndDate = newDate ? getCustomFormattedDate(dayjs(newDate)) : '';

        setStartDateTitle(formattedStartDate);
        setDueDateTitle(formattedEndDate);
      } else if (newDate.isBefore(currentStartDate) && newDate.hour() < currentStartDate.hour()) {
        const newStartDate = newDate
          .subtract(1, 'day')
          .set('hour', currentStartDate.hour())
          .set('minute', currentStartDate.minute())
          .set('second', currentStartDate.second());

        setRange(prev => ({
          endDate: newDate,
          startDate: newStartDate,
        }));

        const formattedStartDate = newStartDate ? getCustomFormattedDate(dayjs(newStartDate)) : '';
        const formattedEndDate = newDate ? getCustomFormattedDate(dayjs(newDate)) : '';

        setStartDateTitle(formattedStartDate);
        setDueDateTitle(formattedEndDate);
      } else {
        // Update only the due date
        setRange(prev => ({
          ...prev,
          endDate: newDate,
        }));

        const formattedEndDate = newDate ? getCustomFormattedDate(dayjs(newDate)) : '';
        setDueDateTitle(formattedEndDate);
      }
    }
  };

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setIsVisible(true);
      }
    },
    [setIsVisible],
  );
  const snapPoints = useMemo(() => ['50%', '85%'], []);
  return (
    <>
      <Modal
        isVisible={isVisible}
        onBackdropPress={onBackdropPress}
        // onTouchEnd={onBackdropPress}
        onBackButtonPress={onBackdropPress}
        onDismiss={onBackdropPress}
        style={{margin: 0}}
        animationIn="fadeInUp">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            flex: 1,
            justifyContent: 'flex-end',
          }}>
          <View style={[styles.inputModal, {backgroundColor: colors.inverseOnSurface}]}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginRight: 30,
                alignContent: 'center',
              }}>
              <TextInput
                ref={inputRef}
                placeholder="Eg, Schedule a meeting at 10am #SectionName !1"
                multiline
                placeholderTextColor={colors.secondary}
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
              <IconButton
                id="send-button"
                testID="send-button"
                icon="send"
                size={24}
                iconColor={todoName.trim() ? colors.primary : colors.surfaceDisabled}
                disabled={!todoName.trim()}
                onPress={handleSubmitEditing}
              />
            </View>
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
        </KeyboardAvoidingView>
      </Modal>
      <Portal>
        <BottomSheet
          ref={dueDateBottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enableContentPanningGesture={false}
          enablePanDownToClose={true}
          backgroundStyle={{backgroundColor: colors.inverseOnSurface, flex: 1}}
          backdropComponent={props => (
            <BottomSheetBackdrop
              {...props}
              opacity={0.5}
              enableTouchThrough={false}
              appearsOnIndex={0}
              disappearsOnIndex={-1}
              style={[{backgroundColor: 'rgba(0, 0, 0, 1)'}, StyleSheet.absoluteFillObject]}
            />
          )}>
          <BottomSheetScrollView
            style={[styles.container, {backgroundColor: colors.inverseOnSurface}]}>
            <View style={{flexDirection: 'row', marginVertical: 20}}>
              <MaterialCommunityIcons name="pen" size={24} color={colors.onSurface} />
              <Text style={{color: colors.onSurface, marginLeft: 10}}>
                {startDateTitle}
                {dueDateTitle && dueDateTitle.trim() !== '' ? ` - ${dueDateTitle}` : ''}
              </Text>
            </View>
            <Divider style={{backgroundColor: colors.secondary}} />
            <View>
              <View style={{marginVertical: 20}}>
                <DateTimePickerUI
                  mode="range"
                  minDate={dayjs().startOf('day').add(1, 'second').toDate()}
                  startDate={range.startDate}
                  endDate={range.endDate}
                  displayFullDays
                  weekDaysTextStyle={{color: colors.onSurface}}
                  headerTextStyle={{color: colors.onSurface}}
                  calendarTextStyle={{color: colors.onSurface}}
                  yearContainerStyle={{backgroundColor: colors.inverseOnSurface}}
                  monthContainerStyle={{backgroundColor: colors.inverseOnSurface}}
                  onChange={params => {
                    handleCalendarDateChange({
                      newStartDate: params.startDate,
                      newEndDate: params.endDate,
                    });
                  }}
                />
              </View>
            </View>

            <Divider />
            <List.AccordionGroup>
              <List.Accordion
                left={props => <List.Icon {...props} icon="calendar-start" />}
                right={() => <></>}
                style={{backgroundColor: colors.inverseOnSurface}}
                titleStyle={{alignSelf: 'flex-end'}}
                title={getFormattedDate(
                  range.startDate?.toString() || '',
                  range.startDate?.toString() || '',
                  'start',
                )}
                id="1">
                <List.Item
                  title=""
                  right={() => (
                    <DatePicker
                      minimumDate={dayjs().startOf('day').add(1, 'second').toDate()}
                      date={dayjs(range.startDate).toDate()}
                      onDateChange={date => handleDateChange(date, 'start')}
                      dividerColor={colors.primary}
                    />
                  )}
                />
              </List.Accordion>
              <Divider />
              <List.Accordion
                left={props => <List.Icon {...props} icon="calendar-end" />}
                right={() => <></>}
                titleStyle={{alignSelf: 'flex-end'}}
                style={{backgroundColor: colors.inverseOnSurface}}
                title={getFormattedDate(
                  range.startDate?.toString() || '',
                  range.endDate?.toString() || '',
                  'end',
                )}
                id="2">
                <List.Item
                  title=""
                  right={() => (
                    <DatePicker
                      minimumDate={dayjs().startOf('day').add(1, 'second').toDate()}
                      date={dayjs(range.endDate).toDate()}
                      onDateChange={date => handleDateChange(date, 'end')}
                      dividerColor={colors.primary}
                    />
                  )}
                />
              </List.Accordion>
              <Divider />
              <List.Accordion
                id="3"
                title={reminder_option ?? 'Reminder'}
                left={props => <List.Icon {...props} icon="bell" />}
                titleStyle={{alignSelf: 'flex-end'}}
                style={{backgroundColor: colors.inverseOnSurface}}
                right={() => <></>}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <RadioButton.Group
                    onValueChange={value => setReminderOption(value as ReminderOption | null)}
                    value={reminder_option ?? ''}>
                    <View style={styles.radioContainer}>
                      <RadioButton value="At Time of Event" />
                      <Text>At Time of Event</Text>
                    </View>
                    <View style={styles.radioContainer}>
                      <RadioButton value="10 Minutes Before" />
                      <Text>10 Minutes Before</Text>
                    </View>
                    <View style={styles.radioContainer}>
                      <RadioButton value="1 Hour Before" />
                      <Text>1 Hour Before</Text>
                    </View>
                    <View style={styles.radioContainer}>
                      <RadioButton value="1 Day Before" />
                      <Text>1 Day Before</Text>
                    </View>
                    <View style={styles.radioContainer}>
                      <RadioButton value="custom" />
                      <Text>Custom</Text>
                    </View>
                  </RadioButton.Group>
                </View>
              </List.Accordion>
            </List.AccordionGroup>
            <Divider />
            {/* Add the recurrence options here */}
          </BottomSheetScrollView>
        </BottomSheet>
      </Portal>
    </>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
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
  margin10: {
    margin: 10,
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
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
});
export default AddTodoModal;
