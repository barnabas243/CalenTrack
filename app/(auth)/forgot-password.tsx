import {useSystem} from '@/powersync/system';
import {isValidEmail} from '@/utils/validationUtils';
import {router} from 'expo-router';
import React, {useRef, useState, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {Appbar, Button, HelperText, TextInput, useTheme, Text} from 'react-native-paper';

export default function ForgetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const {supabaseConnector} = useSystem();
  const {colors} = useTheme();

  const emailRef = useRef(null);

  const sendResetEmail = async () => {
    if (!email || !isValidEmail(email)) {
      return;
    }
    setIsLoading(true);
    const {data, error} = await supabaseConnector.client.auth.resetPasswordForEmail(email, {
      redirectTo: 'myapp://recover', // The URL to redirect to after the user clicks the link in the email
    });

    if (!error) {
      setCooldown(60); // Set the cooldown period (e.g., 60 seconds)
      setResetSent(true);
    }

    console.log('Reset email sent:', data, error);
    setIsLoading(false);
  };

  // Timer for cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (cooldown > 0) {
      timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
    } else if (cooldown === 0 && resetSent) {
      setResetSent(false);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [cooldown, resetSent]);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
      </Appbar.Header>
      <View style={styles.headerContainer}>
        <Text variant="titleLarge">Forgot Password</Text>
        <Text variant="bodyMedium">Enter your email to receive a password reset link</Text>
      </View>
      <View style={styles.formContainer}>
        <TextInput
          ref={emailRef}
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="done"
          blurOnSubmit={true}
          error={!isValidEmail(email) && email.length > 0}
          onSubmitEditing={sendResetEmail}
          disabled={resetSent} // Disable input while in cooldown
        />
        <HelperText type="error" visible={!isValidEmail(email) && email.length > 0}>
          Invalid email address
        </HelperText>
        <HelperText type="info" visible={resetSent}>
          A reset link has been sent. You can request another in {cooldown} seconds.
        </HelperText>

        <Button
          mode="contained"
          onPress={sendResetEmail}
          loading={isLoading}
          disabled={!isValidEmail(email) || isLoading || resetSent}>
          Send Reset Email
        </Button>
      </View>
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
  formContainer: {
    flex: 1,
    padding: 16,
  },
});
