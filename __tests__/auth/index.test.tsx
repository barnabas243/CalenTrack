import React from 'react';
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import LoginScreen from '@/app/(auth)/index'; // Adjust the import path as needed
import {supabase} from '@/utils/supabase';
import {Alert} from 'react-native';

// Mock modules

jest.mock('@/utils/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
    },
  },
}));

// Global mock setup - applies to most tests
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn().mockReturnValue({
    setSession: jest.fn(),
    isLoading: false, // Default state
  }),
}));

// Mock the router object
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(), // Mock the replace function
  },
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock history before each
  });

  it('should render correctly', async () => {
    const {findByTestId} = render(<LoginScreen />);

    const email = await findByTestId('email-input');
    const password = await findByTestId('password-input');
    const googleSignInButton = await findByTestId('google-sign-in-button');

    await waitFor(() => {
      expect(email).toBeTruthy();
      expect(password).toBeTruthy();
      expect(googleSignInButton).toBeTruthy();
    });
  });

  it('should display loading indicator when isLoading is true', async () => {
    // Modify the mock implementation for this specific test
    const {useAuth} = require('@/hooks/useAuth');

    // Override the global mock for this specific test
    useAuth.mockReturnValueOnce({
      setSession: jest.fn(),
      isLoading: true,
    });

    const {findByTestId} = render(<LoginScreen />);
    const loadingContainer = await findByTestId('activity-indicator-container');
    const loadingIndicator = await findByTestId('activity-indicator');

    expect(loadingContainer).toBeTruthy();
    expect(loadingIndicator).toBeTruthy();
  });

  it('should handle Google sign-in', async () => {
    // Mock Google Sign-In
    const mockSignIn = jest.fn().mockResolvedValue({
      idToken: 'mockIdToken',
    });
    const mockSignInWithIdToken = jest.fn().mockResolvedValue({
      data: {session: 'mockSession'},
      error: null,
    });

    (GoogleSignin.signIn as jest.Mock).mockImplementation(mockSignIn);
    (supabase.auth.signInWithIdToken as jest.Mock).mockImplementation(mockSignInWithIdToken);

    const {findByTestId} = render(<LoginScreen />);

    const googleSignInButton = await findByTestId('google-sign-in-button');

    await act(async () => {
      fireEvent.press(googleSignInButton);
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
      expect(mockSignInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: 'mockIdToken',
      });
    });
  });

  it('should handle email sign-in', async () => {
    // Mock email sign-in
    const mockSignInWithPassword = jest.fn().mockResolvedValue({
      data: {session: 'mockSession'},
      error: null,
    });

    // Set up the mock
    const {supabase} = require('@/utils/supabase');
    supabase.auth.signInWithPassword.mockImplementation(mockSignInWithPassword);

    const {findByTestId} = render(<LoginScreen />);

    const emailInput = await findByTestId('email-input');
    const passwordInput = await findByTestId('password-input');
    const signInButton = await findByTestId('sign-in-button');

    // Simulate user entering email and password
    await act(async () => {
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password');
    });

    // Ensure that the inputs are updated correctly
    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password');

    // Simulate pressing the sign-in button
    await act(async () => {
      fireEvent.press(signInButton);
    });

    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });
  });

  it('should handle sign-in errors', async () => {
    const mockSignInWithPassword = jest.fn().mockResolvedValue({
      data: null,
      error: {message: 'Sign in failed'},
    });

    (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(mockSignInWithPassword);
    const alertMock = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const {findByTestId} = render(<LoginScreen />);

    const emailInput = await findByTestId('email-input');
    const passwordInput = await findByTestId('password-input');
    const signInButton = await findByTestId('sign-in-button');

    await act(async () => {
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password');
      fireEvent.press(signInButton);
    });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Sign in failed');
    });

    alertMock.mockRestore();
  });
});
