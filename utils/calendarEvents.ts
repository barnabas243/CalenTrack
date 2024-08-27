import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {User} from '@supabase/auth-js/dist/module/lib/types';
import {Alert} from 'react-native';

/**
 * Fetches calendar events for a given user using Google Calendar API.
 *
 * This function retrieves an access token from Google Sign-In, constructs a request to the Google Calendar API
 * to get the list of events for the specified user, and handles potential errors.
 * It requires the user to have a valid access token and to be authenticated with Google Sign-In.
 *
 * @param {User} user - The user object containing the user's email. This is used to specify the calendar from which to fetch events.
 * @returns {Promise<any | null>} A promise that resolves to the list of calendar events in JSON format if the request is successful, or `null` if there is no access token or if an error occurs.
 *
 * @throws {Error} Throws an error if the fetch request fails or if the response is not OK.
 *
 * @example
 * const user = { email: 'user@example.com' };
 * getUsersCalendarEvents(user)
 *   .then(events => {
 *     if (events) {
 *       console.log('Events:', events);
 *     } else {
 *       console.log('No events found or an error occurred.');
 *     }
 *   })
 *   .catch(error => {
 *     console.error('An error occurred:', error);
 *   });
 */
export const getGoogleCalendarEvents = async (user: User): Promise<any | null> => {
  const {accessToken} = await GoogleSignin.getTokens();

  if (!accessToken) {
    Alert.alert('No access token found');
    return null;
  }

  // Construct the API endpoint URL
  const eventsAPI = `https://www.googleapis.com/calendar/v3/calendars/${user?.email}/events`;

  try {
    const response = await fetch(eventsAPI, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });

    // Check if the response is OK (status code 200)
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      return null;
    }

    // Parse and return the JSON data
    const eventList = await response.json();

    const items = eventList.items;
    // return the list of events
    return items;
  } catch (error) {
    // Catch and log any other errors
    console.error('Fetch error:', error);
  }
};

/**
 * Deletes a specific event from the user's Google Calendar.
 *
 * This function requires a valid event ID and a Google Sign-In access token. It sends a DELETE request to the Google Calendar API
 * to remove the specified event from the user's calendar.
 * The user must be authenticated with Google Sign-In and have the necessary permissions to modify their calendar.
 *
 * @param {string} eventId - The unique identifier of the event to be deleted.
 * @param {User} user - The user object containing the user's email. This is used to specify the calendar from which to delete the event.
 * @returns {Promise<void>} A promise that resolves when the event has been successfully deleted, or rejects if an error occurs.
 *
 * @throws {Error} Throws an error if the fetch request fails, if the response is not OK, or if the access token or event ID is missing.
 *
 * @example
 * const eventId = 'abcd1234';
 * const user = { email: 'user@example.com' };
 * deleteGoogleEvent(eventId, user)
 *   .then(() => {
 *     console.log('Event successfully deleted');
 *   })
 *   .catch(error => {
 *     console.error('An error occurred:', error);
 *   });
 */
export const deleteGoogleEvent = async (eventId: string, user: User): Promise<void> => {
  if (!eventId) {
    Alert.alert('No event ID found');
    return;
  }

  const {accessToken} = await GoogleSignin.getTokens();

  if (!accessToken) {
    Alert.alert('No access token found');
    return;
  }

  // Construct the API endpoint URL
  const deleteAPI = `https://www.googleapis.com/calendar/v3/calendars/${user?.email}/events/${eventId}`;

  try {
    const response = await fetch(deleteAPI, {
      method: 'DELETE',
      headers: {Authorization: `Bearer ${accessToken}`},
    });

    // Check if the response is OK (status code 204)
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      return;
    }

    console.log('Event deleted successfully');
  } catch (error) {
    // Catch and log any other errors
    console.error('Delete error:', error);
  }
};
