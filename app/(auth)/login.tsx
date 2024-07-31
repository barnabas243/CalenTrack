import 'react-native-url-polyfill/auto';

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {supabase} from '@/utils/supabase';

import React, {useState} from 'react';
import {Alert, StyleSheet, View, AppState} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {Button, TextInput} from 'react-native-paper';
import {useUser} from '@/contexts/UserContext';

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', state => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
export default function LoginScreen() {
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    webClientId: '34527809788-kc0d5s984psdkad7b3o8s4gf81htfpin.apps.googleusercontent.com',
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const {setSession} = useUser();
  async function signInWithEmail() {
    setLoading(true);
    const {data, error} = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setLoading(false);
    if (error) {
      Alert.alert(error.message);
      return;
    }

    console.log('successfully signed in with email');
    setSession(data.session);
    router.replace('/(tabs)');
  }

  // async function signUpWithEmail() {
  //   setLoading(true);
  //   const {
  //     data: {session},
  //     error,
  //   } = await supabase.auth.signUp({
  //     email: email,
  //     password: password,
  //   });

  //   if (error) Alert.alert(error.message);
  //   if (!session) Alert.alert('Please check your inbox for email verification!');
  //   setLoading(false);
  // }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={async () => {
            try {
              console.log('signing in with google');
              await GoogleSignin.hasPlayServices();
              const userInfo = await GoogleSignin.signIn();

              if (userInfo.idToken) {
                const {data, error} = await supabase.auth.signInWithIdToken({
                  provider: 'google',
                  token: userInfo.idToken,
                });

                if (error) throw error;

                setSession(data.session);
                router.replace('/(tabs)');
              } else {
                throw new Error('no ID token present!');
              }
            } catch (error: any) {
              if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
                console.log('user cancelled the login flow');
              } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
                console.log('operation (e.g. sign in) is in progress already');
              } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
                console.log('play services not available or outdated');
              } else {
                // some other error happened
                console.log('some other error happened', error.message);
              }
            }
          }}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TextInput
          mode="outlined"
          label="Email"
          onChangeText={text => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize={'none'}
          keyboardType={'email-address'}
          autoComplete="email"
          tabIndex={0}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <TextInput
          mode="outlined"
          label="Password"
          onChangeText={text => setPassword(text)}
          value={password}
          secureTextEntry={true}
          autoCapitalize={'none'}
          autoComplete="password"
          tabIndex={0}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button disabled={loading} onPress={signInWithEmail}>
          Sign in
        </Button>
      </View>
      {/* <View style={styles.verticallySpaced}>
        <Button disabled={loading} onPress={signUpWithEmail}>
          Sign up
        </Button>
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
});
