import { useEffect } from 'react'
import { useColor } from '@/contexts/color-context'
import { useAuth } from '@/contexts/auth-context'

export function useCssVariables() {
  const { colors, isLoading } = useColor()
  const { user } = useAuth()

  useEffect(() => {
    const root = document.documentElement
    
    // Only apply loading states for authenticated users
    if (user) {
      if (isLoading) {
        // Show loading state
        root.classList.add('color-loading')
        root.classList.remove('color-loaded')
      } else if (colors.length > 0) {
        // Update CSS custom properties with the user's selected colors
        root.style.setProperty('--primary', colors[0])
        root.style.setProperty('--primary-foreground', 'white')
        root.style.setProperty('--ring', colors[0])
        root.style.setProperty('--sidebar-primary', colors[0])
        root.style.setProperty('--sidebar-ring', colors[0])
        
        // Show loaded state
        root.classList.remove('color-loading')
        root.classList.add('color-loaded')
      }
    } else {
      // For unauthenticated users, use default colors and remove loading states
      root.style.setProperty('--primary', '#8b5cf6') // Default violet
      root.style.setProperty('--primary-foreground', 'white')
      root.style.setProperty('--ring', '#8b5cf6')
      root.style.setProperty('--sidebar-primary', '#8b5cf6')
      root.style.setProperty('--sidebar-ring', '#8b5cf6')
      
      root.classList.remove('color-loading')
      root.classList.add('color-loaded')
    }
  }, [colors, isLoading, user])

  // Return loading state for components to use (only for authenticated users)
  return { isLoading: user ? isLoading : false }
}
