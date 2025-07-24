import { Platform } from 'react-native';

// Your Google OAuth Client ID from Google Cloud Console
export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;

// Your Supabase URL
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

// Configure redirect URI for mobile
export const getRedirectUri = () => {
  if (Platform.OS === 'web') {
    return `${window.location.origin}/auth/callback`;
  }
  
  // For mobile, use the Supabase auth callback
  return `${SUPABASE_URL}/auth/v1/callback`;
};

// Google OAuth configuration for Supabase
export const googleAuthConfig = {
  clientId: GOOGLE_CLIENT_ID,
  redirectUri: getRedirectUri(),
  scopes: ['openid', 'profile', 'email'],
  responseType: 'code',
  additionalParameters: {},
  customParameters: {},
}; 