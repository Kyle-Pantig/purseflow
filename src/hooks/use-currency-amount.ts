'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useCurrencyConversion } from '@/contexts/currency-conversion-context'
import { useCurrency } from '@/contexts/currency-context'

export function useCurrencyAmount(amount: number) {
  const { convertAmount } = useCurrencyConversion()
  const { currency } = useCurrency()
  const [convertedAmount, setConvertedAmount] = useState(amount)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const convert = async () => {
      setIsLoading(true)
      try {
        const converted = await convertAmount(amount)
        if (isMounted) {
          setConvertedAmount(converted)
        }
      } catch (error) {
        console.error('Error converting amount:', error)
        if (isMounted) {
          setConvertedAmount(amount)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    convert()

    return () => {
      isMounted = false
    }
  }, [amount, convertAmount, currency.code])

  return {
    convertedAmount,
    isLoading
  }
}

export function useCurrencyAmounts(amounts: number[]) {
  const { convertAmounts } = useCurrencyConversion()
  const { currency } = useCurrency()
  const [convertedAmounts, setConvertedAmounts] = useState(amounts)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const convert = async () => {
      setIsLoading(true)
      try {
        const converted = await convertAmounts(amounts)
        if (isMounted) {
          setConvertedAmounts(converted)
        }
      } catch (error) {
        console.error('Error converting amounts:', error)
        if (isMounted) {
          setConvertedAmounts(amounts)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    convert()

    return () => {
      isMounted = false
    }
  }, [amounts, convertAmounts, currency.code])

  return {
    convertedAmounts,
    isLoading
  }
}

// New hook for converting amounts with currency information
export function useCurrencyAmountWithCurrency(amount: number, currencyCode: string) {
  const { convertAmountFromCurrency } = useCurrencyConversion()
  const { currency } = useCurrency()
  const [convertedAmount, setConvertedAmount] = useState(amount)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const convert = async () => {
      setIsLoading(true)
      try {
        const converted = await convertAmountFromCurrency(amount, currencyCode)
        if (isMounted) {
          setConvertedAmount(converted)
        }
      } catch (error) {
        console.error('Error converting amount with currency:', error)
        if (isMounted) {
          setConvertedAmount(amount)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    convert()

    return () => {
      isMounted = false
    }
  }, [amount, currencyCode, convertAmountFromCurrency, currency.code])

  return {
    convertedAmount,
    isLoading
  }
}

// New hook for converting multiple amounts with currency information
export function useCurrencyAmountsWithCurrency(expenses: Array<{ amount: number; currency_code: string }>) {
  const { convertAmountFromCurrency } = useCurrencyConversion()
  const { currency } = useCurrency()
  const [convertedAmounts, setConvertedAmounts] = useState(expenses.map(e => e.amount))
  const [isLoading, setIsLoading] = useState(false)

  // Create a stable reference for expenses to prevent infinite loops
  const expensesRef = useRef(expenses)
  
  // Create a unique key that changes when any expense data changes
  const expensesKey = useMemo(() => 
    expenses.map(e => `${e.amount}-${e.currency_code}`).join('|'),
    [expenses]
  )
  
  useEffect(() => {
    expensesRef.current = expenses
  }, [expenses])

  useEffect(() => {
    let isMounted = true

    const convert = async () => {
      const currentExpenses = expensesRef.current
      
      // Don't convert if there are no expenses
      if (currentExpenses.length === 0) {
        if (isMounted) {
          setConvertedAmounts([])
          setIsLoading(false)
        }
        return
      }
      
      setIsLoading(true)
      try {
        const converted = await Promise.all(
          currentExpenses.map(expense => 
            convertAmountFromCurrency(expense.amount, expense.currency_code)
          )
        )
        if (isMounted) {
          setConvertedAmounts(converted)
        }
      } catch (error) {
        console.error('Error converting amounts with currency:', error)
        if (isMounted) {
          setConvertedAmounts(currentExpenses.map(e => e.amount))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    convert()

    return () => {
      isMounted = false
    }
  }, [convertAmountFromCurrency, currency.code, expensesKey]) // Use expensesKey instead of expensesLength

  return {
    convertedAmounts,
    isLoading
  }
}
