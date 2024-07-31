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
import {AddTodoModalProps, HighlightedElementType} from './AddTodoModal.types';
import {PriorityType, SectionItem} from '@/contexts/TodoContext.types';
import * as chrono from 'chrono-node';
import {Text, useTheme, Chip, Divider} from 'react-native-paper';
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet';
import DateTimePicker, {DateType} from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import isBetween from 'dayjs/plugin/isBetween';
import {MaterialCommunityIcons} from '@expo/vector-icons';

dayjs.extend(isBetween);
dayjs.extend(calendar);

const AddTodoModal = ({
  isVisible,
  setIsVisible,
  onBackdropPress,
  onSubmitEditing,
  sections,
  userId,
}: AddTodoModalProps) => {
  const {colors} = useTheme();

  const [todoName, setTodoName] = useState('');
  const [summary, setSummary] = useState('');

  const [startDate, setStartDate] = useState<Date>();
  const [dueDate, setDueDate] = useState<Date>();
  const [dueDateTitle, setDueDateTitle] = useState('Due Date');

  const [todoPriority, setTodoPriority] = useState<PriorityType>('4');

  const [highlightedText, setHighlightedText] = useState<HighlightedElementType[]>([]);
  const [textLength, setTextLength] = useState(0);
  const inputRef = useRef<TextInput>(null);

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipX, setTooltipX] = useState(0);
  const [tooltipY, setTooltipY] = useState(0);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  const [shortcut, setShortcut] = useState('');

  const [selectedSection, setSelectedSection] = useState('Inbox');
  const [sectionId, setSectionId] = useState<number | undefined>();

  const dueDateBottomSheetRef = useRef<BottomSheet>(null);

  const shortcutsBtns = [
    {
      title: dueDateTitle,
      icon: 'calendar',
      color: colors.primaryContainer,
      onPress: () => {
        if (dueDateBottomSheetRef.current) {
          dueDateBottomSheetRef.current.expand();
          setIsVisible(false);
        }
      },
    },
    {
      title: 'Priority',
      icon: 'flag',
      color: colors.errorContainer,
      onPress: () => {
        setShortcut('priority');
        insertShortcutText('!');
      },
    },
    {
      title: 'Section',
      icon: 'label',
      color: colors.secondaryContainer,
      onPress: () => {
        setShortcut('label');
        insertShortcutText('@');
      },
    },
    {
      title: 'Reminder',
      icon: 'bell',
      color: colors.tertiaryContainer,
      onPress: () => {
        alert('Clicked on Reminder badge');
      },
    },
  ];

  const resetUserToDoInput = () => {
    setHighlightedText([]);
    setTodoName('');
    setTodoPriority('4');
    setSummary('');
    setDueDate(undefined);
    setDueDateTitle('Today');
    setStartDate(undefined);
    setShortcut('');
    setSelectedSection('Inbox');
  };

  const handleTextChange = (text: string) => {
    let highlightedElements: HighlightedElementType[] = Array.from(text); // Initialize with each character
    setTextLength(text.length);

    if (text.trim()) {
      try {
        const parsedResult = chrono.parse(text);
        if (parsedResult.length === 0 && dueDateTitle === 'Due Date') {
          setDueDate(chrono.parseDate('today') || new Date());
          setDueDateTitle('Today');
        }

        setTooltipVisible(false);
        parsedResult.forEach(data => {
          const interpretedDate = data.start.date();
          setDueDate(interpretedDate);
          setDueDateTitle(
            `${interpretedDate.toLocaleDateString()} ${interpretedDate.toLocaleTimeString()}`,
          );

          const parsedText = data.text;
          const startIndex = text.indexOf(parsedText);
          const endIndex = startIndex + parsedText.length;

          // Replace characters with highlighted text
          for (let i = startIndex; i < endIndex; i++) {
            highlightedElements[i] = null; // Clear current characters to replace
          }
          highlightedElements[startIndex] = (
            <Text key={`date-${startIndex}`} style={styles.highlight}>
              {parsedText}
            </Text>
          );
        });

        let wordStartIndex = 0;
        setTooltipVisible(false);

        text.split(' ').forEach((word: string) => {
          if (word.startsWith('@')) {
            const startIndex = text.indexOf(word, wordStartIndex);
            const endIndex = startIndex + word.length;

            // Replace characters with mention text
            for (let i = startIndex; i < endIndex; i++) {
              highlightedElements[i] = null; // Clear current characters to replace
            }
            highlightedElements[startIndex] = (
              <Text key={`mention-${startIndex}`} style={styles.mention}>
                {word}
              </Text>
            );

            setSelectedSection(word.slice(1));
            setTooltipVisible(true);
            setShortcut('label');

            wordStartIndex = endIndex; // Update start index for next word search
          } else if (word.startsWith('!')) {
            const startIndex = text.indexOf(word, wordStartIndex);
            const endIndex = startIndex + word.length;

            let todoPriority;
            if (word.length > 1) {
              todoPriority = word.slice(1) as PriorityType;

              if (!todoPriority) return null;
              else {
                setTodoPriority(todoPriority);
              }
            }
            // Replace characters with @ text
            for (let i = startIndex; i < endIndex; i++) {
              highlightedElements[i] = null; // Clear current characters to replace
            }
            highlightedElements[startIndex] = (
              <Text key={`mention-${startIndex}`} style={styles.mention}>
                {word}
              </Text>
            );

            setTooltipVisible(true);
            setShortcut('priority');

            wordStartIndex = endIndex; // Update start index for next word search
          } else {
            const wordBeforeSpace: string | '' =
              text.substring(wordStartIndex, text.indexOf(text, wordStartIndex)).split(' ').pop() ||
              '';

            // console.log("wordBeforeSpace: ", wordBeforeSpace);
            if (wordBeforeSpace.startsWith('@') || wordBeforeSpace.startsWith('!')) {
              setTooltipVisible(false);
            }

            wordStartIndex = text.indexOf(word, wordStartIndex) + word.length; // Update start index to next word (including space)
          }
        });
        setHighlightedText(highlightedElements.filter(el => el !== null)); // remove null elements

        const stringElements = highlightedElements.filter(el => typeof el === 'string');
        const todoName = stringElements.join('').replace(/ +/g, ' '); // remove consecutive spaces

        setTodoName(todoName);
      } catch (error) {
        console.error('Error parsing date:', error);
        setHighlightedText(Array.from(text));
        setTooltipVisible(false);
      }
    } else {
      setHighlightedText(Array.from(text));
      setTooltipVisible(false);
    }
  };
  const handleSummaryChange = (text: string) => {
    setSummary(text.trim());
  };

  const handlePriorityPress = (priority: PriorityType) => {
    setTodoPriority(priority as PriorityType);
    updateTextIfSymbolIsLastChar('!', priority.toString());
  };

  function handleLabelPress(label: SectionItem): void {
    updateTextIfSymbolIsLastChar('@', label);
  }
  const handleSubmitEditing = () => {
    onSubmitEditing(
      {
        title: todoName.trim(),
        summary: summary.trim(), // Fill in the summary property
        completed: false,
        completed_at: undefined,
        due_date: dueDate,
        start_date: startDate,
        recurrence: undefined,
        priority: todoPriority,
        section_id: sectionId,
        created_by: userId,
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
      tooltipRows.push(
        <TouchableOpacity key={'priority 1'} onPress={() => handlePriorityPress('1')}>
          <Text>Priority 1</Text>
        </TouchableOpacity>,
      );
      tooltipRows.push(
        <TouchableOpacity key={'priority 2'} onPress={() => handlePriorityPress('2')}>
          <Text>Priority 2</Text>
        </TouchableOpacity>,
      );
      tooltipRows.push(
        <TouchableOpacity key={'priority 3'} onPress={() => handlePriorityPress('3')}>
          <Text>Priority 3</Text>
        </TouchableOpacity>,
      );
      tooltipRows.push(
        <TouchableOpacity key={'priority 4'} onPress={() => handlePriorityPress('4')}>
          <Text>Priority 4</Text>
        </TouchableOpacity>,
      );
    } else if (shortcut === 'label') {
      // get all the existing labels

      Object.entries(sections)
        .filter(([labelKey, labelValue]) => {
          return labelValue.name.toLowerCase().includes(selectedSection.toLowerCase());
        })
        .map(([labelKey, labelValue]) => {
          tooltipRows.push(
            <TouchableOpacity key={labelValue.id} onPress={() => handleLabelPress(labelValue)}>
              <Text>{labelValue.name}</Text>
            </TouchableOpacity>,
          );
          return null; // Ensure you return something in map
        });

      if (
        selectedSection.trim() &&
        !sections
          .map(label => label.name.toLowerCase()) // Access the name property
          .includes(selectedSection.toLowerCase())
      ) {
        tooltipRows.push(
          <TouchableOpacity
            key="create-new-label"
            onPress={() => handleLabelPress(selectedSection)}>
            <Text>+ create Label {selectedSection}</Text>
          </TouchableOpacity>,
        );
      }
    }
    if (tooltipRows.length > 0) return <>{tooltipRows}</>;
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
        setSelectedSection('Inbox');
      } else if (symbol === '!') setTodoPriority('4');

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
    return dateObj.format('DD/MM/YYYY');
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
          <TextInput
            placeholder="Summary"
            value={summary}
            onChangeText={handleSummaryChange}
            blurOnSubmit={false}
            style={[styles.textInput, {color: colors.onSurface}]}
            onSubmitEditing={handleSubmitEditing}
          />

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
                  icon={item.icon}
                  onPress={item.onPress}
                  style={{backgroundColor: item.color}}>
                  {item.title}
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
              <TextInput
                placeholder="due date"
                value={dayjs(dueDate).format('DD MMM')}
                style={[styles.textInput, {color: colors.onSurface}]}
                editable={false}
              />
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
