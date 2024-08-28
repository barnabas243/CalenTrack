import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Alert, BackHandler} from 'react-native';
import {Button, TextInput, useTheme, Appbar} from 'react-native-paper';
import {useAuth} from '@/hooks/useAuth'; // Adjust the import according to your structure
import {useSystem} from '@/powersync/system'; // Adjust the import according to your structure'
import Avatar from '@/components/Avatar';
import {router, useLocalSearchParams} from 'expo-router';

const UserDetailsPage = () => {
  const {user} = useAuth(); // Fetch current user data
  const {supabaseConnector} = useSystem(); // Supabase connector for updating user data
  const {colors} = useTheme();
  const {variable} = useLocalSearchParams(); // Retrieve the route parameters

  const profile = JSON.parse(Array.isArray(variable) ? variable[0] : variable); // Parse the profile data from the route parameters

  const [fullName, setFullName] = useState(profile.full_name || '');
  const [email, setEmail] = useState(user?.user_metadata.email || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const backAction = () => {
      router.back();
      return true; // Indicate that we've handled the back press
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  async function handleSave() {
    try {
      setLoading(true);
      if (!user) throw new Error('No user on the session!');

      // Define the updates for the profile
      const updates = {
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
      };

      // Run updateEmail and updateProfile concurrently
      await Promise.all([
        supabaseConnector.updateEmail(email),
        supabaseConnector.updateProfile(updates),
      ]).then(([emailResult, profileResult]) => {
        console.log('Email update result:', emailResult);
        console.log('Profile update result:', profileResult);
        Alert.alert('Profile and email updated successfully');

        router.replace('/(settings)');
      });
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Details" />
      </Appbar.Header>
      <View style={styles.contentContainer}>
        <View style={styles.avatarContainer}>
          <Avatar
            size={200}
            url={avatarUrl}
            onUpload={(url: string) => {
              setAvatarUrl(url);
              console.log('Avatar uploaded:', url);
              // handleSave();
            }}
          />
        </View>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextInput
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
        />

        <Button mode="contained" onPress={handleSave} style={styles.button} disabled={loading}>
          Save
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
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

export default UserDetailsPage;
