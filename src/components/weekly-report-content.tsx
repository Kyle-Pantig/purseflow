'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, TrendingUp, TrendingDown, DollarSign, BarChart3, Target } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCurrency } from '@/contexts/currency-context'
import { useCurrencyAmountsWithCurrency } from '@/hooks/use-currency-amount'
import { isThisWeek } from '@/lib/date-utils'
import { formatCurrency } from '@/lib/currency'
import { useColor } from '@/contexts/color-context'
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { subWeeks, format, startOfWeek, endOfWeek } from 'date-fns'
import { getCategoryLabel } from '@/lib/categories'

// Colors will be generated from user's color preferences

export function WeeklyReportContent() {
  const [displayLimit, setDisplayLimit] = useState(8)
  const { currency } = useCurrency()
  const { colors } = useColor()

  // Get all expenses
  const { data: allExpenses, isLoading: allLoading, error: allError } = trpc.expense.getAllExpenses.useQuery()

  // Prepare data for currency conversion
  const allExpensesForConversion = allExpenses?.map((expense: { amount: number; currency_code?: string }) => ({
    amount: expense.amount,
    currency_code: expense.currency_code || 'PHP'
  })) || []

  const { convertedAmounts: allConvertedAmounts, isLoading: isConvertingAll } = useCurrencyAmountsWithCurrency(allExpensesForConversion)

  // Calculate weekly spending for the last 12 weeks
  const weeklySpendingData = useMemo(() => {
    if (!allExpenses || !allConvertedAmounts) return []
    
    const today = new Date()
    
    // Manually create the last 12 weeks to ensure we get the correct range
    const weeks = []
    for (let i = 11; i >= 0; i--) {
      const weekDate = subWeeks(today, i)
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 }) // Monday
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 }) // Sunday
      weeks.push({ weekDate, weekStart, weekEnd })
    }


    return weeks.map(({ weekDate, weekStart, weekEnd }) => {
      const weekExpenses = allExpenses.filter((expense: { date: string }) => {
        const expenseDate = new Date(expense.date)
        // Use local timezone comparison
        const expenseDateOnly = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate())
        const weekStartOnly = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
        const weekEndOnly = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate())
        return expenseDateOnly >= weekStartOnly && expenseDateOnly <= weekEndOnly
      })

      // Find the corresponding converted amounts for this week's expenses
      const weekExpenseIndices = weekExpenses.map((expense: { id: string }) => 
        allExpenses.findIndex((e: { id: string }) => e.id === expense.id)
      )

      const weekConvertedAmounts = weekExpenseIndices
        .filter(index => index !== -1 && allConvertedAmounts[index])
        .map(index => allConvertedAmounts[index])

      const totalAmount = weekConvertedAmounts.reduce((sum: number, amount: number) => sum + amount, 0)

      
      const categoryTotals = weekExpenses.reduce((acc: Record<string, number>, expense: { category: string; id: string }) => {
        const convertedAmount = allConvertedAmounts[allExpenses.findIndex((e: { id: string }) => e.id === expense.id)] || 0
        acc[expense.category] = (acc[expense.category] || 0) + convertedAmount
        return acc
      }, {} as Record<string, number>)

      const topCategory = Object.entries(categoryTotals).reduce((max: { category: string; amount: number }, [category, amount]) => 
        (amount as number) > max.amount ? { category, amount: amount as number } : max
      , { category: 'None', amount: 0 })
      
      return {
        week: format(weekDate, 'MMM dd'),
        weekStart: format(weekStart, 'MMM dd'),
        weekEnd: format(weekEnd, 'MMM dd'),
        amount: totalAmount,
        count: weekExpenses.length,
        topCategory: getCategoryLabel(topCategory.category),
        topCategoryAmount: topCategory.amount
      }
    })
  }, [allExpenses, allConvertedAmounts])


  // Calculate weekly category breakdown for the current week
  const currentWeekCategoryData = useMemo(() => {
    if (!allExpenses || !allConvertedAmounts) return []
    
    
    const currentWeekExpenses = allExpenses.filter((expense: { date: string }) => {
      return isThisWeek(expense.date)
    })

    const categoryTotals = currentWeekExpenses.reduce((acc: Record<string, number>, expense: { category: string; id: string }) => {
      const convertedAmount = allConvertedAmounts[allExpenses.findIndex((e: { id: string }) => e.id === expense.id)] || 0
      acc[expense.category] = (acc[expense.category] || 0) + convertedAmount
      return acc
    }, {} as Record<string, number>)

    const totalAmount = Object.values(categoryTotals).reduce((sum: number, amount: unknown) => sum + (amount as number), 0)

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      category: getCategoryLabel(category),
      amount: amount,
      percentage: totalAmount > 0 ? (((amount as number) / totalAmount) * 100).toFixed(1) : 0,
      fill: colors[index % colors.length]
    }))
  }, [allExpenses, allConvertedAmounts, colors])

  // Calculate average weekly spending
  const averageWeeklySpending = useMemo(() => {
    if (weeklySpendingData.length === 0) return 0
    const total = weeklySpendingData.reduce((sum, week) => sum + week.amount, 0)
    return total / weeklySpendingData.length
  }, [weeklySpendingData])

  // Calculate monthly trend (comparing current month vs previous month)
  const spendingTrend = useMemo(() => {
    if (!allExpenses || !allConvertedAmounts) return 0
    
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    // Get expenses for current month
    const currentMonthExpenses = allExpenses.filter((expense: { date: string }) => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    
    // Get expenses for previous month
    const previousMonthExpenses = allExpenses.filter((expense: { date: string }) => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === previousMonth && expenseDate.getFullYear() === previousYear
    })
    
    // Calculate totals using converted amounts
    const currentMonthTotal = currentMonthExpenses.reduce((sum: number, expense: { id: string }) => {
      const expenseIndex = allExpenses.findIndex((e: { id: string }) => e.id === expense.id)
      return sum + (allConvertedAmounts[expenseIndex] || 0)
    }, 0)
    
    const previousMonthTotal = previousMonthExpenses.reduce((sum: number, expense: { id: string }) => {
      const expenseIndex = allExpenses.findIndex((e: { id: string }) => e.id === expense.id)
      return sum + (allConvertedAmounts[expenseIndex] || 0)
    }, 0)
    
    if (previousMonthTotal === 0) return 0
    return ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
  }, [allExpenses, allConvertedAmounts])

  // Calculate best and worst weeks
  const bestWeek = useMemo(() => {
    if (weeklySpendingData.length === 0) return null
    return weeklySpendingData.reduce((max, week) => 
      week.amount > max.amount ? week : max
    )
  }, [weeklySpendingData])


  // Filter and limit weekly spending data for display
  const displayedWeeklyData = useMemo(() => {
    return weeklySpendingData.slice(-displayLimit).reverse()
  }, [weeklySpendingData, displayLimit])

  const hasMoreWeeks = weeklySpendingData.length > displayLimit

  const loadMoreWeeks = () => {
    setDisplayLimit(prev => Math.min(prev + 8, weeklySpendingData.length))
  }

  const isLoading = allLoading || isConvertingAll
  const hasError = allError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        {/* Summary Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="border-b">
                  <div className="grid grid-cols-5 gap-4 p-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b last:border-b-0">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-muted-foreground">Failed to load weekly report data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Report</h1>
          <p className="text-muted-foreground">
            Weekly spending analysis and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Last 12 weeks
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(weeklySpendingData[weeklySpendingData.length - 1]?.amount || 0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {weeklySpendingData[weeklySpendingData.length - 1]?.count || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Weekly</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageWeeklySpending, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 12 weeks average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
            {spendingTrend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {spendingTrend >= 0 ? '+' : ''}{spendingTrend.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs previous month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Week</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bestWeek ? formatCurrency(bestWeek.amount, currency) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {bestWeek ? `${bestWeek.weekStart} - ${bestWeek.weekEnd}` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>12-Week Spending Trend</CardTitle>
            <CardDescription>
              Weekly spending over the last 12 weeks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklySpendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value) => [
                        <div key="tooltip">
                          <div>{formatCurrency(Number(value), currency)}</div>
                        </div>
                      ]}
                      labelFormatter={(label) => `${label}`}
                    />} 
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke={colors[0]}
                    strokeWidth={2}
                    dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Week&apos;s Category Breakdown</CardTitle>
            <CardDescription>
              Spending distribution by category this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value, name) => [
                        <div key="tooltip">
                          <div>{name}</div>
                          <div>{formatCurrency(Number(value), currency)}</div>
                        </div>
                      ]}
                      labelFormatter={(label) => `${label}`}
                    />} 
                  />
                  <Pie 
                    data={currentWeekCategoryData} 
                    dataKey="amount" 
                    nameKey="category"
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80}
                    label={({ category, percentage }) => `${category} (${percentage}%)`}
                  >
                    {currentWeekCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Spending Table */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Spending Details</CardTitle>
          <CardDescription>
            Detailed breakdown of weekly spending for the last 12 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Top Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedWeeklyData.map((week) => {
                  const maxAmount = Math.max(...weeklySpendingData.map(w => w.amount))
                  const percentage = maxAmount > 0 ? (week.amount / maxAmount) * 100 : 0
                  
                  return (
                    <TableRow key={week.weekStart}>
                      <TableCell className="font-medium">
                        {week.weekStart} - {week.weekEnd}
                      </TableCell>
                      <TableCell>{week.count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {week.topCategory}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(week.amount, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress 
                            value={Math.min(percentage, 100)} 
                            className="w-16 h-2"
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            
            {hasMoreWeeks && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMoreWeeks}
                  className="w-full max-w-xs"
                >
                  Load More Weeks ({weeklySpendingData.length - displayLimit} remaining)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
