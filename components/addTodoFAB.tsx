import React from 'react';
import {FAB} from 'react-native-paper';
import {StyleSheet} from 'react-native';

export interface AddTodoFABProps {
  onPress: () => void;
}
const AddTodoFAB = ({onPress}: AddTodoFABProps) => {
  return <FAB icon="plus" style={styles.fabStyle} onPress={onPress} />;
};

const styles = StyleSheet.create({
  fabStyle: {
    bottom: 16,
    right: 16,
    position: 'absolute',
  },
});

export default AddTodoFAB;
