import React, {memo} from 'react';
import {Dimensions, View, StyleSheet} from 'react-native';
import type {AutocompleteDropdownItem} from 'react-native-autocomplete-dropdown';
import {AutocompleteDropdown} from 'react-native-autocomplete-dropdown';
import {Divider, useTheme} from 'react-native-paper';
import {Text} from 'react-native-paper';

const ItemSeparatorComponent = () => <Divider />;

export interface AutoCompleteDropDownProps {
  data: AutocompleteDropdownItem[];
  onSelectItem: (item: AutocompleteDropdownItem) => void;
}
export const AutoCompleteDropDown = memo(function AutoCompleteDropDown({
  data,
  onSelectItem,
}: AutoCompleteDropDownProps) {
  const {colors} = useTheme();
  const renderItem = (item: AutocompleteDropdownItem, text: string) => (
    <Text style={[styles.item]}>{item.title}</Text>
  );
  return (
    <View testID="autocomplete-dropdown" style={{backgroundColor: colors.background}}>
      <AutocompleteDropdown
        trimSearchText
        // suggestionsListContainerStyle={{backgroundColor: colors.background}}
        clearOnFocus={false}
        closeOnBlur={true}
        showClear={true}
        EmptyResultComponent={<Text style={[styles.item]}>No results found</Text>}
        onSelectItem={item => {
          if (item) onSelectItem(item);
        }}
        dataSet={data}
        textInputProps={{
          placeholder: 'Search...',
        }}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparatorComponent}
        suggestionsListMaxHeight={Dimensions.get('window').height / 1.5}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    padding: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
