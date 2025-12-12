# Debugging Authentication Issues

## Steps to Debug

1. **Check if you're logged in:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for logs like "Auth status response:" and "User authenticated:"
   - Check Application/Storage tab → Cookies → look for `connect.sid`

2. **Test the auth endpoint directly:**
   - Open browser console
   - Run: `fetch('/api/auth/status', { credentials: 'include' }).then(r => r.json()).then(console.log)`
   - Should return: `{ authenticated: true, user: { ... } }` if logged in

3. **Check if session cookie is set:**
   - After logging in with Google/LinkedIn
   - Check Application/Storage → Cookies
   - Should see `connect.sid` cookie

4. **Verify OAuth callback:**
   - After clicking "Login with Google"
   - You should be redirected to Google
   - After authorizing, you should be redirected back to `/`
   - Check the URL - should NOT have `?error=` in it

5. **Check backend logs:**
   - Look at your backend server console
   - Should see successful authentication logs

## Common Issues

- **Session not persisting:** Check CORS settings and cookie settings
- **User not authenticated:** Make sure you completed the OAuth flow
- **Profile picture not showing:** Check if `user.picture` is null/undefined


