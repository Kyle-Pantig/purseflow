import { createIntl, createIntlCache } from '@formatjs/intl'
import type { Currency } from '@/contexts/currency-context'

// Create a cache for the Intl instance
const cache = createIntlCache()

// Create a number formatter for any currency
export const formatCurrency = (amount: number, currency: Currency): string => {
  const intl = createIntl(
    {
      locale: currency.locale,
      messages: {},
    },
    cache
  )

  return intl.formatNumber(amount, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Format currency without symbol (for input fields)
export const formatCurrencyValue = (amount: number, currency: Currency): string => {
  const intl = createIntl(
    {
      locale: currency.locale,
      messages: {},
    },
    cache
  )

  return intl.formatNumber(amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Parse currency string to number
export const parseCurrency = (value: string): number => {
  // Remove currency symbols and spaces
  const cleanValue = value.replace(/[₱$€£¥,\s]/g, '')
  return parseFloat(cleanValue) || 0
}
