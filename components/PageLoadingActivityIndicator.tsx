import React from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {useTheme} from 'react-native-paper';

const PageLoadingActivityIndicator = () => {
  const {colors} = useTheme();
  return (
    <View
      testID="activity-indicator-container"
      style={[styles.container, {backgroundColor: colors.background}]}>
      <ActivityIndicator testID="activity-indicator" size="large" color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PageLoadingActivityIndicator;
