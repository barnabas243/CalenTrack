import React from 'react';
import {View, StyleSheet, Alert, Dimensions} from 'react-native';
import {useRouter} from 'expo-router';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {useSystem} from '@/powersync/system';
import {AuthError} from '@supabase/supabase-js';
import {Menu, Button, Text, useTheme} from 'react-native-paper';
import {Image} from 'expo-image';
import {SafeAreaView} from 'react-native-safe-area-context';

const imageSource = require('@/assets/images/icon.svg');

const {width, height} = Dimensions.get('window');

export default function Index() {
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    webClientId: '34527809788-kc0d5s984psdkad7b3o8s4gf81htfpin.apps.googleusercontent.com',
  });

  const router = useRouter();
  const {supabaseConnector} = useSystem();
  const {colors} = useTheme();

  const [isMenuVisible, setIsMenuVisible] = React.useState(false);
  const showMenu = () => setIsMenuVisible(true);
  const closeMenu = () => setIsMenuVisible(false);

  const handleMenuPress = (option: 'login' | 'register') => {
    closeMenu();
    router.push(option);
  };

  async function signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.idToken) {
        await supabaseConnector.loginWithGoogle(userInfo.idToken).catch((error: AuthError) => {
          Alert.alert('Sign in failed', error.message);
        });
      } else {
        throw new Error('No ID token present!');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Operation (e.g. sign in) is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated');
      } else {
        console.log('Some other error happened', error.message);
      }
    }
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <Image source={imageSource} contentFit="cover" style={styles.image} />

      <Text variant="bodyMedium" style={styles.description}>
        Your ultimate tool for organizing tasks and boosting productivity. Start managing your tasks
        effortlessly and stay on top of your goals.
      </Text>
      <View style={styles.buttonContainer}>
        <GoogleSigninButton
          testID="google-sign-in-button"
          size={GoogleSigninButton.Size.Standard}
          color={GoogleSigninButton.Color.Light}
          onPress={signInWithGoogle}
        />
        <Menu
          anchorPosition="bottom"
          visible={isMenuVisible}
          onDismiss={closeMenu}
          anchor={
            <Button icon={'email'} mode="elevated" onPress={showMenu} style={styles.continueButton}>
              Continue with Email
            </Button>
          }>
          <Menu.Item onPress={() => handleMenuPress('login')} title="Login" />
          <Menu.Item onPress={() => handleMenuPress('register')} title="Register" />
        </Menu>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    marginVertical: 30, // Increased margin for more space below the image
  },
  heading: {
    marginBottom: 16, // Increased margin for more space below the heading
  },
  description: {
    marginBottom: 24, // Increased margin for more space below the description
    textAlign: 'center', // Center-align the text
    paddingHorizontal: 20, // Add horizontal padding for better text readability
  },
  buttonContainer: {
    marginBottom: 30, // Increased margin for more space below the Google Sign-In button
  },
  continueButton: {
    marginTop: 20, // Margin above the "Continue with Email" button
  },
});
