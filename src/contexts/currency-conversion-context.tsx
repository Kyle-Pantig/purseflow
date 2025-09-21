'use client'

import { createContext, useContext, useCallback, useMemo } from 'react'
import { useCurrency } from './currency-context'
import { convertCurrency, convertMultipleAmounts } from '@/lib/currency-converter'
import type { Currency } from './currency-context'
import { SUPPORTED_CURRENCIES } from './currency-context'

// Helper functions to get currency information
function getCurrencySymbol(code: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === code)
  return currency?.symbol || '₱'
}

function getCurrencyLocale(code: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === code)
  return currency?.locale || 'en-PH'
}

function getCurrencyName(code: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === code)
  return currency?.name || 'Philippine Peso'
}

interface CurrencyConversionContextType {
  convertAmount: (amount: number) => Promise<number>
  convertAmounts: (amounts: number[]) => Promise<number[]>
  convertAmountFromPHP: (amount: number) => Promise<number>
  convertAmountFromCurrency: (amount: number, fromCurrency: string) => Promise<number>
}

const CurrencyConversionContext = createContext<CurrencyConversionContextType | undefined>(undefined)

export function CurrencyConversionProvider({ children }: { children: React.ReactNode }) {
  const { currency } = useCurrency()
  
  // Base currency (PHP) - all amounts are stored in PHP in the database
  const baseCurrency: Currency = useMemo(() => ({
    code: 'PHP',
    symbol: '₱',
    locale: 'en-PH',
    name: 'Philippine Peso'
  }), [])

  const convertAmount = useCallback(async (amount: number): Promise<number> => {
    if (currency.code === 'PHP') {
      return amount
    }

    try {
      const convertedAmount = await convertCurrency(amount, currency, baseCurrency)
      return convertedAmount
    } catch (error) {
      console.error('Error converting amount:', error)
      return amount
    }
  }, [currency, baseCurrency]) // Include currency and baseCurrency in dependency array

  const convertAmounts = useCallback(async (amounts: number[]): Promise<number[]> => {
    if (currency.code === 'PHP') {
      return amounts
    }

    try {
      const convertedAmounts = await convertMultipleAmounts(amounts, currency, baseCurrency)
      return convertedAmounts
    } catch (error) {
      console.error('Error converting amounts:', error)
      return amounts
    }
  }, [currency, baseCurrency]) // Include currency and baseCurrency in dependency array

  // Function to convert from PHP to display currency (for input amounts)
  const convertAmountFromPHP = useCallback(async (amount: number): Promise<number> => {
    if (currency.code === 'PHP') {
      return amount
    }

    try {
      const convertedAmount = await convertCurrency(amount, baseCurrency, currency)
      return convertedAmount
    } catch (error) {
      console.error('Error converting amount from PHP:', error)
      return amount
    }
  }, [currency, baseCurrency]) // Include currency and baseCurrency in dependency array

  // Function to convert from any currency to display currency
  const convertAmountFromCurrency = useCallback(async (amount: number, fromCurrency: string): Promise<number> => {
    
    if (fromCurrency === currency.code) {
      return amount
    }

    try {
      // Create currency objects for conversion
      const fromCurrencyObj: Currency = {
        code: fromCurrency,
        symbol: getCurrencySymbol(fromCurrency),
        locale: getCurrencyLocale(fromCurrency),
        name: getCurrencyName(fromCurrency)
      }
      
      const convertedAmount = await convertCurrency(amount, fromCurrencyObj, currency)
      return convertedAmount
    } catch (error) {
      console.error('Error converting amount from currency:', error)
      return amount
    }
  }, [currency]) // Include currency in dependency array

  return (
    <CurrencyConversionContext.Provider value={{
      convertAmount,
      convertAmounts,
      convertAmountFromPHP,
      convertAmountFromCurrency
    }}>
      {children}
    </CurrencyConversionContext.Provider>
  )
}

export const useCurrencyConversion = () => {
  const context = useContext(CurrencyConversionContext)
  if (context === undefined) {
    throw new Error('useCurrencyConversion must be used within a CurrencyConversionProvider')
  }
  return context
}
