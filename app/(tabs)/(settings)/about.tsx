import {openBrowserAsync} from 'expo-web-browser';
import React, {useEffect} from 'react';
import {View, StyleSheet, ScrollView, Platform, Dimensions, BackHandler} from 'react-native';
import {Text, Button, useTheme, Appbar} from 'react-native-paper';
import {Image} from 'expo-image';
import {StatusBar} from 'expo-status-bar';
import {router} from 'expo-router';

const githubUrl = 'https://github.com/barnabas243/CalenTrack.git';

const {width, height} = Dimensions.get('window');

export default function AboutScreen() {
  const {colors} = useTheme();

  useEffect(() => {
    const backAction = () => {
      router.back();
      return true; // Indicate that we've handled the back press
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar style="auto" />
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="About" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/icon.svg')} // Adjust path as needed
            style={styles.logo}
          />
        </View>

        <Button
          mode="contained"
          style={styles.button}
          onPress={async event => {
            if (Platform.OS !== 'web') {
              // Prevent the default behavior of linking to the default browser on native.
              event.preventDefault();
              // Open the link in an in-app browser.
              await openBrowserAsync(githubUrl);
            }
          }}>
          View CalenTrack on GitHub
        </Button>

        <View style={styles.section}>
          <Text style={styles.title}>About CalenTrack</Text>
          <Text style={styles.text}>
            CalenTRACK is a mobile task management app designed to enhance your productivity. By
            placing the calendar at the heart of your task management, it helps you stay organized,
            efficiently manage your tasks, and track your emotions seamlessly.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Features</Text>
          <Text style={styles.text}>
            - <Text style={styles.bold}>Calendar Views</Text>: Customizable views tailored to your
            needs, whether daily, weekly, or monthly.
            {'\n'}- <Text style={styles.bold}>NLP-based Task Creation</Text>: Create tasks
            effortlessly using natural language processing. Describe your task with keywords, and
            CalenTrack will handle the rest.
            {'\n'}- <Text style={styles.bold}>Real-Time Synchronization</Text>: Stay updated with
            real-time synchronization across all your devices.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions, feedback, or need support, please reach out at
            bttf243@gmail.com.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Acknowledgments</Text>
          <Text style={styles.text}>
            Special thanks to React Native, Expo, Supabase, and PowerSync for providing the tools
            and libraries that made this app possible.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: width * 0.5,
    height: height * 0.3,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginVertical: 20,
  },
  button: {
    marginBottom: 20,
  },
});
