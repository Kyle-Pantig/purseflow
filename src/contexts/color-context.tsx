'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc-client'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'

// Predefined color schemes
export const COLOR_SCHEMES = {
  violet: {
    name: 'Violet',
    colors: [
      '#8b5cf6', // violet-500
      '#a855f7', // purple-500
      '#c084fc', // purple-300
      '#d8b4fe', // purple-200
      '#e9d5ff', // purple-100
      '#f3e8ff', // purple-50
      '#7c3aed', // violet-600
      '#9333ea', // purple-600
      '#a21caf', // fuchsia-600
      '#c026d3', // fuchsia-500
      '#d946ef'  // fuchsia-400
    ]
  },
  blue: {
    name: 'Blue',
    colors: [
      '#3b82f6', // blue-500
      '#2563eb', // blue-600
      '#1d4ed8', // blue-700
      '#60a5fa', // blue-400
      '#93c5fd', // blue-300
      '#dbeafe', // blue-100
      '#1e40af', // blue-800
      '#1e3a8a', // blue-900
      '#0ea5e9', // sky-500
      '#0284c7', // sky-600
      '#0369a1'  // sky-700
    ]
  },
  green: {
    name: 'Green',
    colors: [
      '#10b981', // emerald-500
      '#059669', // emerald-600
      '#047857', // emerald-700
      '#34d399', // emerald-400
      '#6ee7b7', // emerald-300
      '#d1fae5', // emerald-100
      '#065f46', // emerald-800
      '#064e3b', // emerald-900
      '#22c55e', // green-500
      '#16a34a', // green-600
      '#15803d'  // green-700
    ]
  },
  orange: {
    name: 'Orange',
    colors: [
      '#f97316', // orange-500
      '#ea580c', // orange-600
      '#c2410c', // orange-700
      '#fb923c', // orange-400
      '#fdba74', // orange-300
      '#fed7aa', // orange-200
      '#9a3412', // orange-800
      '#7c2d12', // orange-900
      '#f59e0b', // amber-500
      '#d97706', // amber-600
      '#b45309'  // amber-700
    ]
  },
  red: {
    name: 'Red',
    colors: [
      '#ef4444', // red-500
      '#dc2626', // red-600
      '#b91c1c', // red-700
      '#f87171', // red-400
      '#fca5a5', // red-300
      '#fecaca', // red-200
      '#991b1b', // red-800
      '#7f1d1d', // red-900
      '#f43f5e', // rose-500
      '#e11d48', // rose-600
      '#be123c'  // rose-700
    ]
  },
  indigo: {
    name: 'Indigo',
    colors: [
      '#6366f1', // indigo-500
      '#4f46e5', // indigo-600
      '#4338ca', // indigo-700
      '#818cf8', // indigo-400
      '#a5b4fc', // indigo-300
      '#c7d2fe', // indigo-200
      '#3730a3', // indigo-800
      '#312e81', // indigo-900
      '#8b5cf6', // violet-500
      '#7c3aed', // violet-600
      '#6d28d9'  // violet-700
    ]
  }
} as const

export type ColorScheme = keyof typeof COLOR_SCHEMES

interface ColorContextType {
  currentScheme: ColorScheme
  colors: string[]
  setColorScheme: (scheme: ColorScheme) => void
  isLoading: boolean
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [currentScheme, setCurrentScheme] = useState<ColorScheme>('violet')
  const [isLoading, setIsLoading] = useState(false) // Start with false for unauthenticated users
  const { user } = useAuth()

  // Only fetch user preferences if user is authenticated
  const { data: userPreferences, refetch, isLoading: queryLoading } = trpc.user.getPreferences.useQuery(
    undefined,
    {
      enabled: !!user, // Only run query if user is authenticated
      retry: false, // Don't retry on 401 errors
    }
  )

  // Update loading state based on query and authentication
  useEffect(() => {
    if (user) {
      setIsLoading(queryLoading)
    } else {
      setIsLoading(false) // No loading for unauthenticated users
    }
  }, [queryLoading, user])

  // Handle data when it loads
  useEffect(() => {
    if (user && userPreferences?.colorScheme && userPreferences.colorScheme in COLOR_SCHEMES) {
      setCurrentScheme(userPreferences.colorScheme as ColorScheme)
    }
  }, [userPreferences, user])

  // Fallback: if query takes too long, enable buttons after 2 seconds (only for authenticated users)
  useEffect(() => {
    if (!user) return

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [user])

  // Update color scheme in database
  const updateColorSchemeMutation = trpc.user.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Color theme saved successfully!')
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to save color theme: ${error.message}`)
    }
  })

  const setColorScheme = (scheme: ColorScheme) => {
    setCurrentScheme(scheme)
    // Only update in database if user is authenticated
    if (user) {
      updateColorSchemeMutation.mutate({ colorScheme: scheme })
    }
  }

  const colors = [...COLOR_SCHEMES[currentScheme].colors]

  const value: ColorContextType = {
    currentScheme,
    colors,
    setColorScheme,
    isLoading
  }

  return (
    <ColorContext.Provider value={value}>
      {children}
    </ColorContext.Provider>
  )
}

export function useColor() {
  const context = useContext(ColorContext)
  if (context === undefined) {
    throw new Error('useColor must be used within a ColorProvider')
  }
  return context
}
