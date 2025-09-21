import type { Currency } from '@/contexts/currency-context'

// Free currency conversion API (no API key required)
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest'

interface ExchangeRates {
  [key: string]: number
}

interface ApiResponse {
  base: string
  date: string
  rates: ExchangeRates
}

// Cache for exchange rates to avoid too many API calls
const exchangeRatesCache: { [key: string]: { rates: ExchangeRates; timestamp: number } } = {}
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

// Base currency for conversion (we'll use PHP as base since it's the default)
const BASE_CURRENCY = 'PHP'

export async function getExchangeRates(baseCurrency: string = BASE_CURRENCY): Promise<ExchangeRates> {
  const now = Date.now()
  const cacheKey = baseCurrency
  
  // Check if we have valid cached data
  if (exchangeRatesCache[cacheKey] && 
      (now - exchangeRatesCache[cacheKey].timestamp) < CACHE_DURATION) {
    return exchangeRatesCache[cacheKey].rates
  }

  try {
    const response = await fetch(`${EXCHANGE_RATE_API}/${baseCurrency}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`)
    }
    
    const data: ApiResponse = await response.json()
    
    // Cache the rates
    exchangeRatesCache[cacheKey] = {
      rates: data.rates,
      timestamp: now
    }
    
    return data.rates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    
    // Return fallback rates if API fails
    return getFallbackRates()
  }
}

// Fallback rates in case API is unavailable
function getFallbackRates(): ExchangeRates {
  return {
    PHP: 1,
    USD: 0.018, // Approximate PHP to USD
    EUR: 0.016, // Approximate PHP to EUR
    GBP: 0.014, // Approximate PHP to GBP
    JPY: 2.4,   // Approximate PHP to JPY
    AUD: 0.026, // Approximate PHP to AUD
    CAD: 0.024, // Approximate PHP to CAD
    SGD: 0.024, // Approximate PHP to SGD
  }
}

export async function convertCurrency(
  amount: number, 
  fromCurrency: Currency, 
  toCurrency: Currency
): Promise<number> {
  // If same currency, return original amount
  if (fromCurrency.code === toCurrency.code) {
    return amount
  }

  try {
    const rates = await getExchangeRates(BASE_CURRENCY)
    
    // Convert from source currency to PHP (base)
    let amountInPHP = amount
    if (fromCurrency.code !== BASE_CURRENCY) {
      const fromRate = rates[fromCurrency.code]
      if (!fromRate) {
        console.warn(`Exchange rate not found for ${fromCurrency.code}`)
        return amount
      }
      amountInPHP = amount / fromRate
    }
    
    // Convert from PHP to target currency
    let convertedAmount = amountInPHP
    if (toCurrency.code !== BASE_CURRENCY) {
      const toRate = rates[toCurrency.code]
      if (!toRate) {
        console.warn(`Exchange rate not found for ${toCurrency.code}`)
        return amount
      }
      convertedAmount = amountInPHP * toRate
    }
    
    return Math.round(convertedAmount * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    console.error('Error converting currency:', error)
    return amount // Return original amount if conversion fails
  }
}

// Convert multiple amounts at once for better performance
export async function convertMultipleAmounts(
  amounts: number[],
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number[]> {
  if (fromCurrency.code === toCurrency.code) {
    return amounts
  }

  try {
    const rates = await getExchangeRates(BASE_CURRENCY)
    
    return amounts.map(amount => {
      // Convert from source currency to PHP (base)
      let amountInPHP = amount
      if (fromCurrency.code !== BASE_CURRENCY) {
        const fromRate = rates[fromCurrency.code]
        if (!fromRate) return amount
        amountInPHP = amount / fromRate
      }
      
      // Convert from PHP to target currency
      let convertedAmount = amountInPHP
      if (toCurrency.code !== BASE_CURRENCY) {
        const toRate = rates[toCurrency.code]
        if (!toRate) return amount
        convertedAmount = amountInPHP * toRate
      }
      
      return Math.round(convertedAmount * 100) / 100
    })
  } catch (error) {
    console.error('Error converting multiple amounts:', error)
    return amounts
  }
}
