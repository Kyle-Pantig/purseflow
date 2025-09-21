'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { trpc } from '@/lib/trpc-client'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'

export interface Currency {
  code: string
  symbol: string
  locale: string
  name: string
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    code: 'PHP',
    symbol: '₱',
    locale: 'en-PH',
    name: 'Philippine Peso'
  },
  {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    name: 'US Dollar'
  },
  {
    code: 'EUR',
    symbol: '€',
    locale: 'en-EU',
    name: 'Euro'
  },
  {
    code: 'GBP',
    symbol: '£',
    locale: 'en-GB',
    name: 'British Pound'
  },
  {
    code: 'JPY',
    symbol: '¥',
    locale: 'ja-JP',
    name: 'Japanese Yen'
  },
  {
    code: 'AUD',
    symbol: 'A$',
    locale: 'en-AU',
    name: 'Australian Dollar'
  },
  {
    code: 'CAD',
    symbol: 'C$',
    locale: 'en-CA',
    name: 'Canadian Dollar'
  },
  {
    code: 'SGD',
    symbol: 'S$',
    locale: 'en-SG',
    name: 'Singapore Dollar'
  }
]

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  supportedCurrencies: Currency[]
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]) // Default to PHP
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

  // Load saved currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selected-currency')
    if (savedCurrency) {
      try {
        const parsedCurrency = JSON.parse(savedCurrency)
        const foundCurrency = SUPPORTED_CURRENCIES.find(c => c.code === parsedCurrency.code)
        if (foundCurrency) {
          setCurrency(foundCurrency)
        }
      } catch (error) {
        console.error('Error loading saved currency:', error)
      }
    }
  }, [])

  // Handle data when it loads from database
  useEffect(() => {
    if (user && userPreferences?.currencyCode) {
      const foundCurrency = SUPPORTED_CURRENCIES.find(c => c.code === userPreferences.currencyCode)
      if (foundCurrency) {
        setCurrency(foundCurrency)
      }
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

  // Update currency in database
  const updateCurrencyMutation = trpc.user.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Currency preference saved successfully!')
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to save currency preference: ${error.message}`)
    }
  })

  // Save currency to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selected-currency', JSON.stringify(currency))
  }, [currency])

  const handleSetCurrency = useCallback((newCurrency: Currency) => {
    setCurrency(newCurrency)
    // Only update in database if user is authenticated
    if (user) {
      updateCurrencyMutation.mutate({ 
        currencyCode: newCurrency.code as 'PHP' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' 
      })
    }
  }, [user, updateCurrencyMutation])

  const contextValue = useMemo(() => ({
    currency,
    setCurrency: handleSetCurrency,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    isLoading
  }), [currency, isLoading, handleSetCurrency])

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
