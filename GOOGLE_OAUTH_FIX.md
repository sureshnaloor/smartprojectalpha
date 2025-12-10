# Fixing Google OAuth redirect_uri_mismatch Error

## The Problem
You're getting `Error 400: redirect_uri_mismatch` because the redirect URI in your code doesn't exactly match what's configured in Google Cloud Console.

## Quick Fix Steps

### 1. Check What Redirect URI Your Code Is Using

When you start your server, check the console output. You should see:
```
🔐 Google OAuth Callback URL: http://localhost:8080/api/auth/google/callback
```

**Note the exact URL** - it must match EXACTLY in Google Cloud Console (including http/https, port, trailing slashes, etc.)

### 2. Verify in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Scroll down to **Authorized redirect URIs**
6. Make sure you have EXACTLY this URL (for local development):
   ```
   http://localhost:8080/api/auth/google/callback
   ```

### 3. Common Mistakes to Avoid

❌ **WRONG:**
- `http://localhost:8080/api/auth/google/callback/` (trailing slash)
- `https://localhost:8080/api/auth/google/callback` (https instead of http)
- `http://127.0.0.1:8080/api/auth/google/callback` (127.0.0.1 instead of localhost)
- `http://localhost:3000/api/auth/google/callback` (wrong port)

✅ **CORRECT:**
- `http://localhost:8080/api/auth/google/callback` (exact match)

### 4. For External Users (Your Case)

Since you selected "External" user type:

1. **OAuth Consent Screen** must be configured:
   - Go to **APIs & Services** → **OAuth consent screen**
   - Fill in all required fields:
     - App name
     - User support email
     - Developer contact information
   - Add your email to **Test users** if the app is in "Testing" mode
   - Publish the app if you want anyone to use it (or add test users)

2. **Scopes** - Make sure these are added:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`

3. **Authorized redirect URIs** - Add exactly:
   ```
   http://localhost:8080/api/auth/google/callback
   ```

### 5. After Making Changes

- **Save** the changes in Google Cloud Console
- Changes are usually **instant** (no propagation delay needed)
- **Restart your server** to ensure it picks up any environment variable changes

### 6. Verify Your Environment Variables

Make sure your `.env` file has:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
# OR
BASE_URL=http://localhost:8080
```

### 7. Test Again

1. Restart your backend server
2. Check the console for the callback URL log
3. Try logging in again
4. If it still fails, double-check the exact URL in Google Console matches the logged URL

## For Production

When deploying, add your production URL:
```
https://yourdomain.com/api/auth/google/callback
```

Make sure to:
- Use `https://` (not `http://`)
- Match your actual domain
- Keep both localhost and production URLs in the list

## Still Not Working?

1. **Clear browser cache** and cookies
2. **Check browser console** for any additional errors
3. **Verify** the OAuth consent screen is published (or you're added as a test user)
4. **Check** that the OAuth client is enabled (not deleted/disabled)



