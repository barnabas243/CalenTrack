import React from 'react';
import {View, StyleSheet, ScrollView, Dimensions} from 'react-native';
import {useRouter} from 'expo-router';
import {GoogleSignin, statusCodes} from '@react-native-google-signin/google-signin';
import {useSystem} from '@/powersync/system';
import {AuthError} from '@supabase/supabase-js';
import {Menu, Button, Text, useTheme} from 'react-native-paper';
import {Image} from 'expo-image';
import {SafeAreaView} from 'react-native-safe-area-context';
import AlertSnackbar from '@/components/AlertSnackbar';

const iconSource = require('@/assets/images/icon-left-text.svg');
const checklistSource = require('@/assets/images/plan-list.svg');

const {width} = Dimensions.get('window');

GoogleSignin.configure({
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly', // existing scope
    'https://www.googleapis.com/auth/calendar.readonly', // new scope for Google Calendar
  ],
  webClientId: '34527809788-kc0d5s984psdkad7b3o8s4gf81htfpin.apps.googleusercontent.com', // your web client ID
});

export default function Index() {
  const router = useRouter();
  const {supabaseConnector} = useSystem();
  const {colors} = useTheme();

  const [isMenuVisible, setIsMenuVisible] = React.useState(false);
  const showMenu = () => setIsMenuVisible(true);
  const closeMenu = () => setIsMenuVisible(false);

  const [isSnackbarVisible, setIsSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setIsSnackbarVisible(true);
  };

  const closeSnackbar = () => {
    setSnackbarMessage('');
    setIsSnackbarVisible(false);
  };

  /**
   * Handles the selection of a menu option, closes the menu, and navigates to the appropriate screen.
   *
   * @param {('login' | 'register')} option - The selected menu option, which determines the navigation target.
   *   - `'login'`: Navigates to the login screen.
   *   - `'register'`: Navigates to the registration screen.
   *
   * This function first closes the menu and then uses the router to navigate to the screen corresponding
   * to the selected menu option.
   */
  const handleMenuPress = (option: 'login' | 'register') => {
    closeMenu();
    router.push({pathname: `/${option}`});
  };

  /**
   * Initiates the Google sign-in process and authenticates the user with Supabase.
   *
   * This function checks for Google Play services, prompts the user to sign in with their Google account,
   * and then attempts to authenticate the user with Supabase using the obtained ID token.
   *
   * @returns {Promise<void>} - A promise that resolves when the sign-in process is complete.
   *
   * @throws {Error} - Throws an error if the Google sign-in process fails due to:
   *   - Missing ID token: If the sign-in process completes without retrieving an ID token.
   *   - Sign-in cancellation: If the user cancels the sign-in process.
   *   - In-progress operation: If another sign-in operation is already in progress.
   *   - Play services not available: If Google Play services are unavailable or outdated.
   *   - Any other errors encountered during the sign-in or authentication process.
   *
   * The function also handles different error scenarios by logging messages and showing a snackbar notification
   * to inform the user of the specific issue encountered.
   */
  async function signInWithGoogle(): Promise<void> {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.idToken) {
        await supabaseConnector.loginWithGoogle(userInfo.idToken).catch((error: AuthError) => {
          showSnackbar(error.message);
        });
      } else {
        throw new Error('No ID token present!');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
        showSnackbar('You have cancelled the google login');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Operation (e.g. sign in) is in progress already');
        showSnackbar('Operation (e.g. sign in) is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated');
        showSnackbar('Play services not available or outdated');
      } else {
        console.log('Some other error happened', error.message);
        showSnackbar('Some other error happened: ' + error);
      }
    }
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView style={styles.container}>
        <View style={styles.contentContainer}>
          <Image testID="welcome-logo-image" source={iconSource} style={styles.logo} />
          <Image testID="welcome-logo-image" source={checklistSource} style={styles.image} />
          <Text testID="welcome-description" variant="headlineSmall" style={styles.description}>
            Effortlessly organize and manage all your events
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            icon="google"
            mode="outlined"
            onPress={signInWithGoogle}
            style={styles.continueButton}>
            Continue with Google
          </Button>
          <Menu
            anchorPosition="bottom"
            visible={isMenuVisible}
            onDismiss={closeMenu}
            anchor={
              <Button icon="email" mode="outlined" onPress={showMenu} style={styles.continueButton}>
                Continue with Email
              </Button>
            }>
            <Menu.Item onPress={() => handleMenuPress('login')} title="Login" />
            <Menu.Item onPress={() => handleMenuPress('register')} title="Register" />
          </Menu>
        </View>
        <View style={styles.footerContainer}>
          <Text testID="welcome-footer" variant="bodySmall" style={styles.description}>
            By continuing, you agree to CalenTrack's{' '}
            <Text style={{textDecorationLine: 'underline'}}>Terms of Service</Text> and{' '}
            <Text style={{textDecorationLine: 'underline'}}>Privacy Policy</Text>
          </Text>
        </View>
        <AlertSnackbar
          visible={isSnackbarVisible}
          message={snackbarMessage}
          onDismiss={closeSnackbar}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    width: width * 0.6,
    height: 80,
    marginBottom: 20,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: 300,
    height: 300,
  },
  heading: {
    marginBottom: 16, // Increased margin for more space below the heading
  },
  description: {
    textAlign: 'center', // Center-align the text
    paddingHorizontal: 20, // Add horizontal padding for better text readability
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 10, // Increased margin for more space below the Google Sign-In button
    gap: 2, // Add gap between the buttons
  },
  continueButton: {
    marginTop: 10, // Margin above the "Continue with Email" button
    borderRadius: 1,
    marginHorizontal: 5, // Add horizontal padding for better button readability
    width: width * 0.9,
  },
});
