'use client'

import { useState, useMemo } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Calendar, BarChart3, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
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
import { formatCurrency } from '@/lib/currency'
import { useCurrencyAmountsWithCurrency } from '@/hooks/use-currency-amount'
import { DatePicker } from '@/components/date-picker'
import { getCategoryLabel } from '@/lib/categories'

export function ReportsContent() {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const { currency } = useCurrency()
  const { colors } = useColor()

  // Set default date range based on period
  const getDateRange = (period: 'week' | 'month') => {
    const now = new Date()
    const start = new Date(now)
    
    if (period === 'week') {
      start.setDate(now.getDate() - 7)
    } else {
      start.setMonth(now.getMonth() - 1)
    }
    
    // Set time to start/end of day for proper timestamp filtering
    start.setHours(0, 0, 0, 0)
    now.setHours(23, 59, 59, 999)
    
    return {
      start: start,
      end: now
    }
  }

  // Memoize query parameters to prevent unnecessary refetches
  const queryParams = useMemo(() => {
    const range = getDateRange(period)
    return {
      period,
      startDate: (startDate || range.start).toISOString(),
      endDate: (endDate || range.end).toISOString(),
    }
  }, [period, startDate, endDate])

  const { data: reportData, isLoading } = trpc.expense.getReport.useQuery(
    queryParams,
    {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    }
  )

  // Client-side filtering as backup to ensure proper date filtering
  const filteredExpenses = useMemo(() => {
    if (!reportData?.expenses) return []
    
    const range = getDateRange(period)
    const startTime = (startDate || range.start).getTime()
    const endTime = (endDate || range.end).getTime()
    
    return reportData.expenses.filter((expense: { date: string }) => {
      const expenseTime = new Date(expense.date).getTime()
      return expenseTime >= startTime && expenseTime <= endTime
    })
  }, [reportData?.expenses, period, startDate, endDate])

  const handlePeriodChange = (newPeriod: 'week' | 'month') => {
    setPeriod(newPeriod)
    const range = getDateRange(newPeriod)
    setStartDate(range.start)
    setEndDate(range.end)
  }

  // Category labels are now handled by the centralized categories system

  // Prepare data for currency conversion
  const expensesForConversion = filteredExpenses?.map((expense: { amount: number; currency_code?: string }) => ({
    amount: expense.amount,
    currency_code: expense.currency_code || 'PHP'
  })) || []
  
  const { convertedAmounts: convertedAmounts, isLoading: isConverting } = useCurrencyAmountsWithCurrency(expensesForConversion)

  // Calculate converted totals
  const convertedTotal = useMemo(() => {
    if (!filteredExpenses || !convertedAmounts) return 0
    return convertedAmounts.reduce((sum, amount) => sum + amount, 0)
  }, [filteredExpenses, convertedAmounts])

  // Calculate converted category totals
  const convertedCategoryTotals = useMemo(() => {
    if (!filteredExpenses || !convertedAmounts) return {}
    
    return filteredExpenses.reduce((acc: Record<string, number>, expense: { category: string }, index: number) => {
      const convertedAmount = convertedAmounts[index] || 0
      acc[expense.category] = (acc[expense.category] || 0) + convertedAmount
      return acc
    }, {} as Record<string, number>)
  }, [filteredExpenses, convertedAmounts])

  // Calculate converted daily totals
  const convertedDailyTotals = useMemo(() => {
    if (!filteredExpenses || !convertedAmounts) return []
    
    const dailyTotals: Record<string, number> = {}
    
    filteredExpenses.forEach((expense: { date: string }, index: number) => {
      const convertedAmount = convertedAmounts[index] || 0
      // Convert timestamp to local date string for proper grouping
      const expenseDate = new Date(expense.date)
      const dateString = expenseDate.getFullYear() + '-' + 
        String(expenseDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(expenseDate.getDate()).padStart(2, '0')
      dailyTotals[dateString] = (dailyTotals[dateString] || 0) + convertedAmount
    })
    
    return Object.entries(dailyTotals)
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date,
        amount,
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  }, [filteredExpenses, convertedAmounts])

  const pieData = convertedCategoryTotals ? Object.entries(convertedCategoryTotals).map(([category, amount], index) => ({
    category: getCategoryLabel(category),
    amount: amount,
    fill: colors[index % colors.length]
  })) : []

  const barData = convertedDailyTotals || []

  if (isLoading || isConverting) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Controls Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive analysis of your spending patterns and trends. Choose from specialized reports or create custom date range analysis.
        </p>
      </div>

      {/* Report Navigation */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/reports/daily">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Report</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Daily spending trends and breakdowns
              </p>
              <div className="flex items-center text-sm text-primary">
                View Report <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/weekly">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Report</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Weekly spending analysis and patterns
              </p>
              <div className="flex items-center text-sm text-primary">
                View Report <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/monthly">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Report</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Monthly spending insights and trends
              </p>
              <div className="flex items-center text-sm text-primary">
                View Report <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/category-analysis">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Category Analysis</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Detailed category breakdowns and trends
              </p>
              <div className="flex items-center text-sm text-primary">
                View Report <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
        </div>
      </div>


      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Settings</CardTitle>
          <CardDescription>
            Select the time period and date range for your report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker
                value={startDate || getDateRange(period).start}
                onChange={setStartDate}
                placeholder="Select start date"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <DatePicker
                value={endDate || getDateRange(period).end}
                onChange={setEndDate}
                placeholder="Select end date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(convertedTotal, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {period === 'week' ? 'Last 7 days' : 'Last 30 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Daily</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(convertedTotal ? (convertedTotal / (period === 'week' ? 7 : 30)) : 0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per day spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredExpenses?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>
              Breakdown of expenses by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
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
                    data={pieData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(props) => `${props.category} (${((props.percent as number) * 100).toFixed(1)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Spending Trend</CardTitle>
            <CardDescription>
              Daily expense amounts over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
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
                  <Bar dataKey="amount" fill={colors[0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>
            Detailed spending by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {convertedCategoryTotals && Object.keys(convertedCategoryTotals).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(convertedCategoryTotals)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .map(([category, amount]) => {
                    const categoryCount = filteredExpenses?.filter((expense: { category: string }) => expense.category === category).length || 0
                    const percentage = ((amount as number) / (convertedTotal || 1)) * 100
                    
                    return (
                      <TableRow key={category}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: colors[Object.keys(convertedCategoryTotals).indexOf(category) % colors.length] }}
                            />
                            <span className="font-medium">
                              {getCategoryLabel(category)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(amount as number, currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {categoryCount}
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No expenses found for the selected period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
