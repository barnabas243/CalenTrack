import {StyleSheet, Alert, SectionList, View, ColorSchemeName} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {supabase} from '@/utils/supabase';
import {useUser} from '@/contexts/UserContext';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Divider,
  List,
  Modal,
  Portal,
  RadioButton,
  Text,
  useTheme,
} from 'react-native-paper';
import {useState} from 'react';
import React from 'react';
import {StatusBar} from 'expo-status-bar';
import {Appearance} from 'react-native';

export type Theme = 'system' | 'dark' | 'light';

const iconMapping = {
  theme: 'theme-light-dark',
  changePassword: 'key',
  manageAccounts: 'account-group',
  about: 'information-outline',
  help: 'help-circle-outline',
  terms: 'file-document-outline',
  logout: 'logout',
};

export default function SettingsPage() {
  const {user, isLoading} = useUser();
  const {colors} = useTheme();

  const [theme, setTheme] = useState<Theme>('system');
  const [visible, setVisible] = useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  const handleThemeChange = (value: string) => {
    console.log('Theme changed to:', value);
    setTheme(value as Theme);
    if (value === 'system') Appearance.setColorScheme(null);
    if (value === 'dark') Appearance.setColorScheme('dark');
    if (value === 'light') Appearance.setColorScheme('light');
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
      renderItem: ({item, index, section}) => (
        <View
          style={[
            {backgroundColor: colors.secondaryContainer},
            index === 0 && styles.firstItem,
            index === section.data.length - 1 && styles.lastItem,
          ]}>
          <List.Item
            style={styles.horizontallySpaced}
            title={item.title}
            onPress={showModal}
            left={() => <List.Icon icon={iconMapping[item.key]} />}
            right={() => <List.Icon icon="chevron-right" />}
          />
          {index < section.data.length - 1 && (
            <Divider
              style={{
                borderWidth: 0.1,
                opacity: 0.2,
                backgroundColor: colors.primary,
              }}
              horizontalInset
            />
          )}
        </View>
      ),
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
            {backgroundColor: colors.secondaryContainer},
            index === 0 && styles.firstItem,
            index === section.data.length - 1 && styles.lastItem,
          ]}>
          <List.Item
            style={styles.horizontallySpaced}
            title={item.title}
            left={() => <List.Icon icon={iconMapping[item.key]} />}
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => {}}
          />
          {index < section.data.length - 1 && (
            <Divider
              style={{
                borderWidth: 0.1,
                opacity: 0.2,
                backgroundColor: colors.primary,
              }}
              horizontalInset
            />
          )}
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
            {backgroundColor: colors.secondaryContainer},
            index === 0 && styles.firstItem,
            index === section.data.length - 1 && styles.lastItem,
          ]}>
          <List.Item
            style={styles.horizontallySpaced}
            title={item.title}
            left={() => <List.Icon icon={iconMapping[item.key]} />}
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => {}}
          />
          {index < section.data.length - 1 && (
            <Divider
              style={{
                borderWidth: 0.1,
                opacity: 0.2,
                backgroundColor: colors.primary,
              }}
              horizontalInset
            />
          )}
        </View>
      ),
    },
    {
      title: '',
      data: [{key: 'logout', title: 'Logout', type: 'button'}],
      renderItem: ({item}) => (
        <View>
          <Button mode="contained" onPress={handleLogout} icon={iconMapping[item.key]}>
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
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.contentContainer}>
        <StatusBar style="auto" />
        <SectionList
          showsVerticalScrollIndicator={false}
          sections={sections}
          keyExtractor={item => item.key}
          renderSectionHeader={({section: {title}}) => <List.Subheader>{title}</List.Subheader>}
          renderItem={({item, index, section}) => section.renderItem({item, index, section})}
          ListHeaderComponent={() => (
            <Card onPress={() => console.log('pressed Card')}>
              <Card.Title
                title={user?.user_metadata.full_name}
                subtitle={user?.user_metadata.email}
                left={props => (
                  <Avatar.Image {...props} source={{uri: user?.user_metadata.avatar_url}} />
                )}
              />
            </Card>
          )}
          renderSectionFooter={() => <View style={{paddingBottom: 20}} />}
        />
        <Portal>
          <Modal
            visible={visible}
            onDismiss={hideModal}
            contentContainerStyle={modalContainerStyle}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  horizontallySpaced: {
    paddingHorizontal: 10,
  },
  firstItem: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  lastItem: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalButton: {
    marginTop: 20,
  },
});
