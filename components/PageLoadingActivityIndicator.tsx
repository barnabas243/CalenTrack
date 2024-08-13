import React from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {useTheme} from 'react-native-paper';

const PageLoadingActivityIndicator = () => {
  const {colors} = useTheme();
  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ActivityIndicator size="large" color={colors.primary} />
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
