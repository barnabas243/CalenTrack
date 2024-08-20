import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Alert, BackHandler} from 'react-native';
import {Button, TextInput, useTheme, Appbar} from 'react-native-paper';
import {useAuth} from '@/hooks/useAuth'; // Adjust the import according to your structure
import {useSystem} from '@/powersync/system'; // Adjust the import according to your structure'
import Avatar from '@/components/Avatar';
import {router} from 'expo-router';

const UserDetailsPage = () => {
  const {user} = useAuth(); // Fetch current user data
  const {supabaseConnector} = useSystem(); // Supabase connector for updating user data
  const {colors} = useTheme();

  const [fullName, setFullName] = useState(user?.user_metadata.full_name || '');
  const [email, setEmail] = useState(user?.user_metadata.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata.avatar_url || '');
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
      //   async updateProfile(id: string, username: string, fullName: string, avatarUrl: string) {
      const updates = {
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
      };

      await supabaseConnector.updateProfile(updates);
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
              handleSave();
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
