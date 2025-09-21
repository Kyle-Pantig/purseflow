'use client'

import { useMemo, useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, TrendingUp, Calendar, CreditCard, Wallet, TrendingDown } from 'lucide-react'
import { AddExpenseDialog } from './add-expense-dialog'
import { formatCurrency } from '@/lib/currency'
import { useCurrency } from '@/contexts/currency-context'
import { useColor } from '@/contexts/color-context'
import { useAuth } from '@/contexts/auth-context'
import { useCurrencyAmountsWithCurrency, useCurrencyAmountWithCurrency } from '@/hooks/use-currency-amount'
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'

const categoryLabels = {
  transportation: 'Transportation',
  food: 'Food & Dining',
  groceries: 'Groceries',
  bills: 'Bills & Utilities',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  healthcare: 'Healthcare',
  education: 'Education',
  travel: 'Travel',
  utilities: 'Utilities',
  others: 'Others'
}

export function DashboardContent() {
  const [isMounted, setIsMounted] = useState(false)
  const { user } = useAuth()
  const { data: recentExpenses, isLoading: recentLoading, error: recentError } = trpc.expense.getRecentExpenses.useQuery({ limit: 5 })
  const { data: todayExpenses, isLoading: todayLoading, error: todayError } = trpc.expense.getTodayExpenses.useQuery()
  const { data: preferences, isLoading: preferencesLoading } = trpc.user.getPreferences.useQuery(
    undefined,
    {
      enabled: !!user, // Only run query if user is authenticated
      retry: false, // Don't retry on 401 errors
    }
  )
  const { data: monthlyIncome, isLoading: monthlyIncomeLoading } = trpc.income.getMonthlyIncome.useQuery({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })
  const currentYear = new Date().getFullYear()
  const yearlyStartDate = new Date(currentYear, 0, 1).toISOString().split('T')[0]
  const yearlyEndDate = new Date(currentYear, 11, 31).toISOString().split('T')[0]
  const { data: yearlyIncome, isLoading: yearlyIncomeLoading } = trpc.income.getIncomeByDate.useQuery({
    startDate: yearlyStartDate,
    endDate: yearlyEndDate
  })
  const { currency } = useCurrency()
  const { colors } = useColor()

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  
  // Calculate weekly and monthly totals from all recent expenses
  const now = useMemo(() => new Date(), [])
  const startOfWeek = useMemo(() => {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0) // Set to start of day
    return start
  }, [now])
  const startOfMonth = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now])
  
  // Get all expenses for weekly and monthly calculations
  const { data: allExpenses, isLoading: allLoading, error: allError } = trpc.expense.getAllExpenses.useQuery()
  
  const weeklyExpenses = useMemo(() => 
    allExpenses?.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= startOfWeek
    }) || [], 
    [allExpenses, startOfWeek]
  )
  
  const monthlyExpenses = useMemo(() => 
    allExpenses?.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= startOfMonth
    }) || [], 
    [allExpenses, startOfMonth]
  )
  
  const yearlyExpenses = useMemo(() => 
    allExpenses?.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getFullYear() === new Date().getFullYear()
    }) || [], 
    [allExpenses]
  )
  
  // Convert all expenses to PHP first, then sum them up
  const todayExpensesData = useMemo(() => 
    todayExpenses?.map(expense => ({ 
      amount: expense.amount, 
      currency_code: expense.currency_code || 'PHP' 
    })) || [], 
    [todayExpenses]
  )
  
  const weeklyExpensesData = useMemo(() => 
    weeklyExpenses?.map(expense => ({ 
      amount: expense.amount, 
      currency_code: expense.currency_code || 'PHP' 
    })) || [], 
    [weeklyExpenses]
  )
  
  const monthlyExpensesData = useMemo(() => 
    monthlyExpenses?.map(expense => ({ 
      amount: expense.amount, 
      currency_code: expense.currency_code || 'PHP' 
    })) || [], 
    [monthlyExpenses]
  )
  
  const yearlyExpensesData = useMemo(() => 
    yearlyExpenses?.map(expense => ({ 
      amount: expense.amount, 
      currency_code: expense.currency_code || 'PHP' 
    })) || [], 
    [yearlyExpenses]
  )
  
  // Convert totals to selected currency using proper currency conversion
  const { convertedAmounts: convertedTodayAmounts, isLoading: isConvertingToday } = useCurrencyAmountsWithCurrency(todayExpensesData)
  const { convertedAmounts: convertedWeeklyAmounts, isLoading: isConvertingWeekly } = useCurrencyAmountsWithCurrency(weeklyExpensesData)
  const { convertedAmounts: convertedMonthlyAmounts, isLoading: isConvertingMonthly } = useCurrencyAmountsWithCurrency(monthlyExpensesData)
  const { convertedAmounts: convertedYearlyAmounts, isLoading: isConvertingYearly } = useCurrencyAmountsWithCurrency(yearlyExpensesData)
  
  // Sum up the converted amounts
  const convertedTodayTotal = convertedTodayAmounts.length > 0 ? convertedTodayAmounts.reduce((sum, amount) => sum + amount, 0) : 0
  const convertedWeeklyTotal = convertedWeeklyAmounts.length > 0 ? convertedWeeklyAmounts.reduce((sum, amount) => sum + amount, 0) : 0
  const convertedMonthlyTotal = convertedMonthlyAmounts.length > 0 ? convertedMonthlyAmounts.reduce((sum, amount) => sum + amount, 0) : 0
  const convertedYearlyTotal = convertedYearlyAmounts.length > 0 ? convertedYearlyAmounts.reduce((sum, amount) => sum + amount, 0) : 0

  // Convert income amounts from their stored currencies to display currency
  const incomeData = useMemo(() => 
    monthlyIncome?.map(income => ({ 
      amount: income.amount, 
      currency_code: income.currency_code || 'PHP' 
    })) || [], 
    [monthlyIncome]
  )
  const { convertedAmounts: convertedIncomeAmounts, isLoading: isConvertingIncome } = useCurrencyAmountsWithCurrency(incomeData)
  
  const yearlyIncomeData = useMemo(() => 
    yearlyIncome?.map((income: { amount: number; currency_code?: string }) => ({ 
      amount: income.amount, 
      currency_code: income.currency_code || 'PHP' 
    })) || [], 
    [yearlyIncome]
  )
  const { convertedAmounts: convertedYearlyIncomeAmounts, isLoading: isConvertingYearlyIncome } = useCurrencyAmountsWithCurrency(yearlyIncomeData)

  // Convert salary from stored currency to display currency
  const { convertedAmount: convertedSalary, isLoading: isConvertingSalary } = useCurrencyAmountWithCurrency(
    preferences?.monthlySalary || 0, 
    preferences?.currencyCode || 'PHP'
  )
  const { convertedAmount: convertedYearlySalary, isLoading: isConvertingYearlySalary } = useCurrencyAmountWithCurrency(
    (preferences?.monthlySalary || 0) * 12, 
    preferences?.currencyCode || 'PHP'
  )

  // Calculate income totals using converted amounts (memoized)
  const otherIncome = useMemo(() => 
    convertedIncomeAmounts.length > 0 ? convertedIncomeAmounts.reduce((sum, amount) => sum + amount, 0) : 0,
    [convertedIncomeAmounts]
  )
  const totalMonthlyIncome = useMemo(() => 
    convertedSalary + otherIncome,
    [convertedSalary, otherIncome]
  )
  const remainingBalance = useMemo(() => 
    totalMonthlyIncome - convertedMonthlyTotal,
    [totalMonthlyIncome, convertedMonthlyTotal]
  )
  
  const otherYearlyIncome = useMemo(() => 
    convertedYearlyIncomeAmounts.length > 0 ? convertedYearlyIncomeAmounts.reduce((sum, amount) => sum + amount, 0) : 0,
    [convertedYearlyIncomeAmounts]
  )
  const totalYearlyIncome = useMemo(() => 
    convertedYearlySalary + otherYearlyIncome,
    [convertedYearlySalary, otherYearlyIncome]
  )
  const yearlyRemainingBalance = useMemo(() => 
    totalYearlyIncome - convertedYearlyTotal,
    [totalYearlyIncome, convertedYearlyTotal]
  )
  
  // Convert individual amounts for display using currency information
  const expenseData = useMemo(() => 
    recentExpenses?.map(expense => ({ 
      amount: expense.amount, 
      currency_code: expense.currency_code || 'PHP' 
    })) || [], 
    [recentExpenses]
  )
  const { convertedAmounts: convertedExpenseAmounts, isLoading: isConvertingExpenses } = useCurrencyAmountsWithCurrency(expenseData)

  // Calculate category totals using converted amounts
  const categoryTotals = useMemo(() => {
    if (convertedTodayAmounts.length === 0) return {}
    
    return todayExpenses?.reduce((acc, expense, index) => {
      const convertedAmount = convertedTodayAmounts[index] || 0
      acc[expense.category] = (acc[expense.category] || 0) + convertedAmount
      return acc
    }, {} as Record<string, number>) || {}
  }, [todayExpenses, convertedTodayAmounts])

  // Prepare data for charts
  const weeklyChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    return days.map((day, index) => {
      const dayDate = new Date(startOfWeek)
      dayDate.setDate(startOfWeek.getDate() + index)
      
      const dayExpenses = allExpenses?.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.toDateString() === dayDate.toDateString()
      }) || []
      
      
      // For simplicity, we'll use the original amounts for the chart
      // In a real app, you'd want to convert these too
      const totalAmount = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      
      return {
        day,
        amount: totalAmount,
        date: dayDate.toISOString().split('T')[0]
      }
    })
  }, [allExpenses])

  const yearlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    
    return months.map((month, index) => {
      const monthExpenses = allExpenses?.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() === index
      }) || []
      
      const totalAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      
      return {
        month,
        amount: totalAmount,
        monthIndex: index
      }
    })
  }, [allExpenses])

  const categoryChartData = useMemo(() => {
    if (!allExpenses) return []
    
    const categoryTotals = allExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      category: categoryLabels[category as keyof typeof categoryLabels] || category,
      amount: amount,
      fill: colors[index % colors.length]
    }))
  }, [allExpenses, colors])



  // Only show skeleton loading for initial data fetch, not for currency conversions
  const isInitialLoading = recentLoading || todayLoading || allLoading || preferencesLoading || monthlyIncomeLoading || yearlyIncomeLoading
  const isConverting = isConvertingToday || isConvertingWeekly || isConvertingMonthly || isConvertingYearly || isConvertingIncome || isConvertingYearlyIncome || isConvertingSalary || isConvertingYearlySalary
  const hasError = recentError || todayError || allError

  // Calculate number of visible summary cards for grid layout
  const visibleSummaryCards = 3 + (totalMonthlyIncome > 0 ? 2 : 0) // Today + Monthly Expenses + This Week + (Monthly Income + Remaining Balance if income exists)
  
  // Responsive grid classes that adapt to screen size
  const getResponsiveGridCols = () => {
    // Mobile: 1 column, Tablet: 2 columns, Desktop: 3-5 columns based on content
    if (visibleSummaryCards <= 2) {
      return "grid-cols-2"
    } else if (visibleSummaryCards === 3) {
      return "grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
    } else if (visibleSummaryCards === 4) {
      return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    } else if (visibleSummaryCards === 5) {
      return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    }
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" // fallback
  }

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className={`grid gap-4 ${getResponsiveGridCols()}`}>
          {Array.from({ length: visibleSummaryCards }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Monthly & Yearly Overview Skeleton */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-36 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                  <Skeleton className="h-3 w-24 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="w-3 h-3 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-muted-foreground">Please log in to view your expenses.</p>
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your daily expenses and spending patterns
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConverting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              Updating...
            </div>
          )}
          <AddExpenseDialog />
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid gap-4 ${getResponsiveGridCols()}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConvertingToday ? <Skeleton className="h-8 w-20" /> : formatCurrency(convertedTodayTotal, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayExpenses?.length || 0} transactions today
            </p>
          </CardContent>
        </Card>

        {totalMonthlyIncome > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <Wallet className="h-4 w-4" style={{ color: colors[0] }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: colors[0] }}>
                {formatCurrency(totalMonthlyIncome, currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                {convertedSalary > 0 ? 'Salary + Other' : 'Other income only'}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <CreditCard className="h-4 w-4" style={{ color: colors[5] }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: colors[5] }}>
              {isConvertingMonthly ? <Skeleton className="h-8 w-20" /> : formatCurrency(convertedMonthlyTotal, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyExpenses.length} transactions this month
            </p>
          </CardContent>
        </Card>

        {totalMonthlyIncome > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
              {remainingBalance >= 0 ? (
                <TrendingUp className="h-4 w-4" style={{ color: colors[0] }} />
              ) : (
                <TrendingDown className="h-4 w-4" style={{ color: colors[5] }} />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: remainingBalance >= 0 ? colors[0] : colors[5] }}>
                {formatCurrency(remainingBalance, currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                {remainingBalance >= 0 ? 'You have extra!' : 'Over budget'}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="col-span-2 lg:col-span-4 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConvertingWeekly ? <Skeleton className="h-8 w-20" /> : formatCurrency(convertedWeeklyTotal, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {weeklyExpenses.length} transactions this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly & Yearly Overview */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
        {totalMonthlyIncome > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Overview - {new Date().toLocaleDateString('en-US', { month: 'long' })}</CardTitle>
              <CardDescription>
                Monthly financial performance summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" style={{ color: colors[0] }} />
                    <span className="text-sm font-medium">Monthly Income</span>
                  </div>
                  <span className="text-lg font-bold" style={{ color: colors[0] }}>
                    {isConvertingIncome || isConvertingSalary ? <Skeleton className="h-6 w-16" /> : formatCurrency(totalMonthlyIncome, currency)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" style={{ color: colors[5] }} />
                    <span className="text-sm font-medium">Monthly Expenses</span>
                  </div>
                  <span className="text-lg font-bold" style={{ color: colors[5] }}>
                    {isConvertingMonthly ? <Skeleton className="h-6 w-16" /> : formatCurrency(convertedMonthlyTotal, currency)}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {remainingBalance >= 0 ? (
                        <TrendingUp className="h-4 w-4" style={{ color: colors[0] }} />
                      ) : (
                        <TrendingDown className="h-4 w-4" style={{ color: colors[5] }} />
                      )}
                      <span className="font-medium">Monthly Balance</span>
                    </div>
                    <span className="text-xl font-bold" style={{ color: remainingBalance >= 0 ? colors[0] : colors[5] }}>
                      {isConvertingMonthly || isConvertingIncome || isConvertingSalary ? <Skeleton className="h-7 w-20" /> : formatCurrency(remainingBalance, currency)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Avg: {isConvertingMonthly ? 
                      <Skeleton className="h-3 w-12 inline-block" /> : 
                      `${formatCurrency(convertedMonthlyTotal / new Date().getDate(), currency)}/day`
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {totalYearlyIncome > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Yearly Overview - {currentYear}</CardTitle>
            <CardDescription>
              Yearly financial performance summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" style={{ color: colors[0] }} />
                  <span className="text-sm font-medium">Yearly Income</span>
                </div>
                <span className="text-lg font-bold" style={{ color: colors[0] }}>
                  {isConvertingYearlyIncome || isConvertingYearlySalary ? <Skeleton className="h-6 w-16" /> : formatCurrency(totalYearlyIncome, currency)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" style={{ color: colors[5] }} />
                  <span className="text-sm font-medium">Yearly Expenses</span>
                </div>
                <span className="text-lg font-bold" style={{ color: colors[5] }}>
                  {isConvertingYearly ? <Skeleton className="h-6 w-16" /> : formatCurrency(convertedYearlyTotal, currency)}
                </span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {yearlyRemainingBalance >= 0 ? (
                      <TrendingUp className="h-4 w-4" style={{ color: colors[0] }} />
                    ) : (
                      <TrendingDown className="h-4 w-4" style={{ color: colors[5] }} />
                    )}
                    <span className="font-medium">Yearly Balance</span>
                  </div>
                  <span className="text-xl font-bold" style={{ color: yearlyRemainingBalance >= 0 ? colors[0] : colors[5] }}>
                    {isConvertingYearly || isConvertingYearlyIncome || isConvertingYearlySalary ? <Skeleton className="h-7 w-20" /> : formatCurrency(yearlyRemainingBalance, currency)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Avg: {isConvertingYearly || isConvertingYearlyIncome || isConvertingYearlySalary ? 
                    <Skeleton className="h-3 w-12 inline-block" /> : 
                    formatCurrency(yearlyRemainingBalance / 12, currency)}/month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Spending Trend</CardTitle>
            <CardDescription>
              Daily spending for the current week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isMounted ? (
              <div className="h-[250px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={weeklyChartData}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 20,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke={colors[0]}
                      fill={colors[0]}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Spending</CardTitle>
            <CardDescription>
              Total spending by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isMounted ? (
              <div className="h-[250px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryChartData}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 20,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fillOpacity={1} radius={4}>
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Yearly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Yearly Spending Trend - {currentYear}</CardTitle>
          <CardDescription>
            Monthly spending for {currentYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isMounted ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={yearlyChartData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={colors[5]}
                    fill={colors[5]}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Breakdown</CardTitle>
            <CardDescription>
              Expenses by category for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryTotals).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium capitalize">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    {isConvertingToday ? <Skeleton className="h-4 w-16" /> : formatCurrency(amount as number, currency)}
                  </span>
                </div>
              ))}
              {Object.keys(categoryTotals).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No expenses recorded today
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Latest expense entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExpenses?.map((expense, index) => (
                <div key={expense.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {categoryLabels[expense.category as keyof typeof categoryLabels]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {expense.description || 'No description'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-bold">
                    {isConvertingExpenses ? <Skeleton className="h-4 w-16" /> : formatCurrency(convertedExpenseAmounts[index] || expense.amount, currency)}
                  </span>
                </div>
              ))}
              {(!recentExpenses || recentExpenses.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent transactions
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
