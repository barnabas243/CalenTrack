import React, {useCallback, useEffect, useState} from 'react';
import {Alert, SectionList, View, StyleSheet, ColorSchemeName, Appearance} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
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
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {useAuth} from '@/hooks/useAuth';
import {AuthError} from '@supabase/supabase-js';
import {useSystem} from '@/powersync/system';
import {router} from 'expo-router';
import {saveSetting, SETTINGS} from '@/utils/settingUtils';
import {Profile} from '@/powersync/AppSchema';
import {set} from 'lodash';

export type Theme = 'system' | 'dark' | 'light';

const iconMapping: Record<string, string> = {
  theme: 'theme-light-dark',
  changePassword: 'key',
  manageAccounts: 'account-group',
  activityLog: 'history',
  about: 'information-outline',
  help: 'help-circle-outline',
  terms: 'file-document-outline',
  logout: 'logout',
};

GoogleSignin.configure({
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/calendar.readonly', // scope Google Calendar
  ],
  webClientId: '34527809788-kc0d5s984psdkad7b3o8s4gf81htfpin.apps.googleusercontent.com', // your web client ID
});

export default function SettingsPage() {
  const {user} = useAuth();

  const {colors} = useTheme();

  let colorScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState<Theme>(
    colorScheme === null ? 'system' : (colorScheme as Theme),
  );
  const [visible, setVisible] = useState(false);

  const {supabaseConnector, powersync} = useSystem();

  const [isLoading, setIsLoading] = useState(true);

  const showModal = useCallback(() => setVisible(true), []);
  const hideModal = useCallback(() => setVisible(false), []);

  const [profile, setProfile] = useState<Profile | null | undefined>();

  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        const profile = await supabaseConnector.fetchProfile(user!.id);
        setProfile(profile);

        setIsLoading(false);
      } catch (error) {
        if (error instanceof AuthError) {
          Alert.alert('Error Fetching Profile', error.message);
        }
      }
    }

    fetchProfile();
  }, [supabaseConnector, user]);

  const handleThemeChange = useCallback(async (value: string) => {
    setIsLoading(true);
    setTheme(value as Theme);

    await saveSetting(SETTINGS.THEME, value);
    Appearance.setColorScheme(value === 'system' ? null : (value as ColorSchemeName));

    setIsLoading(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([await powersync.disconnect(), await supabaseConnector.logout()]);
      setIsLoading(false);
    } catch (error) {
      if (error instanceof AuthError) Alert.alert('Error Signing Out', error.message);
      if (error instanceof Error) Alert.alert('Error Signing Out', error.message);
    }
  }, [powersync, supabaseConnector]);

  const sections = [
    {
      title: 'Preferences',
      data: [{key: 'theme', title: 'Theme', type: 'modal'}],
    },
    {
      title: 'Account Settings',
      data: [
        {
          key: 'changePassword',
          title: 'Change Password',
          type: 'button',
          onPress: () => router.push('/change_password'),
        },
        {key: 'manageAccounts', title: 'Manage Connected Accounts', type: 'button'},
      ],
    },
    {
      title: 'Usage',
      data: [
        {
          key: 'activityLog',
          title: 'Activity Log',
          type: 'button',
          onPress: () => router.push('/activity_log'),
        },
      ],
    },
    {
      title: 'App Information',
      data: [
        {key: 'about', title: 'About', type: 'button', onPress: () => router.push('/about')},
        {key: 'help', title: 'Help & Support', type: 'button'},
        {key: 'terms', title: 'Terms of Service & Privacy Policy', type: 'button'},
      ],
    },
  ];

  const renderSectionHeader = ({section: {title}}: {section: {title: string}}) => (
    <List.Subheader>{title}</List.Subheader>
  );

  const renderItem = ({item, index, section}: {item: any; index: number; section: any}) => (
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
          onPress={() => item.onPress?.()}
        />
      )}
      {index < section.data.length - 1 && (
        <Divider style={[styles.divider, {backgroundColor: colors.primary}]} horizontalInset />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar style="auto" />
      <SectionList
        showsVerticalScrollIndicator={false}
        sections={sections}
        keyExtractor={item => item.key}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Card
              testID="profile-card"
              onPress={() =>
                router.push({
                  pathname: '/details',
                  params: {variable: JSON.stringify(profile)},
                })
              }>
              <Card.Title
                testID="profile-card-title"
                title={profile?.full_name}
                subtitle={user?.user_metadata.email}
                left={() => (
                  <Avatar.Image
                    testID="profile-image"
                    size={50}
                    source={{uri: profile?.avatar_url ?? ''}}
                  />
                )}
              />
            </Card>
          </View>
        )}
        renderSectionFooter={() => <View style={styles.footer} />}
        ListFooterComponent={() => (
          <View style={styles.logoutButtonContainer}>
            <Button
              mode="contained"
              buttonColor={colors.secondaryContainer}
              textColor={colors.secondary}
              onPress={handleLogout}
              icon={iconMapping['logout']}
              style={styles.logoutButton}>
              Logout
            </Button>
          </View>
        )}
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
      <Portal>
        <Modal
          visible={isLoading}
          contentContainerStyle={[
            styles.modalContainer,
            styles.loadingModalContainer,
            {backgroundColor: colors.background},
          ]}>
          <Text variant="titleMedium">Please wait...</Text>
          <ActivityIndicator />
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 20,
  },
  contentContainer: {
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
  loadingModalContainer: {
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  logoutButton: {
    width: '100%',
    borderRadius: 10,
  },
});
