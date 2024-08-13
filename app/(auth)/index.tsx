import 'react-native-url-polyfill/auto';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {supabase} from '@/utils/supabase';
import React, {useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {Button, Text, TextInput, useTheme} from 'react-native-paper';
import {useAuth} from '@/hooks/useAuth';
import PageLoadingActivityIndicator from '@/components/PageLoadingActivityIndicator';

// Configure Google Sign-In outside the component
GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  webClientId: '34527809788-kc0d5s984psdkad7b3o8s4gf81htfpin.apps.googleusercontent.com',
});

export default function LoginScreen() {
  const {colors} = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {setSession, isLoading} = useAuth();

  console.log('LoginScreen rendered');
  console.log(isLoading);

  // // Use useCallback to memoize signInSilently
  // const signInSilently = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     const userInfo = await GoogleSignin.signInSilently();
  //     if (userInfo.idToken) {
  //       const {data, error} = await supabase.auth.signInWithIdToken({
  //         provider: 'google',
  //         token: userInfo.idToken,
  //       });

  //       if (error) throw error;

  //       setSession(data.session);
  //       router.replace('/(tabs)');
  //     } else {
  //       throw new Error('No ID token present!');
  //     }
  //   } catch (error: any) {
  //     if (error.code === statusCodes.SIGN_IN_REQUIRED) {
  //       // User is not signed in, allow normal sign-in flow
  //     } else {
  //       console.log('Silent sign-in failed', error.message);
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [setSession]);

  // useEffect(() => {
  //   signInSilently();
  // }, [signInSilently]);

  async function signInWithEmail() {
    const {data, error} = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert(error.message);
      return;
    }

    console.log('Successfully signed in with email');
    setSession(data.session);
    router.replace('/(tabs)');
  }

  if (isLoading) {
    return <PageLoadingActivityIndicator />;
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.header}>
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Standard}
          color={GoogleSigninButton.Color.Light}
          onPress={async () => {
            try {
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
          }}
        />
      </View>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>
      <View style={styles.formContainer}>
        <TextInput
          mode="outlined"
          label="Email"
          onChangeText={text => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Password"
          onChangeText={text => setPassword(text)}
          value={password}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          style={styles.input}
        />
        <Button
          mode="contained"
          disabled={isLoading}
          onPress={signInWithEmail}
          style={styles.button}>
          Sign in
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
  },
  formContainer: {
    alignItems: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
    width: '100%',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    paddingHorizontal: 10,
    color: '#aaa',
  },
});
