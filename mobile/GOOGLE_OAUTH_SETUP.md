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

### For Web App:
1. For development: `http://localhost:3000/auth/callback`
2. For production: `https://yourdomain.com/auth/callback`

### For Mobile App:
3. Supabase callback: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Mobile app scheme: `soulpages://auth/callback`
5. Expo development scheme: `exp://127.0.0.1:8081/--/auth/callback` (for local development)
6. Expo Go scheme: `exp://exp.host/@your-username/mobile/--/auth/callback` (if using Expo Go)

**Important for Preview Builds:**
The redirect URI will be automatically generated based on your build environment. Check the console logs when testing to see the exact URI being used, then add it to your Google Cloud Console if needed.

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

### General Issues:
- Make sure your Google Client ID is correct
- Verify redirect URIs are properly configured
- Check that Supabase Google provider is enabled
- Ensure environment variables are loaded correctly 

### OAuth Redirect Issues:
If Google OAuth redirects to localhost or shows errors:

1. **Check Console Logs**: Look for "Generated OAuth redirect URI" in your app logs
2. **Add Missing URI**: Copy the logged URI and add it to Google Cloud Console → Credentials → OAuth 2.0 Client IDs → Authorized redirect URIs
3. **Common URIs to Add**:
   - For preview builds: The exact URI from console logs
   - For development: `exp://127.0.0.1:8081/--/auth/callback`
   - For production: `soulpages://auth/callback`

### Debug Steps:
1. Open your app and attempt Google sign-in
2. Check the console/logs for the exact redirect URI being used
3. Go to [Google Cloud Console](https://console.cloud.google.com/)
4. Navigate to APIs & Services → Credentials
5. Click on your OAuth 2.0 Client ID
6. Add the logged URI to "Authorized redirect URIs"
7. Save and try again

### Still Having Issues?
- Ensure your `EXPO_PUBLIC_GOOGLE_CLIENT_ID` environment variable is set correctly
- Verify your Supabase project URL is correct
- Check that Google OAuth provider is enabled in Supabase dashboard 