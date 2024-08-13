import React, {memo} from 'react';
import {Dimensions, Text, View} from 'react-native';
import type {AutocompleteDropdownItem} from 'react-native-autocomplete-dropdown';
import {AutocompleteDropdown} from 'react-native-autocomplete-dropdown';

const ItemSeparatorComponent = () => (
  <View style={{height: 1, width: '100%', backgroundColor: '#d8e1e6'}} />
);

export interface AutoCompleteDropDownProps {
  data: AutocompleteDropdownItem[];
  onSelectItem: (item: AutocompleteDropdownItem) => void;
}
export const AutoCompleteDropDown = memo(function AutoCompleteDropDown({
  data,
  onSelectItem,
}: AutoCompleteDropDownProps) {
  return (
    <>
      <AutocompleteDropdown
        clearOnFocus={false}
        closeOnBlur={true}
        showClear={true}
        initialValue={''}
        emptyResultText="No results found"
        onSelectItem={item => onSelectItem(item)}
        dataSet={data}
        textInputProps={{
          placeholder: 'Search...',
        }}
        renderItem={(item, text) => (
          <Text
            style={{
              color: '#f00',
              padding: 28,
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: 16,
            }}>
            {item.title}
          </Text>
        )}
        ItemSeparatorComponent={ItemSeparatorComponent}
        ignoreAccents
        suggestionsListMaxHeight={Dimensions.get('window').height / 1.5}
      />
    </>
  );
});
