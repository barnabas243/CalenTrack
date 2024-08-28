import AlertSnackbar from '@/components/AlertSnackbar';
import {useSystem} from '@/powersync/system';
import {AuthError} from '@supabase/supabase-js';
import {router} from 'expo-router';
import React, {useEffect} from 'react';
import {View, StyleSheet, BackHandler, Keyboard} from 'react-native';
import {Appbar, Button, HelperText, Text, TextInput, useTheme} from 'react-native-paper';

export default function Register() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [confirmPasswordError, setConfirmPasswordError] = React.useState('');

  const [isLengthValid, setIsLengthValid] = React.useState(false);
  const [hasUppercase, setHasUppercase] = React.useState(false);
  const [hasLowercase, setHasLowercase] = React.useState(false);
  const [hasNumber, setHasNumber] = React.useState(false);
  const [hasSpecialChar, setHasSpecialChar] = React.useState(false);

  const [isSnackbarVisible, setIsSnackbarVisible] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const emailRef = React.useRef(null);
  const passwordRef = React.useRef(null);
  const confirmPasswordRef = React.useRef(null);

  const {supabaseConnector} = useSystem();
  const {colors} = useTheme();

  const [isPasswordHidden, setIsPasswordHidden] = React.useState(true);
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = React.useState(true);

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
   * Validates the password field for length, uppercase, lowercase, number and special character
   * @param password - The password to validate
   * @returns {void} - Sets the password validation states
   */
  const validatePassword = (password: string): void => {
    setIsLengthValid(password.length >= 8);
    setHasUppercase(/[A-Z]/.test(password));
    setHasLowercase(/[a-z]/.test(password));
    setHasNumber(/\d/.test(password));
    setHasSpecialChar(/[@$!%*?&]/.test(password));
  };

  const validateEmail = (email: string) => {
    setEmailError('');
    if (!email) {
      setEmailError('Email is required.');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address.');
    }
  };

  /**
   * Validates the confirm password field
   * @param confirmPassword checks if the password and confirm password match
   * @returns {void} - Sets the confirm password error
   */
  const validateConfirmPassword = (confirmPassword: string): void => {
    setConfirmPasswordError('');
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
    }
  };

  /**
   * submits the registration form
   * @returns {void} - Registers the user
   */
  const handleRegistration = async (): Promise<void> => {
    Keyboard.dismiss();

    let isValid = true;
    setEmailError('');
    setConfirmPasswordError('');

    if (!email) {
      setEmailError('Email is required.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      isValid = false;
    } else if (!isLengthValid || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    if (!isValid) return;

    await supabaseConnector
      .register(email, password, confirmPassword)
      .then(() => {
        setIsSnackbarVisible(true);
        setMessage('Registration successful!');
      })
      .catch((error: AuthError) => {
        setIsSnackbarVisible(true);
        setMessage(error.message);
      });
  };

  /**
   * Returns the style for the helper text
   * @param isValid
   * @returns green color if isValid is true, red color if isValid is false
   */
  const getHelperTextStyle = (isValid: boolean) => ({
    color: isValid ? 'lightgreen' : colors.error,
  });

  /**
   * checks if the form is valid
   * @returns {boolean} - Returns true if the form is valid
   */
  const isFormValid = (): boolean => {
    return (
      !!email && // Ensures email is a non-empty string
      isLengthValid &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecialChar &&
      password === confirmPassword
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
      </Appbar.Header>
      <View style={styles.headerContainer}>
        <Text variant="titleLarge">Create Your Account</Text>
        <Text variant="bodyMedium">Fill in the details below to sign up</Text>
      </View>
      <View style={styles.formContainer}>
        <TextInput
          ref={emailRef}
          testID="email-input"
          mode="outlined"
          label="Email"
          error={!!emailError}
          onChangeText={text => {
            setEmail(text);
            validateEmail(text);
          }}
          value={email}
          placeholder="example@gmail.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={styles.input}
          returnKeyType="next"
          onSubmitEditing={() => {
            if (passwordRef.current) passwordRef.current.focus();
          }}
          blurOnSubmit={false}
          autoFocus
        />
        {!!emailError && (
          <HelperText type="error" style={getHelperTextStyle(!emailError)} visible={!!emailError}>
            {emailError}
          </HelperText>
        )}
        <TextInput
          ref={passwordRef}
          mode="outlined"
          label="Password"
          error={
            password.length > 0 &&
            (!isLengthValid || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar)
          }
          secureTextEntry={isPasswordHidden}
          onChangeText={text => {
            setPassword(text);
            validatePassword(text);
          }}
          value={password}
          style={styles.input}
          returnKeyType="next"
          onSubmitEditing={() => {
            if (confirmPasswordRef.current) confirmPasswordRef.current.focus();
          }}
          right={
            <TextInput.Icon
              icon={isPasswordHidden ? 'eye' : 'eye-off'}
              onPress={() => setIsPasswordHidden(prev => !prev)}
            />
          }
          blurOnSubmit={false}
        />
        {password.length > 0 &&
          (!isLengthValid || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) && (
            <>
              <HelperText type="error" style={getHelperTextStyle(isLengthValid)} visible={true}>
                Password must be at least 8 characters
              </HelperText>
              <HelperText type="error" style={getHelperTextStyle(hasUppercase)} visible={true}>
                Must include at least one uppercase letter
              </HelperText>
              <HelperText type="error" style={getHelperTextStyle(hasLowercase)} visible={true}>
                Must include at least one lowercase letter
              </HelperText>
              <HelperText type="error" style={getHelperTextStyle(hasNumber)} visible={true}>
                Must include at least one number
              </HelperText>
              <HelperText type="error" style={getHelperTextStyle(hasSpecialChar)} visible={true}>
                Must include at least one special character
              </HelperText>
            </>
          )}
        <TextInput
          ref={confirmPasswordRef}
          mode="outlined"
          label="Confirm Password"
          error={!!confirmPasswordError}
          secureTextEntry={isConfirmPasswordHidden}
          onChangeText={text => {
            setConfirmPassword(text);
            validateConfirmPassword(text);
          }}
          value={confirmPassword}
          style={styles.input}
          onSubmitEditing={() => {
            handleRegistration();
          }}
          right={
            <TextInput.Icon
              icon={isConfirmPasswordHidden ? 'eye' : 'eye-off'}
              onPress={() => setIsConfirmPasswordHidden(prev => !prev)}
            />
          }
        />
        <HelperText type="error" visible={!!confirmPasswordError}>
          {confirmPasswordError}
        </HelperText>
        <Button
          mode="contained"
          onPress={handleRegistration}
          style={styles.button}
          disabled={!isFormValid()}>
          Register
        </Button>
      </View>
      <AlertSnackbar visible={isSnackbarVisible} message={message} onDismiss={closeSnackbar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  headerContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
  },
});
