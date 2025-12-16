# Google OAuth: JavaScript Origins vs Redirect URIs

## The Difference

### Authorized JavaScript Origins
- **Where your frontend app runs** (Vite dev server)
- Used for client-side OAuth flows
- Format: `http://localhost:PORT` (no path)

### Authorized Redirect URIs  
- **Where Google sends users back after authentication** (your backend)
- This is the callback endpoint
- Format: `http://localhost:PORT/path/to/callback`

## For Your Setup

### Authorized JavaScript Origins
Add these (depending on where your frontend app runs):

```
http://localhost:8080
http://localhost:3000
```

**Important:**
- ❌ **WRONG**: `http://localhost.com:3000` (localhost.com doesn't exist)
- ✅ **CORRECT**: `http://localhost:3000` (no .com)
- Use `localhost` not `127.0.0.1`
- No trailing slash
- No path (just protocol://host:port)

### Authorized Redirect URIs
Add this (your backend callback):

```
http://localhost:8080/api/auth/google/callback
```

**Important:**
- This is where Google redirects after authentication
- Must match exactly what's in your code
- Includes the full path `/api/auth/google/callback`

## Complete Google Cloud Console Setup

### 1. Authorized JavaScript Origins
Add:
```
http://localhost:8080
http://localhost:3000
```
(Add both if you're not sure which port your frontend uses)

### 2. Authorized Redirect URIs
Add:
```
http://localhost:8080/api/auth/google/callback
```

## How to Check Your Vite Port

When you run the frontend, check where it runs:
```
Frontend serves on: http://localhost:8080/
```

Use whatever port it shows (usually 8080 when served with the backend on the same port, or 3000 if you configured it for dev).

## Why Both Are Needed

1. **JavaScript Origins** (`localhost:8080` or `3000`):
   - Your React app runs here
   - Google needs to know this origin is allowed

2. **Redirect URIs** (`localhost:8080/api/auth/google/callback`):
   - Your backend runs here
   - Google redirects here after user authenticates
   - Backend processes the OAuth callback

## Quick Fix

1. Go to Google Cloud Console → Credentials → Your OAuth Client
2. **Authorized JavaScript origins**: Add `http://localhost:8080` (or `3000` if running dev server on different port)
3. **Authorized redirect URIs**: Add `http://localhost:8080/api/auth/google/callback`
4. **Save**
5. Restart your servers and try again



