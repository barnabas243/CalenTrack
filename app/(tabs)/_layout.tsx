import {Tabs} from 'expo-router';
import React from 'react';
import {TabBarIcon} from '@/components/navigation/TabBarIcon';
import {Colors} from '@/constants/Colors';
import {useColorScheme} from '@/hooks/useColorScheme';
import {CalendarTabBarIcon} from '@/components/navigation/CalendarTabBarIcon';
import {TodoProvider} from '@/contexts/TodoContext';
import {UserProvider} from '@/contexts/UserContext';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <UserProvider>
      <TodoProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar />
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
              headerShown: false,
            }}>
            <Tabs.Screen
              name="today"
              options={{
                tabBarLabel: 'Today',
                tabBarIcon: ({color, focused}) => (
                  <CalendarTabBarIcon
                    name={focused ? 'calendar-clear' : 'calendar-clear-outline'}
                    color={color}
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="calendar"
              options={{
                title: 'calendar',
                tabBarIcon: ({color, focused}) => (
                  <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: 'Settings',
                tabBarIcon: ({color, focused}) => (
                  <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
                ),
              }}
            />
          </Tabs>
        </SafeAreaView>
      </TodoProvider>
    </UserProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
