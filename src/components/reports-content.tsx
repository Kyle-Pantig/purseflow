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
      startDate: (startDate || range.start).toISOString().split('T')[0],
      endDate: (endDate || range.end).toISOString().split('T')[0],
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

  const handlePeriodChange = (newPeriod: 'week' | 'month') => {
    setPeriod(newPeriod)
    const range = getDateRange(newPeriod)
    setStartDate(range.start)
    setEndDate(range.end)
  }

  const categoryLabels = {
    transportation: 'Transportation',
    food: 'Food & Dining',
    bills: 'Bills & Utilities',
    entertainment: 'Entertainment',
    shopping: 'Shopping',
    healthcare: 'Healthcare',
    education: 'Education',
    travel: 'Travel',
    groceries: 'Groceries',
    utilities: 'Utilities',
    others: 'Others'
  }

  // Prepare data for currency conversion
  const expensesForConversion = reportData?.expenses?.map((expense: { amount: number; currency_code?: string }) => ({
    amount: expense.amount,
    currency_code: expense.currency_code || 'PHP'
  })) || []
  
  const { convertedAmounts: convertedAmounts, isLoading: isConverting } = useCurrencyAmountsWithCurrency(expensesForConversion)

  // Calculate converted totals
  const convertedTotal = useMemo(() => {
    if (!reportData?.expenses || !convertedAmounts) return 0
    return convertedAmounts.reduce((sum, amount) => sum + amount, 0)
  }, [reportData?.expenses, convertedAmounts])

  // Calculate converted category totals
  const convertedCategoryTotals = useMemo(() => {
    if (!reportData?.expenses || !convertedAmounts) return {}
    
    return reportData.expenses.reduce((acc: Record<string, number>, expense: { category: string }, index: number) => {
      const convertedAmount = convertedAmounts[index] || 0
      acc[expense.category] = (acc[expense.category] || 0) + convertedAmount
      return acc
    }, {} as Record<string, number>)
  }, [reportData?.expenses, convertedAmounts])

  // Calculate converted daily totals
  const convertedDailyTotals = useMemo(() => {
    if (!reportData?.expenses || !convertedAmounts) return []
    
    const dailyTotals: Record<string, number> = {}
    
    reportData.expenses.forEach((expense: { date: string }, index: number) => {
      const convertedAmount = convertedAmounts[index] || 0
      const date = expense.date
      dailyTotals[date] = (dailyTotals[date] || 0) + convertedAmount
    })
    
    return Object.entries(dailyTotals).map(([date, amount]) => ({
      date,
      amount,
    }))
  }, [reportData?.expenses, convertedAmounts])

  const pieData = convertedCategoryTotals ? Object.entries(convertedCategoryTotals).map(([category, amount], index) => ({
    category: categoryLabels[category as keyof typeof categoryLabels],
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
            <div className="flex gap-4 items-end">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-32" />
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
        <div>
          <h2 className="text-xl font-semibold mb-2">Specialized Reports</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose from detailed reports focused on specific time periods and analysis types.
          </p>
        </div>
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

      {/* Custom Date Range Analysis */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Custom Date Range Analysis</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Create custom reports for any date range to analyze specific periods or compare different timeframes.
          </p>
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
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[180px]">
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
              {reportData?.expenses?.length || 0}
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
                  <ChartTooltip content={<ChartTooltipContent />} />
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
                  <ChartTooltip content={<ChartTooltipContent />} />
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
                    const categoryCount = reportData?.expenses?.filter((expense: { category: string }) => expense.category === category).length || 0
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
                              {categoryLabels[category as keyof typeof categoryLabels] || category}
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
