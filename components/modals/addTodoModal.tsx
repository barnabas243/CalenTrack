import React, {useEffect, useRef, useState} from 'react';
import {View, FlatList, TouchableOpacity, StyleSheet, Dimensions, TextInput} from 'react-native';
import Modal from 'react-native-modal';
import {AddTodoModalProps, HighlightedElementType} from './AddTodoModal.types';
import {PriorityType, SectionItem} from '@/contexts/TodoContext.types';
import * as chrono from 'chrono-node';
import {Text, Button, useTheme} from 'react-native-paper';

const AddTodoModal = ({
  isVisible,
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

  const shortcutsBtns = [
    {
      title: dueDateTitle,

      onPress: () => {
        alert('Clicked on due date');
      },
    },
    {
      title: 'Priority',
      onPress: () => {
        setShortcut('priority');
        insertShortcutText('!');
      },
    },
    {
      title: 'Section',
      onPress: () => {
        setShortcut('label');
        insertShortcutText('@');
      },
    },
    {
      title: 'Reminder',
      onPress: () => {
        alert('Clicked on Reminder badge');
      },
    },
  ];

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current?.focus();
      }, 100); // Adjust the delay as needed
    }
  }, [isVisible]);

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
    setSummary(text);
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
        title: todoName,
        summary: summary, // Fill in the summary property
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

  return (
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
      <View style={styles.inputModal}>
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
          onSubmitEditing={handleSubmitEditing}
          style={styles.textInput}
          blurOnSubmit={false}>
          <Text style={[styles.highlightContainer, {color: colors.onPrimary}]}>
            {highlightedText}
          </Text>
        </TextInput>
        <TextInput
          placeholder="Summary"
          value={summary}
          onChangeText={handleSummaryChange}
          blurOnSubmit={false}
          style={styles.textInput}
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
              <Button mode="contained" onPress={item.onPress}>
                {item.title}
              </Button>
            </View>
          )}
        />
      </View>
    </Modal>
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
    backgroundColor: 'white',
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
