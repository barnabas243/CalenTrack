import AlertSnackbar from '@/components/AlertSnackbar';
import {useSystem} from '@/powersync/system';
import {AuthError} from '@supabase/supabase-js';
import {router} from 'expo-router';
import React, {useEffect} from 'react';
import {View, StyleSheet, Keyboard} from 'react-native';
import {Appbar, Button, HelperText, Text, TextInput, useTheme} from 'react-native-paper';

export default function RecoverScreen() {
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [isLengthValid, setIsLengthValid] = React.useState(false);
  const [hasUppercase, setHasUppercase] = React.useState(false);
  const [hasLowercase, setHasLowercase] = React.useState(false);
  const [hasNumber, setHasNumber] = React.useState(false);
  const [hasSpecialChar, setHasSpecialChar] = React.useState(false);

  const [isPasswordHidden, setIsPasswordHidden] = React.useState(true);
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = React.useState(true);

  const {supabaseConnector} = useSystem();
  const {colors} = useTheme();

  const validatePassword = (password: string) => {
    setIsLengthValid(password.length >= 8);
    setHasUppercase(/[A-Z]/.test(password));
    setHasLowercase(/[a-z]/.test(password));
    setHasNumber(/\d/.test(password));
    setHasSpecialChar(/[@$!%*?&]/.test(password));
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
    } else {
      setError('');
    }
  };

  const handlePasswordReset = async () => {
    Keyboard.dismiss();
    setIsLoading(true);

    let isValid = true;

    if (!isLengthValid || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      isValid = false;
      setError('Password does not meet the required criteria.');
    } else if (newPassword !== confirmPassword) {
      isValid = false;
      setError('Passwords do not match.');
    } else {
      setError('');
    }

    if (!isValid) {
      setIsLoading(false);
      return;
    }

    // Get the token from the URL
    // const urlParams = new URLSearchParams(window.location.search);
    // const accessToken = urlParams.get('access_token');

    // if (!accessToken) {
    //   setError('Invalid or expired reset link.');
    //   setIsLoading(false);
    //   return;
    // }

    try {
      const {data, error} = await supabaseConnector.client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (error) {
      setError('An error occurred while resetting the password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
      </Appbar.Header>
      <View style={styles.headerContainer}>
        <Text variant="titleLarge">Reset Password</Text>
        <Text variant="bodyMedium">Enter your new password below.</Text>
      </View>
      <View style={styles.formContainer}>
        <TextInput
          mode="outlined"
          label="New Password"
          error={
            newPassword.length > 0 &&
            (!isLengthValid || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar)
          }
          secureTextEntry={isPasswordHidden}
          onChangeText={text => {
            setNewPassword(text);
            validatePassword(text);
          }}
          value={newPassword}
          style={styles.input}
          right={
            <TextInput.Icon
              icon={isPasswordHidden ? 'eye' : 'eye-off'}
              onPress={() => setIsPasswordHidden(prev => !prev)}
            />
          }
        />
        {newPassword.length > 0 &&
          (!isLengthValid || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) && (
            <>
              <HelperText type="error" visible={!isLengthValid}>
                Password must be at least 8 characters
              </HelperText>
              <HelperText type="error" visible={!hasUppercase}>
                Must include at least one uppercase letter
              </HelperText>
              <HelperText type="error" visible={!hasLowercase}>
                Must include at least one lowercase letter
              </HelperText>
              <HelperText type="error" visible={!hasNumber}>
                Must include at least one number
              </HelperText>
              <HelperText type="error" visible={!hasSpecialChar}>
                Must include at least one special character
              </HelperText>
            </>
          )}
        <TextInput
          mode="outlined"
          label="Confirm Password"
          error={!!error}
          secureTextEntry={isConfirmPasswordHidden}
          onChangeText={text => {
            setConfirmPassword(text);
            validateConfirmPassword(text);
          }}
          value={confirmPassword}
          style={styles.input}
          right={
            <TextInput.Icon
              icon={isConfirmPasswordHidden ? 'eye' : 'eye-off'}
              onPress={() => setIsConfirmPasswordHidden(prev => !prev)}
            />
          }
        />
        {error ? <HelperText type="error">{error}</HelperText> : null}
        {success ? <HelperText type="info">Password reset successfully!</HelperText> : null}
        <Button
          mode="contained"
          onPress={handlePasswordReset}
          style={styles.button}
          loading={isLoading}
          disabled={isLoading}>
          Reset Password
        </Button>
      </View>
      <AlertSnackbar visible={!!error} message={error} onDismiss={() => setError('')} />
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
  formContainer: {
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
  },
});
