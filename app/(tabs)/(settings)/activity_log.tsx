import {useAuth} from '@/hooks/useAuth';
import {useTodo} from '@/hooks/useTodo';
import {action_type, ActivityLog, Profile, Section, Todo} from '@/powersync/AppSchema';
import {useSystem} from '@/powersync/system';
import {AuthError} from '@supabase/supabase-js';
import {router} from 'expo-router';
import React, {useEffect, useMemo, useState} from 'react';
import {View, StyleSheet, Alert, SectionList} from 'react-native';
import {Text, List, useTheme, Divider, Appbar, Avatar} from 'react-native-paper';
import PageLoadingActivityIndicator from '@/components/PageLoadingActivityIndicator';
import dayjs from 'dayjs';
import {groupBy} from 'lodash';
import relativeTime from 'dayjs/plugin/relativeTime'; // Import relativeTime plugin

dayjs.extend(relativeTime); // Use the relativeTime plugin

export const getActionType = (actionType: action_type) => {
  switch (actionType) {
    case 'CREATED':
      return 'added';
    case 'UPDATED':
      return 'updated';
    case 'DELETED':
      return 'deleted';
    default:
      return 'unknown';
  }
};

export type Entity = Todo | Section;

const ActivityLogScreen = () => {
  const {activityLogs} = useTodo();
  const {colors} = useTheme();
  const {user} = useAuth();
  const {supabaseConnector} = useSystem();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use useMemo to memoize the grouped logs
  const sections = useMemo(() => {
    // Group logs by date only (ignoring time)
    const groupedLogs = groupBy(activityLogs, log => dayjs(log.action_date).format('YYYY-MM-DD'));

    // Format data for SectionList
    return Object.keys(groupedLogs).map(date => {
      const formattedDate = dayjs(date);
      const today = dayjs().startOf('day');
      const yesterday = dayjs().subtract(1, 'day').startOf('day');
      const relativeTitle = formattedDate.isSame(today, 'day')
        ? 'Today'
        : formattedDate.isSame(yesterday, 'day')
          ? 'Yesterday'
          : formattedDate.from(today); // Format relative to today for other dates

      return {
        title: `${formattedDate.format('MMM D')} • ${relativeTitle}`,
        data: groupedLogs[date],
      };
    });
  }, [activityLogs]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        const profile = await supabaseConnector.fetchProfile(user!.id);
        setProfile(profile);
        setIsLoading(false);
      } catch (error) {
        if (error instanceof AuthError) {
          Alert.alert('Error Fetching Profile', error.message);
        }
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [supabaseConnector, user]);

  const renderItem = ({item}: {item: ActivityLog}) => {
    // Handle potential JSON parsing errors
    let beforeData: Entity | null;
    let afterData: Entity | null;
    try {
      beforeData = item.before_data ? JSON.parse(item.before_data) : null;
      afterData = item.after_data ? JSON.parse(item.after_data) : null;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      beforeData = null;
      afterData = null;
    }
    const getDifference = (beforeData: Entity | null, afterData: Entity | null): JSX.Element => {
      const getTodoChanges = (beforeTodo: Todo | null, afterTodo: Todo | null): JSX.Element => {
        const differences: JSX.Element[] = [];

        if (!beforeTodo && !afterTodo) {
          return <Text>Both before and after are empty.</Text>;
        }

        if (!beforeTodo) {
          // Case 1: New Todo inserted
          return <Text>You have added a todo: {afterTodo?.title}</Text>;
        }

        if (!afterTodo) {
          // Case 2: Todo deleted
          return <Text>You have deleted the todo: {beforeTodo.title}</Text>;
        }

        // Case 3: Todo completed
        if (beforeTodo.completed === 0 && afterTodo.completed === 1) {
          return <Text>You have completed the todo: {afterTodo.title}</Text>;
        }

        // Case 4: Todo uncompleted
        if (beforeTodo.completed === 1 && afterTodo.completed === 0) {
          return <Text>You have uncompleted the todo: {afterTodo.title}</Text>;
        }
        // Case 5: Other fields updated
        const fieldsToCheck: (keyof Todo)[] = [
          'title',
          'summary',
          'due_date',
          'start_date',
          'priority',
          'recurrence',
          'reminder_option',
          'notification_id',
          'parent_id',
          'section_id',
        ];

        fieldsToCheck.forEach(field => {
          const beforeValue = beforeTodo[field];
          const afterValue = afterTodo[field];

          if (beforeValue !== afterValue) {
            if (beforeValue === null || beforeValue === '') {
              differences.push(
                <Text key={field}>
                  You added a {field.replace(/_/g, ' ')} to {afterTodo.title}.{' '}
                </Text>,
              );
            } else {
              differences.push(
                <Text key={field}>
                  {`${field.replace(/_/g, ' ').charAt(0).toUpperCase() + field.slice(1)} changed from `}
                  <Text style={{textDecorationLine: 'line-through'}}>{beforeValue.toString()}</Text>{' '}
                  to {afterValue}.{' '}
                </Text>,
              );
            }
          }
        });

        return (
          <>
            {differences.length > 0 ? differences : <Text>No significant changes detected.</Text>}
          </>
        );
      };

      const getSectionChanges = (
        beforeSection: Section | null,
        afterSection: Section | null,
      ): JSX.Element => {
        const differences: JSX.Element[] = [];

        if (!beforeSection && !afterSection) {
          return <Text>Both before and after are empty.</Text>;
        }

        if (!beforeSection) {
          // Case 1: New Section inserted
          return <Text>You have added a section: {afterSection?.name}</Text>;
        }

        if (!afterSection) {
          // Case 2: Section deleted
          return <Text>You have deleted the section: {beforeSection.name}</Text>;
        }

        // Case 3: Other fields updated
        const fieldsToCheck: (keyof Section)[] = ['name'];

        fieldsToCheck.forEach(field => {
          const beforeValue = beforeSection[field];
          const afterValue = afterSection[field];

          if (beforeValue !== afterValue) {
            if (beforeValue === null || beforeValue === '') {
              differences.push(
                <Text key={field}>
                  You added a {field.replace(/_/g, ' ')} to {afterSection.name}.{' '}
                </Text>,
              );
            } else {
              differences.push(
                <Text key={field}>
                  {`${field.replace(/_/g, ' ').charAt(0).toUpperCase() + field.slice(1)} changed from `}
                  <Text style={{textDecorationLine: 'line-through'}}>{beforeValue.toString()}</Text>{' '}
                  to {afterValue}.{' '}
                </Text>,
              );
            }
          }
        });

        return (
          <>
            {differences.length > 0 ? differences : <Text>No significant changes detected.</Text>}
          </>
        );
      };

      if (beforeData === null) {
        // Handle new entities
        if (item.entity_type === 'todo') {
          // Check if it's a Todo
          return getTodoChanges(null, afterData as Todo);
        } else if (item.entity_type === 'section') {
          // Check if it's a Section
          return getSectionChanges(null, afterData as Section);
        }
      }

      if (afterData === null) {
        // Handle deleted entities
        if (item.entity_type === 'todo') {
          // Check if it's a Todo
          return getTodoChanges(beforeData as Todo, null);
        } else if (item.entity_type === 'section') {
          // Check if it's a Section
          return getSectionChanges(beforeData as Section, null);
        }
      }

      if (beforeData && afterData) {
        // Determine type and get changes
        if ((beforeData as Todo).completed !== undefined) {
          // It's a Todo
          return getTodoChanges(beforeData as Todo, afterData as Todo);
        } else if ((beforeData as Section).name !== undefined) {
          // It's a Section
          return getSectionChanges(beforeData as Section, afterData as Section);
        }
      }

      return <Text>Unknown type or no differences found.</Text>;
    };

    const title: JSX.Element = getDifference(beforeData, afterData);

    return (
      <List.Item
        left={() => (
          <Avatar.Image
            testID="profile-image"
            size={50}
            source={{uri: profile?.avatar_url ?? ''}}
          />
        )}
        onPress={() => {}}
        title={title}
        titleNumberOfLines={5}
        borderless
        style={{paddingHorizontal: 10}}
        description={dayjs(item.action_date).format('h:mm A')}
      />
    );
  };

  // Sample header function for the SectionList
  const renderSectionHeader = ({section}: {section: {title: string}}) => (
    <Text
      variant="titleSmall"
      style={{
        marginLeft: 10,
        backgroundColor: colors.background,
      }}>
      {section.title}
    </Text>
  );

  if (isLoading) {
    return <PageLoadingActivityIndicator />;
  }
  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.replace('/(settings)')} />
        <Appbar.Content title="Activity Log" />
      </Appbar.Header>

      <SectionList
        sections={sections}
        renderItem={renderItem}
        stickySectionHeadersEnabled
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No activity logs available.</Text>}
        ItemSeparatorComponent={() => <Divider />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  dateContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});

export default ActivityLogScreen;
