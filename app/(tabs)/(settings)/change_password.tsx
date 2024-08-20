import React, {useState, useCallback, useEffect} from 'react';
import {View, StyleSheet, Alert, BackHandler} from 'react-native';
import {Button, TextInput, Text, useTheme, Appbar, HelperText} from 'react-native-paper';
import {router} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {useSystem} from '@/powersync/system';
import {useAuth} from '@/hooks/useAuth';

const ChangePasswordPage = () => {
  const {supabaseConnector} = useSystem(); // Adjust according to your setup
  const {colors} = useTheme();

  const {user} = useAuth();

  const isEmailProvider = user?.app_metadata.providers.includes('email') || false;

  console.log(user?.app_metadata.providers);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [isLengthValid, setIsLengthValid] = React.useState(false);
  const [hasUppercase, setHasUppercase] = React.useState(false);
  const [hasLowercase, setHasLowercase] = React.useState(false);
  const [hasNumber, setHasNumber] = React.useState(false);
  const [hasSpecialChar, setHasSpecialChar] = React.useState(false);

  const [isPasswordMatch, setIsPasswordMatch] = React.useState(false);

  const [isPasswordHidden, setIsPasswordHidden] = React.useState(true);
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = React.useState(true);

  useEffect(() => {
    const backAction = () => {
      router.back();
      return true; // Indicate that we've handled the back press
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  const validatePasswordMatch = useCallback(() => {
    setIsPasswordMatch(newPassword === confirmPassword);
  }, [newPassword, confirmPassword]);

  const validatePassword = (password: string) => {
    setIsLengthValid(password.length >= 8);
    setHasUppercase(/[A-Z]/.test(password));
    setHasLowercase(/[a-z]/.test(password));
    setHasNumber(/\d/.test(password));
    setHasSpecialChar(/[@$!%*?&]/.test(password));
  };

  const getHelperTextStyle = (isValid: boolean) => ({
    color: isValid ? 'lightgreen' : colors.error,
  });

  const isFormValid = () => {
    return (
      isLengthValid &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecialChar &&
      newPassword === confirmPassword
    );
  };

  const handleChangePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      // Call Supabase function to change password
      await supabaseConnector.changePassword(currentPassword, newPassword);

      Alert.alert('Success', 'Password changed successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword, supabaseConnector]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar style="auto" />
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Change Password" />
      </Appbar.Header>
      <StatusBar style="auto" />

      <View style={styles.contentContainer}>
        {!isEmailProvider && <Text>Only email providers can change password</Text>}
        <TextInput
          mode="outlined"
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          style={styles.input}
          autoFocus
          disabled={!isEmailProvider}
        />
        <TextInput
          mode="outlined"
          label="New Password"
          value={newPassword}
          onChangeText={text => {
            setNewPassword(text);
            validatePassword(text);
          }}
          secureTextEntry={isPasswordHidden}
          style={styles.input}
          error={
            newPassword.length > 0 &&
            (!isLengthValid || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar)
          }
          disabled={!isEmailProvider}
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
          mode="outlined"
          label="Confirm Password"
          error={!!isPasswordMatch}
          secureTextEntry={isConfirmPasswordHidden}
          onChangeText={text => {
            setConfirmPassword(text);
            validatePasswordMatch();
          }}
          value={confirmPassword}
          style={styles.input}
          disabled={!isEmailProvider}
          right={
            <TextInput.Icon
              icon={isConfirmPasswordHidden ? 'eye' : 'eye-off'}
              onPress={() => setIsConfirmPasswordHidden(prev => !prev)}
            />
          }
        />
        <HelperText type="error" visible={!!isPasswordMatch}>
          Passwords Must match
        </HelperText>
        <Button
          mode="contained"
          onPress={handleChangePassword}
          loading={loading}
          style={styles.button}
          disabled={!isFormValid() || !isEmailProvider}>
          Change Password
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default ChangePasswordPage;
