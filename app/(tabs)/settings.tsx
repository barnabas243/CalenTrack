import {Stack} from 'expo-router';
import {SafeAreaView, Text, TouchableOpacity, StyleSheet, Alert, ScrollView} from 'react-native';
import {supabase} from '@/utils/supabase';
import {useUser} from '@/contexts/UserContext';

export default function SettingsPage() {
  const {user} = useUser();

  const doLogout = async () => {
    const {error} = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error Signing Out User', error.message);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <Stack screenOptions={{headerShown: true, title: 'Settings'}} />
      <ScrollView style={{padding: 16}}>
        <Text>{JSON.stringify(user, null, 2)}</Text>
        <TouchableOpacity onPress={doLogout} style={styles.buttonContainer}>
          <Text style={styles.buttonText}>LOGOUT</Text>
        </TouchableOpacity>
      </ScrollView>
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
  buttonContainer: {
    backgroundColor: '#000968',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    margin: 8,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    alignSelf: 'center',
    textTransform: 'uppercase',
  },
  textInput: {
    borderColor: '#000968',
    borderRadius: 4,
    borderStyle: 'solid',
    borderWidth: 1,
    padding: 12,
    margin: 8,
  },
});
