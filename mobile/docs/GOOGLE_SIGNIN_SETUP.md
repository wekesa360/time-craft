# Google Sign-In Setup for React Native

This document outlines the steps needed to implement Google Sign-In in the mobile app.

## Current Status

- ✅ UI components are ready
- ✅ Auth store structure is prepared
- ❌ Native Google Sign-In not yet implemented
- ❌ OAuth flow needs mobile-specific handling

## Required Dependencies

To implement Google Sign-In, you'll need to install:

```bash
npm install @react-native-google-signin/google-signin
# or
expo install expo-auth-session expo-crypto
```

## Implementation Options

### Option 1: Native Google Sign-In (Recommended)

Using `@react-native-google-signin/google-signin`:

```typescript
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID', // From Google Cloud Console
  offlineAccess: true,
});

// In auth store
loginWithGoogle: async () => {
  try {
    set({ isLoading: true });
    
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    // Send the ID token to your backend
    const response = await apiClient.loginWithGoogleToken(userInfo.idToken);
    
    set({
      user: response.user,
      tokens: response.tokens,
      isAuthenticated: true,
      isLoading: false,
    });
    
    await apiClient.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
  } catch (error) {
    set({ isLoading: false });
    throw error;
  }
}
```

### Option 2: Web-based OAuth (Expo)

Using `expo-auth-session`:

```typescript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const useGoogleAuth = () => {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: 'YOUR_CLIENT_ID',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
    },
    { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' }
  );

  return { request, response, promptAsync };
};
```

## Backend Integration

The backend already supports Google OAuth. You'll need to:

1. **For Native Sign-In**: Create an endpoint to accept Google ID tokens
2. **For Web OAuth**: Use existing `/auth/google` and `/auth/google/callback` endpoints

### New Backend Endpoint (for Native)

```typescript
// POST /auth/google/mobile
auth.post('/google/mobile', zValidator('json', z.object({
  idToken: z.string()
})), async (c) => {
  try {
    const { idToken } = c.req.valid('json');
    
    // Verify the ID token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: c.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    // ... rest of authentication logic
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 400);
  }
});
```

## Setup Steps

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Web client**: For backend OAuth flow
   - **Android client**: For native Android app
   - **iOS client**: For native iOS app

### 2. Configure App

Add the configuration to your app:

```typescript
// config/google.ts
export const GOOGLE_CONFIG = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};
```

### 3. Update Environment Variables

```bash
# .env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
```

### 4. Platform-specific Setup

#### Android
Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

#### iOS
Add to `ios/Podfile`:
```ruby
pod 'GoogleSignIn'
```

## Testing

1. Test on both iOS and Android devices
2. Verify token exchange with backend
3. Test error scenarios (network issues, user cancellation)
4. Ensure proper logout functionality

## Security Considerations

- Always verify ID tokens on the backend
- Use HTTPS for all communications
- Store tokens securely using `expo-secure-store`
- Implement proper token refresh logic
- Handle token expiration gracefully

## Current Workaround

Until Google Sign-In is fully implemented, users can:
1. Use email/OTP authentication
2. Use password-based login
3. Access the web version for Google Sign-In

The app gracefully handles the missing Google Sign-In by showing an informative error message and offering alternative login methods.