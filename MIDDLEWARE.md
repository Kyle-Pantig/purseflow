# Middleware Setup Guide

This expense tracker app now includes Next.js middleware for authentication and route protection.

## Features

- **Authentication Protection**: Automatically redirects unauthenticated users to login
- **Route Protection**: Protects dashboard, expenses, reports, and settings pages
- **API Protection**: Secures tRPC API endpoints
- **Smart Redirects**: Handles root path redirects based on authentication status
- **Environment Variable Validation**: Gracefully handles missing Supabase configuration

## Environment Variables Required

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How It Works

### Protected Routes
- `/dashboard` - Dashboard page
- `/expenses` - Expenses management
- `/reports` - Reports and analytics
- `/settings` - User settings

### Public Routes
- `/login` - Login page (redirects to dashboard if already authenticated)

### API Routes
- `/api/trpc/*` - All tRPC API endpoints

### Redirect Logic
- **Root path (`/`)**: Redirects to `/dashboard` if authenticated, `/login` if not
- **Protected routes**: Redirects to `/login` with `redirectTo` parameter if not authenticated
- **Login page**: Redirects to `/dashboard` if already authenticated
- **API routes**: Returns 401 Unauthorized if not authenticated

## Benefits

1. **Server-side Protection**: Authentication is enforced at the middleware level
2. **Better Performance**: No client-side redirects for protected routes
3. **SEO Friendly**: Proper HTTP status codes for API endpoints
4. **User Experience**: Smooth redirects with preserved intended destination
5. **Security**: Prevents unauthorized access to protected resources

## Migration from Client-side Protection

The middleware completely replaces the `ProtectedRoute` components for a more efficient approach:
- **Server-side protection**: All authentication is handled at the middleware level
- **No client-side redirects**: Pages load directly without client-side authentication checks
- **Simpler codebase**: Removed redundant protection layers
- **Better performance**: No unnecessary client-side authentication state management

## Additional Features

### Sidebar Dropdown State Persistence

The app now includes localStorage functionality to remember the state of sidebar dropdown menus:

- **Dropdown States**: Each collapsible menu (Expenses, Reports, Settings) remembers if it was expanded or collapsed
- **localStorage**: States are automatically saved to and loaded from localStorage
- **Context Management**: Uses React Context for state management across components
- **Fallback Behavior**: Falls back to `isActive` prop if no saved state exists

#### Usage

```tsx
import { useSidebarDropdown } from '@/hooks/use-sidebar-dropdown'

const { isOpen, toggle, setOpen } = useSidebarDropdown('Expenses')
```

## Testing

1. Start the development server: `npm run dev`
2. Try accessing `/dashboard` without being logged in - should redirect to `/login`
3. Log in and try accessing `/login` - should redirect to `/dashboard`
4. Access root path `/` - should redirect based on authentication status
5. Expand/collapse sidebar dropdown menus - states should persist across page refreshes
