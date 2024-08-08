import React, {useCallback, useState} from 'react';
import {Alert, SectionList, View, StyleSheet, ColorSchemeName} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {supabase} from '@/utils/supabase';
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
import {StatusBar} from 'expo-status-bar';
import {Appearance} from 'react-native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {useAuth} from '@/hooks/useAuth';

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
let count = 0;
export default function SettingsPage() {
  console.log('SettingsPage rendered ', ++count);
  const {user, isLoading} = useAuth();
  const {colors} = useTheme();

  const [theme, setTheme] = useState<Theme>('system');
  const [visible, setVisible] = useState(false);

  const showModal = useCallback(() => setVisible(true), []);
  const hideModal = useCallback(() => setVisible(false), []);

  const handleThemeChange = useCallback((value: string) => {
    console.log('Theme changed to:', value);
    setTheme(value as Theme);
    Appearance.setColorScheme(value === 'system' ? null : (value as ColorSchemeName));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      // Sign out of Google
      if (user?.app_metadata.providers.includes('google')) {
        await GoogleSignin.signOut();
      }
      // Sign out of Supabase
      const {error} = await supabase.auth.signOut();
      if (error) throw error;

      // Optionally, redirect user or perform any additional logic after logout
      console.log('Successfully signed out');

      // For example, redirect to the login screen or update state
      // router.replace('/login');
    } catch (error) {
      Alert.alert('Error Signing Out', error.message);
    }
  }, [user]);

  const sections = [
    {
      title: 'Preferences',
      data: [{key: 'theme', title: 'Theme', type: 'modal'}],
    },
    {
      title: 'Account Settings',
      data: [
        {key: 'changePassword', title: 'Change Password', type: 'button'},
        {key: 'manageAccounts', title: 'Manage Connected Accounts', type: 'button'},
      ],
    },
    {
      title: 'App Information',
      data: [
        {key: 'about', title: 'About', type: 'button'},
        {key: 'help', title: 'Help & Support', type: 'button'},
        {key: 'terms', title: 'Terms of Service & Privacy Policy', type: 'button'},
      ],
    },
    {
      title: '',
      data: [{key: 'logout', title: 'Logout', type: 'button'}],
    },
  ];

  const renderSectionHeader = ({section: {title}}: {section: {title: string}}) => (
    <List.Subheader>{title}</List.Subheader>
  );

  const renderItem = ({item, index, section}: {item: any; index: number; section: any}) =>
    item.key === 'logout' ? (
      <View style={styles.logoutButtonContainer}>
        <Button
          mode="contained"
          onPress={handleLogout}
          icon={iconMapping[item.key]}
          style={styles.logoutButton}>
          {item.title}
        </Button>
      </View>
    ) : (
      <View
        style={[
          {backgroundColor: colors.secondaryContainer},
          index === 0 && styles.firstItem,
          index === section.data.length - 1 && styles.lastItem,
        ]}>
        {item.type === 'modal' ? (
          <List.Item
            style={styles.horizontallySpaced}
            title={item.title}
            onPress={showModal}
            left={() => <List.Icon icon={iconMapping[item.key]} />}
            right={() => <List.Icon icon="chevron-right" />}
          />
        ) : (
          <List.Item
            style={styles.horizontallySpaced}
            title={item.title}
            left={() => <List.Icon icon={iconMapping[item.key]} />}
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => {}}
          />
        )}
        {index < section.data.length - 1 && (
          <Divider style={[styles.divider, {backgroundColor: colors.primary}]} horizontalInset />
        )}
      </View>
    );

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar style="auto" />
      <SectionList
        showsVerticalScrollIndicator={false}
        sections={sections}
        keyExtractor={item => item.key}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        ListHeaderComponent={() => (
          <View style={styles.contentContainer}>
            <Card onPress={() => console.log('pressed Card')}>
              <Card.Title
                title={user?.user_metadata.full_name}
                subtitle={user?.user_metadata.email}
                left={props => (
                  <Avatar.Image {...props} source={{uri: user?.user_metadata.avatar_url}} />
                )}
              />
            </Card>
          </View>
        )}
        renderSectionFooter={() => <View style={styles.footer} />}
      />
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={[styles.modalContainer, {backgroundColor: colors.background}]}>
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
  divider: {
    borderWidth: 0.1,
    opacity: 0.2,
  },
  footer: {
    paddingBottom: 20,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalButton: {
    marginTop: 20,
  },
  logoutButtonContainer: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  logoutButton: {
    width: '100%',
  },
});
