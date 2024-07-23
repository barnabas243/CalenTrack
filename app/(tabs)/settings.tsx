import {SafeAreaView, StyleSheet, Alert, SectionList, View} from 'react-native';
import {supabase} from '@/utils/supabase';
import {useUser} from '@/contexts/UserContext';
import {
  ActivityIndicator,
  Avatar,
  Button,
  List,
  Modal,
  Portal,
  RadioButton,
  Text,
  useTheme,
} from 'react-native-paper';
import {useState} from 'react';
import dayjs from 'dayjs';
import React from 'react';

type ThemeProps = 'system' | 'dark' | 'light';
export default function SettingsPage() {
  const {user, isLoading} = useUser();
  const {colors} = useTheme();

  const [theme, setTheme] = useState<ThemeProps>('system'); // 'system', 'dark', 'light'
  const [visible, setVisible] = useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  const handleThemeChange = (value: string) => {
    setTheme(value as ThemeProps);
    // Handle theme change logic here
  };

  const handleLogout = async () => {
    const {error} = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error Signing Out User', error.message);
    }
  };

  const sections = [
    {
      title: 'Preferences',
      data: [{key: 'theme', title: 'Theme', type: 'modal'}],
      renderItem: ({item, index, section}) => {
        if (item.type === 'modal') {
          return (
            <View
              style={[
                {backgroundColor: colors.surface},
                index === 0 && styles.firstItem,
                index === section.data.length - 1 && styles.lastItem,
              ]}>
              <List.Item
                style={styles.horizontallySpaced}
                title={item.title}
                onPress={showModal}
                left={() => <List.Icon icon="theme-light-dark" />}
                right={() => <List.Icon icon="chevron-right" />}
              />
            </View>
          );
        }
      },
    },
    {
      title: 'Account Settings',
      data: [
        {key: 'changePassword', title: 'Change Password', type: 'button'},
        {key: 'manageAccounts', title: 'Manage Connected Accounts', type: 'button'},
      ],
      renderItem: ({item, index, section}) => (
        <View
          style={[
            {backgroundColor: colors.surface},
            index === 0 && styles.firstItem,
            index === section.data.length - 1 && styles.lastItem,
          ]}>
          <List.Item
            style={styles.horizontallySpaced}
            title={item.title}
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => {}}
          />
        </View>
      ),
    },
    {
      title: 'App Information',
      data: [
        {key: 'about', title: 'About', type: 'button'},
        {key: 'help', title: 'Help & Support', type: 'button'},
        {key: 'terms', title: 'Terms of Service & Privacy Policy', type: 'button'},
      ],
      renderItem: ({item, index, section}) => (
        <View
          style={[
            {backgroundColor: colors.surface},
            index === 0 && styles.firstItem,
            index === section.data.length - 1 && styles.lastItem,
          ]}>
          <List.Item
            style={styles.horizontallySpaced}
            title={item.title}
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => {}}
          />
        </View>
      ),
    },
    {
      title: '',
      data: [{key: 'logout', title: 'Logout', type: 'button'}],
      renderItem: ({item, index, section}) => (
        <View>
          <Button mode="contained" onPress={handleLogout}>
            {item.title}
          </Button>
        </View>
      ),
    },
  ];
  const modalContainerStyle = {
    backgroundColor: colors.background,
    padding: 20,
    margin: 20,
    borderRadius: 10,
  };

  if (isLoading) {
    return <ActivityIndicator />;
  }
  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        showsVerticalScrollIndicator={false}
        sections={sections}
        keyExtractor={item => item.key}
        renderSectionHeader={({section: {title}}) => <List.Subheader>{title}</List.Subheader>}
        renderItem={({item, index, section}) => {
          return section.renderItem({item, index, section});
        }}
        ListHeaderComponent={() => (
          <View style={styles.profileContainer}>
            <Avatar.Image size={100} source={{uri: user?.user_metadata.avatar_url}} />
            <View style={styles.profileTextContainer}>
              <Text ellipsizeMode="tail" style={styles.profileName}>
                {user?.user_metadata.full_name}
              </Text>
              <Text style={{fontSize: 16, color: colors.outline, paddingBottom: 8}}>
                {user?.user_metadata.email}
              </Text>
              <Text style={{color: colors.outline}}>
                Joined since {dayjs(user?.created_at).format('MMMM DD, YYYY')}
              </Text>
            </View>
          </View>
        )}
        renderSectionFooter={() => <View style={{paddingBottom: 20}} />}
      />
      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={modalContainerStyle}>
          <Text style={styles.modalTitle}>Select Theme</Text>
          <RadioButton.Group onValueChange={handleThemeChange} value={theme}>
            <RadioButton.Item label="System Default" value="system" />
            <RadioButton.Item label="Dark" value="dark" />
            <RadioButton.Item label="Light" value="light" />
          </RadioButton.Group>
          <Button onPress={hideModal} style={styles.modalButton}>
            Close
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
    padding: 12,
    marginHorizontal: 12,
  },

  profileContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  profileTextContainer: {
    marginLeft: 15,
    justifyContent: 'center',
  },
  profileName: {
    marginTop: 10,
    fontSize: 22,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalButton: {
    marginTop: 20,
  },
  horizontallySpaced: {
    // Add the horizontallySpaced style here
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  firstItem: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  lastItem: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});
