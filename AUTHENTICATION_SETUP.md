# Authentication Setup Guide

This guide explains how to set up authentication for the PurseFlow expense tracker application.

## Environment Variables Required

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## How Authentication Works

### 1. Middleware Protection
- The `middleware.ts` file protects all routes that start with:
  - `/dashboard`
  - `/expenses`
  - `/reports`
  - `/settings`
  - `/profile`

### 2. Server-Side Protection
- Each protected page uses the `requireAuth()` function from `src/lib/auth-server.ts`
- This provides server-side authentication checking before the page renders
- Prevents any flash of content before redirect
- Redirects to `/login` if user is not authenticated

### 3. Client-Side Protection (Backup)
- The `AuthGuard` component is available for additional client-side protection
- Shows loading state while checking authentication
- Can be used as a fallback if needed

### 4. Public Routes
- `/login`
- `/forgot-password`
- `/reset-password`

## Testing Authentication

1. **Without Authentication:**
   - Try accessing `/dashboard` directly in the browser
   - You should be redirected to `/login`

2. **With Authentication:**
   - Log in through the login page
   - You should be able to access all protected routes
   - Accessing `/login` while authenticated should redirect to `/dashboard`

## Troubleshooting

### Middleware Not Working
1. Check that environment variables are set correctly
2. Ensure Supabase project is properly configured
3. Check browser console for any errors
4. Verify that the middleware is running (check Network tab for redirects)

### Client-Side Redirects Not Working
1. Check that the `AuthProvider` is wrapping your app
2. Verify that the `useAuth` hook is working correctly
3. Check for any JavaScript errors in the console

## Files Modified

- `middleware.ts` - Server-side route protection
- `src/lib/auth-server.ts` - Server-side authentication utilities
- `src/components/auth-guard.tsx` - Client-side protection component (backup)
- All protected page components now use `requireAuth()` for server-side protection
