import React, {useState, useRef, useEffect, useCallback} from 'react';
import {View, StyleSheet, KeyboardAvoidingView, Platform, Appearance} from 'react-native';
import {Appbar, Checkbox, Menu, TextInput} from 'react-native-paper';
import {getBorderColor} from '../ToDoItem';
import {
  CoreBridge,
  darkEditorCss,
  darkEditorTheme,
  defaultEditorTheme,
  RichText,
  TenTapStartKit,
  Toolbar,
  useEditorBridge,
} from '@10play/tentap-editor';
import {debounce} from 'lodash';
import {router} from 'expo-router';
import {PriorityType} from '@/store/todo/types';
import {MD3Colors} from 'react-native-paper/lib/typescript/types';
import {Section, Todo} from '@/powersync/AppSchema';
export interface EditTodoModalContentProps {
  todo: Todo;
  onDismiss: (oldTodo: Todo, newTodo: Todo) => void;
  sections: Section[];
  colors: MD3Colors;
  deleteTodo: (id: string) => void;
}

const EditTodoModalContent = ({
  todo,
  onDismiss,
  sections,
  colors,
  deleteTodo,
}: EditTodoModalContentProps) => {
  const [isPriorityMenuVisible, setIsPriorityMenuVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [newTodo, setNewTodo] = useState<Todo>(todo); // Initialize with the todo prop
  const [titleInputFocus, setTitleInputFocus] = useState(false);
  const [inputHeight, setInputHeight] = useState(20);
  const titleInputRef = useRef(null);
  const colorScheme = Appearance.getColorScheme();

  const latestNewTodo = useRef(newTodo);

  const findSectionById = (id: string) =>
    sections.find(section => section.id === id)?.name || 'Unknown';

  const handlePriorityChange = (priority: PriorityType) => {
    setNewTodo(prev => ({...prev, priority}));
    setIsPriorityMenuVisible(false);
  };
  const handleCompletedChange = () =>
    setNewTodo(prev => ({...prev, completed: prev.completed ? 0 : 1}));
  const handleTitleChange = (text: string) => setNewTodo(prev => ({...prev, title: text}));
  const handleContentSizeChange = (event: {
    nativeEvent: {contentSize: {height: React.SetStateAction<number>}};
  }) => setInputHeight(event.nativeEvent.contentSize.height);

  const handleSummaryChange = useCallback((summary: string) => {
    setNewTodo(prevTodo => ({...prevTodo, summary: summary.trim()}));
  }, []);

  const getSectionIndex = (id: string) => sections.findIndex(sec => sec.id === id);

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: newTodo.summary || '',
    onChange: debounce(async () => {
      const summary = await editor.getText();
      handleSummaryChange(summary);
    }, 300),
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(colorScheme === 'dark' ? darkEditorCss : ''),
    ],
    theme: colorScheme === 'dark' ? darkEditorTheme : defaultEditorTheme,
  });

  // Update refs whenever values change
  useEffect(() => {
    latestNewTodo.current = newTodo;
  }, [newTodo]);

  // Effect to handle unmount logic
  useEffect(() => {
    console.log('EditTodoModalContent mounted');

    return () => {
      console.log('EditTodoModalContent unmounted');
      console.log('latestNewTodo.current', latestNewTodo.current);
      onDismiss(todo, latestNewTodo.current);
    };
  }, []); // Empty dependency array ensures it runs only on mount and unmount

  return (
    <View style={styles.container}>
      <Appbar.Header statusBarHeight={0}>
        <Appbar.Content
          title={findSectionById(newTodo.section_id || '568c6c1d-9441-4cbc-9fc5-23c98fee1d3d')}
          titleStyle={{fontSize: 16}}
          onPress={() => {
            console.log('Appbar.Content pressed');
            // handleDismiss();
            router.replace(
              `/inbox?id=${getSectionIndex(newTodo.section_id || '568c6c1d-9441-4cbc-9fc5-23c98fee1d3d')}`,
            );
          }}
        />
        <Menu
          anchorPosition="bottom"
          visible={isPriorityMenuVisible}
          onDismiss={() => setIsPriorityMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="flag"
              color={getBorderColor(newTodo.priority as PriorityType)}
              onPress={() => setIsPriorityMenuVisible(true)}
            />
          }>
          {['4', '3', '2', '1'].map(priority => (
            <Menu.Item
              key={priority}
              onPress={() => handlePriorityChange(priority as PriorityType)}
              leadingIcon="flag"
              title={`Priority ${priority}`}
              trailingIcon={newTodo.priority === priority ? 'check' : ''}
            />
          ))}
        </Menu>
        <Menu
          anchorPosition="bottom"
          visible={isMenuVisible}
          onDismiss={() => setIsMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              color={colors.onSurfaceVariant}
              onPress={() => setIsMenuVisible(true)}
            />
          }>
          <Menu.Item
            onPress={() => {
              setIsMenuVisible(false);
              setTimeout(() => {
                onDismiss(todo, newTodo);
                deleteTodo(todo.id);
              }, 1000);
            }}
            title="delete"
          />
        </Menu>
      </Appbar.Header>
      <View style={styles.inputContainer}>
        <Checkbox
          status={newTodo.completed ? 'checked' : 'unchecked'}
          onPress={handleCompletedChange}
        />
        <TextInput
          ref={titleInputRef}
          mode="outlined"
          outlineStyle={{borderWidth: titleInputFocus ? 1 : 0}}
          multiline
          textBreakStrategy="highQuality"
          value={newTodo.title!}
          onChangeText={handleTitleChange}
          style={{
            flex: 1,
            borderWidth: 0,
            height: Math.max(20, inputHeight),
            justifyContent: 'flex-start',
          }}
          contentStyle={{textAlignVertical: 'top', marginVertical: -13}}
          onFocus={() => setTitleInputFocus(true)}
          onBlur={() => setTitleInputFocus(false)}
          onContentSizeChange={handleContentSizeChange}
          right={
            titleInputFocus && (
              <TextInput.Icon
                borderless
                icon="check"
                color="purple"
                onPress={() => titleInputRef.current?.blur()}
              />
            )
          }
        />
      </View>

      <RichText editor={editor} showsVerticalScrollIndicator={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

export default EditTodoModalContent;
