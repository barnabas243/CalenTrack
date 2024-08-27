import React, {useEffect, useState} from 'react';
import {BackHandler, StyleSheet, View} from 'react-native';
import {Appbar, Button, HelperText, Text, TextInput, useTheme} from 'react-native-paper';
import {useSystem} from '@/powersync/system';
import {AuthError} from '@supabase/supabase-js';
import AlertSnackbar from '@/components/AlertSnackbar';
import {router} from 'expo-router';
import {isValidEmail} from '@/utils/validationUtils';

export default function LoginScreen() {
  const {colors} = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const [message, setMessage] = useState('');

  const emailRef = React.useRef(null);
  const passwordRef = React.useRef(null);

  const [isPasswordHidden, setIsPasswordHidden] = React.useState(true);

  const {supabaseConnector} = useSystem();

  const closeSnackbar = () => setIsSnackbarVisible(false);

  useEffect(() => {
    const backAction = () => {
      router.back();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  /**
   * Signs in the user with email and password
   * @returns {void} - Signs in the user with email and password
   */
  async function signInWithPassword(): Promise<void> {
    setIsLoading(true);
    if (!email || !password || !isValidEmail(email)) {
      setIsSnackbarVisible(true);
      setMessage('Could not sign in. Please check your email and password.');
      setIsLoading(false);
      return;
    }

    await supabaseConnector
      .login(email, password)
      .then(() => {
        setIsSnackbarVisible(true);
        setMessage('Signed in successfully!');
      })
      .catch((error: AuthError) => {
        setIsSnackbarVisible(true);
        setMessage(error.message);
      });

    setIsLoading(false);
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
      </Appbar.Header>
      <View style={styles.headerContainer}>
        <Text variant="titleLarge">Sign in</Text>
        <Text variant="bodyMedium">Enter your email and password to sign in</Text>
      </View>
      <View style={styles.formContainer}>
        <TextInput
          ref={emailRef}
          testID="email-input"
          mode="outlined"
          label="Email"
          onChangeText={text => setEmail(text)}
          value={email}
          placeholder="example@gmail.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => {
            if (passwordRef.current) passwordRef.current.focus();
          }}
          style={styles.input}
          error={email.length > 0 && !isValidEmail(email)} // Display error if the email is invalid
          blurOnSubmit={false}
        />
        <HelperText
          type="error"
          visible={email.length > 0 && !isValidEmail(email)} // Show helper text only if email is invalid
        >
          Please enter a valid email address.
        </HelperText>

        <TextInput
          ref={passwordRef}
          testID="password-input"
          mode="outlined"
          label="Password"
          onChangeText={text => setPassword(text)}
          value={password}
          secureTextEntry={isPasswordHidden}
          autoCapitalize="none"
          autoComplete="password"
          style={styles.input}
          returnKeyType="go"
          onSubmitEditing={signInWithPassword}
          right={
            <TextInput.Icon
              icon={isPasswordHidden ? 'eye' : 'eye-off'}
              onPress={() => setIsPasswordHidden(prev => !prev)}
            />
          }
          blurOnSubmit={false}
        />
        <Button
          loading={isLoading}
          testID="sign-in-button"
          mode="contained"
          disabled={isLoading}
          onPress={signInWithPassword}
          style={styles.button}>
          Sign in
        </Button>
        <Text
          variant="bodyMedium"
          style={{
            marginTop: 20,
            textDecorationLine: 'underline',
            color: colors.onSurfaceVariant,
            alignSelf: 'center',
          }}
          onPress={() => {
            router.push('/forgot-password');
          }}>
          Forgot password?
        </Text>
      </View>
      <AlertSnackbar visible={isSnackbarVisible} message={message} onDismiss={closeSnackbar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 20,
    alignItems: 'flex-start',
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
  },
  button: {
    marginTop: 20,
    width: '100%',
  },
});
