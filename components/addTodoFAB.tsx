import React from 'react';
import {FAB} from 'react-native-paper';
import {StyleSheet} from 'react-native';
import {useTodo} from '@/contexts/TodoContext';

const AddTodoFAB = () => {
  const {setShowInputModal} = useTodo();

  const handlePress = () => setShowInputModal(true);
  return <FAB icon="plus" style={styles.fabStyle} onPress={handlePress} />;
};

const styles = StyleSheet.create({
  fabStyle: {
    bottom: 16,
    right: 16,
    position: 'absolute',
  },
});

export default AddTodoFAB;
