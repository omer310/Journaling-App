# Google OAuth Setup for Mobile App

## Step 1: Environment Variables

Add the following to your `.env` file in the mobile directory:

```
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Replace `your_google_client_id_here` with the Client ID you got from Google Cloud Console.

## Step 2: Google Cloud Console Configuration

Make sure you've added the following redirect URIs to your Google OAuth client:

1. For development: `http://localhost:3000/auth/callback`
2. For production: `https://yourdomain.com/auth/callback`
3. Supabase callback: `https://your-project-ref.supabase.co/auth/v1/callback`

## Step 3: Supabase Configuration

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Providers
3. Enable Google provider
4. Add your Google Client ID and Client Secret

## Step 4: Testing

1. Run your mobile app
2. Go to Settings → Web Sync
3. Click "Sign in with Google"
4. Complete the OAuth flow

## How it Works

- Users can now sign in with Google on both web and mobile
- The same Google account will sync data across platforms
- No need to remember email/password - just use Google Sign-In
- Data is encrypted and synced through Supabase

## Troubleshooting

- Make sure your Google Client ID is correct
- Verify redirect URIs are properly configured
- Check that Supabase Google provider is enabled
- Ensure environment variables are loaded correctly 