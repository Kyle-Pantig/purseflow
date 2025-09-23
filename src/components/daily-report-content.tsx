'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCurrency } from '@/contexts/currency-context'
import { useColor } from '@/contexts/color-context'
import { isToday, timestampToLocalDateString, getDayBounds } from '@/lib/date-utils'
import { useCurrencyAmountsWithCurrency } from '@/hooks/use-currency-amount'
import { formatCurrency } from '@/lib/currency'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { subDays, format, eachDayOfInterval } from 'date-fns'
import { getCategoryLabel } from '@/lib/categories'

export function DailyReportContent() {
  const [displayLimit, setDisplayLimit] = useState(10)
  const { currency } = useCurrency()
  const { colors } = useColor()

  // Get expenses for the last 30 days
  const { data: allExpenses, isLoading: allLoading, error: allError } = trpc.expense.getAllExpenses.useQuery()
  
  // Get today's expenses
  const today = useMemo(() => new Date(), [])
  const { data: allExpensesForToday, isLoading: todayLoading, error: todayError } = trpc.expense.getTodayExpenses.useQuery()
  
  // Filter today's expenses using date-utils for proper timezone handling
  const todayExpenses = useMemo(() => {
    if (!allExpensesForToday) return []
    
    return allExpensesForToday.filter(expense => {
      const expenseDateString = timestampToLocalDateString(expense.date)
      return isToday(expenseDateString)
    })
  }, [allExpensesForToday])

  // Prepare data for currency conversion
  const allExpensesForConversion = allExpenses?.map((expense: { amount: number; currency_code?: string }) => ({
    amount: expense.amount,
    currency_code: expense.currency_code || 'PHP'
  })) || []

  const todayExpensesForConversion = todayExpenses?.map((expense: { amount: number; currency_code?: string }) => ({
    amount: expense.amount,
    currency_code: expense.currency_code || 'PHP'
  })) || []

  const { convertedAmounts: allConvertedAmounts, isLoading: isConvertingAll } = useCurrencyAmountsWithCurrency(allExpensesForConversion)
  const { convertedAmounts: todayConvertedAmounts, isLoading: isConvertingToday } = useCurrencyAmountsWithCurrency(todayExpensesForConversion)

  // Calculate daily spending for the last 30 days
  const dailySpendingData = useMemo(() => {
    if (!allExpenses || !allConvertedAmounts) return []
    
    const last30Days = eachDayOfInterval({
      start: subDays(today, 29),
      end: today
    })

    return last30Days.map((day) => {
      // Use local timezone day bounds instead of UTC
      const { start: dayStart, end: dayEnd } = getDayBounds(day)
      
      const dayExpenses = allExpenses.filter((expense: { date: string }) => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= dayStart && expenseDate <= dayEnd
      })

      // Find the corresponding converted amounts for this day's expenses
      const dayExpenseIndices = dayExpenses.map((expense: { id: string }) => 
        allExpenses.findIndex((e: { id: string }) => e.id === expense.id)
      )

      const dayConvertedAmounts = dayExpenseIndices
        .filter(index => index !== -1 && allConvertedAmounts[index])
        .map(index => allConvertedAmounts[index])

      const totalAmount = dayConvertedAmounts.reduce((sum: number, amount: number) => sum + amount, 0)
      
      return {
        date: format(day, 'MMM dd'),
        fullDate: format(day, 'yyyy-MM-dd'),
        amount: totalAmount,
        count: dayExpenses.length
      }
    })
  }, [allExpenses, allConvertedAmounts, today])

  // Calculate today's category breakdown
  const todayCategoryData = useMemo(() => {
    if (!todayExpenses || !todayConvertedAmounts) return []
    
    const categoryTotals = todayExpenses.reduce((acc: Record<string, number>, expense: { category: string }, index: number) => {
      const convertedAmount = todayConvertedAmounts[index] || 0
      acc[expense.category] = (acc[expense.category] || 0) + convertedAmount
      return acc
    }, {} as Record<string, number>)

    const totalAmount = (Object.values(categoryTotals) as number[]).reduce((sum: number, amount: number) => sum + amount, 0)

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      category: getCategoryLabel(category),
      amount: amount as number,
      percentage: totalAmount > 0 ? (((amount as number) / totalAmount) * 100).toFixed(1) : 0,
      fill: colors[index % colors.length]
    }))
  }, [todayExpenses, todayConvertedAmounts, colors])

  // Calculate average daily spending
  const averageDailySpending = useMemo(() => {
    if (dailySpendingData.length === 0) return 0
    const total = dailySpendingData.reduce((sum: number, day: { amount: number }) => sum + day.amount, 0)
    return total / dailySpendingData.length
  }, [dailySpendingData])

  // Calculate spending trends
  const spendingTrend = useMemo(() => {
    if (dailySpendingData.length < 7) return 0
    
    const last7Days = dailySpendingData.slice(-7)
    const previous7Days = dailySpendingData.slice(-14, -7)
    
    const last7Total = last7Days.reduce((sum: number, day: { amount: number }) => sum + day.amount, 0)
    const previous7Total = previous7Days.reduce((sum: number, day: { amount: number }) => sum + day.amount, 0)
    
    if (previous7Total === 0) return 0
    return ((last7Total - previous7Total) / previous7Total) * 100
  }, [dailySpendingData])

  // Filter and limit daily spending data for display
  const displayedDailyData = useMemo(() => {
    return dailySpendingData.slice(-displayLimit).reverse()
  }, [dailySpendingData, displayLimit])

  const hasMoreDays = dailySpendingData.length > displayLimit

  const loadMoreDays = () => {
    setDisplayLimit(prev => Math.min(prev + 10, dailySpendingData.length))
  }

  const isLoading = allLoading || todayLoading || isConvertingAll || isConvertingToday
  const hasError = allError || todayError

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
                  <div className="grid grid-cols-4 gap-4 p-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-8" />
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
          <p className="text-muted-foreground">Failed to load daily report data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Report</h1>
          <p className="text-muted-foreground">
            Daily spending analysis and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(today, 'MMMM dd, yyyy')}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConvertingToday ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                 formatCurrency(todayConvertedAmounts.reduce((sum: number, amount: number) => sum + amount, 0), currency)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayExpenses?.length || 0} transactions today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Daily</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageDailySpending, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Trend</CardTitle>
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
              vs previous week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailySpendingData.length > 0 ? dailySpendingData.reduce((max, day) => 
                day.amount > max.amount ? day : max
              ).date : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Highest spending day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>30-Day Spending Trend</CardTitle>
            <CardDescription>
              Daily spending over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySpendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Category Breakdown</CardTitle>
            <CardDescription>
              Spending distribution by category today
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
                    data={todayCategoryData} 
                    dataKey="amount" 
                    nameKey="category"
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80}
                    label={({ category, percentage }) => `${category} (${percentage}%)`}
                  >
                    {todayCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Spending Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Spending Details</CardTitle>
          <CardDescription>
            Detailed breakdown of daily spending for the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedDailyData.map((day) => {
                  const maxAmount = Math.max(...dailySpendingData.map(d => d.amount))
                  const percentage = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0
                  
                  return (
                    <TableRow key={day.fullDate}>
                      <TableCell className="font-medium">{day.date}</TableCell>
                      <TableCell>{day.count}</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(day.amount, currency)}
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
            
            {hasMoreDays && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMoreDays}
                  className="w-full max-w-xs"
                >
                  Load More Days ({dailySpendingData.length - displayLimit} remaining)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
