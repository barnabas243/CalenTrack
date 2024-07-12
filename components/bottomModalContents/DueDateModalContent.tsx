import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

import DateTimePicker, {DateType} from 'react-native-ui-datepicker';

const DueDateModalContent = ({...props}) => {
  const {dueDate, setDueDate, setDueDateTitle} = props;

  const handleDateChange = (newDate: DateType) => {
    setDueDate(newDate);
    // Use setDueDateTitle to update the title based on the new due date
    setDueDateTitle(newDate);
  };

  // renders
  return (
    <View style={styles.container}>
      <View style={{marginVertical: 20}}>
        <Text style={{fontSize: 18}}>Selected Due Date: {dueDate.toString()}</Text>
      </View>
      <View style={{marginVertical: 20}}>
        <View style={{marginVertical: 20}}>
          <DateTimePicker
            mode="single"
            date={dueDate}
            onChange={params => {
              handleDateChange(params.date);
            }}
            timePicker
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
});

export default DueDateModalContent;
