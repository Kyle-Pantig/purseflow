'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, TrendingUp, TrendingDown, DollarSign, BarChart3, Award } from 'lucide-react'
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
import { isThisMonth, timestampToLocalDateString, getDayBounds } from '@/lib/date-utils'
import { formatCurrency } from '@/lib/currency'
import { useColor } from '@/contexts/color-context'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { subMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { getCategoryLabel } from '@/lib/categories'

// Colors will be generated from user's color preferences

export function MonthlyReportContent() {
  const [displayLimit, setDisplayLimit] = useState(6)
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

  // Calculate monthly spending for the last 12 months
  const monthlySpendingData = useMemo(() => {
    if (!allExpenses || !allConvertedAmounts) return []
    
    const last12Months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    })

    return last12Months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthExpenses = allExpenses.filter((expense: { date: string }) => {
        const expenseDate = new Date(expense.date)
        // Use local timezone comparison
        const expenseDateOnly = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate())
        const monthStartOnly = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate())
        const monthEndOnly = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate())
        return expenseDateOnly >= monthStartOnly && expenseDateOnly <= monthEndOnly
      })

      // Find the corresponding converted amounts for this month's expenses
      const monthExpenseIndices = monthExpenses.map((expense: { id: string }) => 
        allExpenses.findIndex((e: { id: string }) => e.id === expense.id)
      )

      const monthConvertedAmounts = monthExpenseIndices
        .filter(index => index !== -1 && allConvertedAmounts[index])
        .map(index => allConvertedAmounts[index])

      const totalAmount = monthConvertedAmounts.reduce((sum: number, amount: number) => sum + amount, 0)
      
      const categoryTotals = monthExpenses.reduce((acc: Record<string, number>, expense: { category: string; id: string }) => {
        const convertedAmount = allConvertedAmounts[allExpenses.findIndex((e: { id: string }) => e.id === expense.id)] || 0
        acc[expense.category] = (acc[expense.category] || 0) + convertedAmount
        return acc
      }, {} as Record<string, number>)

      const topCategory = Object.entries(categoryTotals).reduce((max: { category: string; amount: number }, [category, amount]) => 
        (amount as number) > max.amount ? { category, amount: amount as number } : max
      , { category: 'None', amount: 0 })

      const dailyAverage = totalAmount / new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
      
      return {
        month: format(month, 'MMM yyyy'),
        monthShort: format(month, 'MMM'),
        amount: totalAmount,
        count: monthExpenses.length,
        topCategory: getCategoryLabel(topCategory.category),
        topCategoryAmount: topCategory.amount,
        dailyAverage: dailyAverage
      }
    })
  }, [allExpenses, allConvertedAmounts])

  // Calculate monthly category breakdown for the current month
  const currentMonthCategoryData = useMemo(() => {
    if (!allExpenses || !allConvertedAmounts) return []
    
    const currentMonthStart = startOfMonth(new Date())
    const currentMonthEnd = endOfMonth(new Date())
    
    const currentMonthExpenses = allExpenses.filter((expense: { date: string }) => {
      return isThisMonth(expense.date)
    })

    const categoryTotals = currentMonthExpenses.reduce((acc: Record<string, number>, expense: { category: string; id: string }) => {
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

  // Calculate average monthly spending
  const averageMonthlySpending = useMemo(() => {
    if (monthlySpendingData.length === 0) return 0
    const total = monthlySpendingData.reduce((sum, month) => sum + month.amount, 0)
    return total / monthlySpendingData.length
  }, [monthlySpendingData])

  // Calculate spending trends
  const spendingTrend = useMemo(() => {
    if (monthlySpendingData.length < 3) return 0
    
    const last3Months = monthlySpendingData.slice(-3)
    const previous3Months = monthlySpendingData.slice(-6, -3)
    
    const last3Total = last3Months.reduce((sum, month) => sum + month.amount, 0)
    const previous3Total = previous3Months.reduce((sum, month) => sum + month.amount, 0)
    
    if (previous3Total === 0) return 0
    return ((last3Total - previous3Total) / previous3Total) * 100
  }, [monthlySpendingData])


  // Calculate year-to-date spending
  const yearToDateSpending = useMemo(() => {
    if (!allExpenses || !allConvertedAmounts) return 0
    
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear, 11, 31)
    
    const yearExpenses = allExpenses.filter((expense: { date: string }) => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= yearStart && expenseDate <= yearEnd
    })

    const yearExpenseIndices = yearExpenses.map((expense: { id: string }) => 
      allExpenses.findIndex((e: { id: string }) => e.id === expense.id)
    )

    const yearConvertedAmounts = yearExpenseIndices
      .filter(index => index !== -1 && allConvertedAmounts[index])
      .map(index => allConvertedAmounts[index])

    return yearConvertedAmounts.reduce((sum: number, amount: number) => sum + amount, 0)
  }, [allExpenses, allConvertedAmounts])

  // Filter and limit monthly spending data for display
  const displayedMonthlyData = useMemo(() => {
    return monthlySpendingData.slice(-displayLimit).reverse()
  }, [monthlySpendingData, displayLimit])

  const hasMoreMonths = monthlySpendingData.length > displayLimit

  const loadMoreMonths = () => {
    setDisplayLimit(prev => Math.min(prev + 6, monthlySpendingData.length))
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
                  <div className="grid grid-cols-6 gap-4 p-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
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
          <p className="text-muted-foreground">Failed to load monthly report data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Report</h1>
          <p className="text-muted-foreground">
            Monthly spending analysis and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Last 12 months
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlySpendingData[monthlySpendingData.length - 1]?.amount || 0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlySpendingData[monthlySpendingData.length - 1]?.count || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Monthly</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageMonthlySpending, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 12 months average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quarterly Trend</CardTitle>
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
              vs previous quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year to Date</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(yearToDateSpending, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().getFullYear()} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>12-Month Spending Trend</CardTitle>
            <CardDescription>
              Monthly spending over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySpendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthShort" />
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
            <CardTitle>This Month&apos;s Category Breakdown</CardTitle>
            <CardDescription>
              Spending distribution by category this month
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
                    data={currentMonthCategoryData} 
                    dataKey="amount" 
                    nameKey="category"
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80}
                    label={({ category, percentage }) => `${category} (${percentage}%)`}
                  >
                    {currentMonthCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Spending Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Details</CardTitle>
          <CardDescription>
            Detailed breakdown of monthly spending for the last 12 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Top Category</TableHead>
                  <TableHead>Daily Average</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedMonthlyData.map((month) => {
                  const maxAmount = Math.max(...monthlySpendingData.map(m => m.amount))
                  const percentage = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0
                  
                  return (
                    <TableRow key={month.month}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell>{month.count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {month.topCategory}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(month.dailyAverage, currency)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(month.amount, currency)}
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
            
            {hasMoreMonths && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMoreMonths}
                  className="w-full max-w-xs"
                >
                  Load More Months ({monthlySpendingData.length - displayLimit} remaining)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
