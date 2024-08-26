import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {Platform} from 'react-native';
import * as Device from 'expo-device';
import {useSystem} from '@/powersync/system';
import {useAuth} from '@/hooks/useAuth';
import {router} from 'expo-router';
import dayjs from 'dayjs';
import {Todo} from '@/powersync/AppSchema';
import {useTodo} from '@/hooks/useTodo';

export interface NotificationContextType {
  expoPushToken: string;
  notifications: Notifications.Notification[];
  scheduledNotifications: string[];
  scheduleTodoNotification: (todo: Todo) => Promise<string | undefined>;
  updateTodoWithNotification: (
    oldTodo: Todo,
    newTodo: Todo,
  ) => Promise<{status: string; message: string}>;
  cancelNotification: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: '',
  notifications: [],
  scheduledNotifications: [],
  scheduleTodoNotification: async () => '',
  updateTodoWithNotification: async () => ({
    status: 'success',
    message: 'notification added successfully',
  }),
  cancelNotification: async () => {},
});
export interface NotificationProviderProps {
  children: React.ReactNode;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const {status: existingStatus} = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const {status} = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
  }
}

export const NotificationProvider = ({children}: NotificationProviderProps) => {
  const [expoPushToken, setExpoPushToken] = useState('');

  const [scheduledNotifications, setScheduledNotifications] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notifications.Notification[]>([]);

  const {user} = useAuth();
  const {updateExistingTodos} = useTodo();

  const {supabaseConnector} = useSystem();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const updateTodoWithNotification = async (oldTodo: Todo, newTodo: Todo) => {
    let message = {status: 'success', message: 'Notification added successfully'};

    try {
      // Check if the due_date or reminder_option has changed
      const dueDateChanged = oldTodo.due_date !== newTodo.due_date;
      const reminderOptionChanged = oldTodo.reminder_option !== newTodo.reminder_option;

      if (dueDateChanged || reminderOptionChanged) {
        // Cancel the old notification
        if (oldTodo.notification_id) {
          await cancelNotification(oldTodo.notification_id);
        }
        // Schedule a new notification
        const notificationId = await scheduleTodoNotification(newTodo);

        // Update the Todo with the new notification ID
        const updatedTodo: Todo = {...newTodo, notification_id: notificationId || null};

        // Update the Todo in the database
        await updateExistingTodos(updatedTodo);

        // Update the state of scheduled notifications
        setScheduledNotifications(prev => (notificationId ? [...prev, notificationId] : prev));
        message = {status: 'success', message: 'Todo and Notification updated successfully'};
      } else {
        // Update the Todo in the database
        await updateExistingTodos(newTodo);
        message = {status: 'success', message: 'Todo updated successfully'};
      }
    } catch (error: any) {
      console.error('Error updating todo with notification:', error);
      message = {status: 'error', message: error.message || 'An unknown error occurred'};
    }

    return message;
  };

  const scheduleTodoNotification = async (todo: Todo) => {
    if (!todo.reminder_option) {
      // No notification is needed
      return undefined;
    }

    let trigger: Date | undefined;

    const dueDate = dayjs(todo.due_date);

    switch (todo.reminder_option) {
      case 'At Time of Event':
        trigger = dueDate.toDate();
        break;
      case '10 Minutes Before':
        trigger = dueDate.subtract(10, 'minute').toDate(); // 10 minutes before
        break;
      case '1 Hour Before':
        trigger = dueDate.subtract(1, 'hour').toDate(); // 1 hour before
        break;
      case '1 Day Before':
        trigger = dueDate.subtract(1, 'day').toDate(); // 1 day before
        break;
      // case 'custom':
      //   // Handle custom logic here, e.g., by opening a date picker or time input
      //   // trigger = customDate;
      //   break;
      default:
        trigger = dueDate.toDate(); // Default to the event time if no option is selected
        break;
    }

    if (trigger) {
      const notificationID = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Todo Reminder',
          body: `Don't forget: ${todo.title}`,
          sound: true,
        },
        trigger: {
          date: trigger,
        },
      });

      return notificationID;
    } else {
      throw new Error(
        'Could not schedule notification. Please check the reminder_option and due_date fields',
      );
    }
  };
  const cancelNotification = async (notificationId: string) => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    setScheduledNotifications(prev => prev.filter(id => id !== notificationId));
  };

  useEffect(() => {
    if (!user) return;
    supabaseConnector
      .fetchProfile(user.id)
      .then(profile => {
        registerForPushNotificationsAsync()
          .then(async token => {
            if (profile.expoPushToken !== token) setExpoPushToken(token ?? '');

            console.log(token);
            if (!token) return;
            await supabaseConnector.updateProfile({id: user.id, expoPushToken: token});
          })
          .catch((error: any) => console.error(error));
      })
      .catch(error => {
        console.error(error);
      });
  }, [supabaseConnector, user]);

  useEffect(() => {
    let isMounted = true;

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (url) {
        router.push(url);
      }
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log(notification);
      setNotifications(notifications => [...notifications, notification]);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (!isMounted || !response?.notification) {
        return;
      }
      redirect(response?.notification);
    });

    return () => {
      isMounted = false;

      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notifications,
        scheduledNotifications,
        scheduleTodoNotification,
        updateTodoWithNotification,
        cancelNotification,
      }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
