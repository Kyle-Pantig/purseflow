'use client'

import { useMemo, useCallback } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PieChart, BarChart3, TrendingUp, TrendingDown, Target, Award } from 'lucide-react'
import { useCurrency } from '@/contexts/currency-context'
import { useCurrencyAmountsWithCurrency } from '@/hooks/use-currency-amount'
import { formatCurrency } from '@/lib/currency'
import { useColor } from '@/contexts/color-context'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { subMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { getCategoryLabel, getCategoriesFromData } from '@/lib/categories'

// Category colors will be generated from user's color preferences

export function CategoryAnalysisContent() {
  const { currency } = useCurrency()
  const { colors } = useColor()

  // Generate category colors from user's color preferences
  const getCategoryColor = useCallback((category: string, index: number = 0) => {
    return colors[index % colors.length]
  }, [colors])

  // Get all expenses
  const { data: allExpenses, isLoading: allLoading, error: allError } = trpc.expense.getAllExpenses.useQuery()

  // Prepare data for currency conversion
  const allExpensesForConversion = allExpenses?.map((expense: { amount: number; currency_code?: string }) => ({
    amount: expense.amount,
    currency_code: expense.currency_code || 'PHP'
  })) || []

  const { convertedAmounts: allConvertedAmounts, isLoading: isConvertingAll } = useCurrencyAmountsWithCurrency(allExpensesForConversion)

  // Calculate category totals using converted amounts
  const categoryTotals = useMemo(() => {
    if (!allExpenses || !allConvertedAmounts) return {}
    
    return allExpenses.reduce((acc: Record<string, number>, expense: { category: string }, index: number) => {
      const convertedAmount = allConvertedAmounts[index] || 0
      acc[expense.category] = (acc[expense.category] || 0) + convertedAmount
      return acc
    }, {} as Record<string, number>)
  }, [allExpenses, allConvertedAmounts])

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    if (!allExpenses) return {}
    
    return allExpenses.reduce((acc: Record<string, number>, expense: { category: string }) => {
      acc[expense.category] = (acc[expense.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [allExpenses])

  // Prepare category data for charts
  const categoryData = useMemo(() => {
    const totalAmount = (Object.values(categoryTotals) as number[]).reduce((sum: number, amount: number) => sum + amount, 0)
    
    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      category: getCategoryLabel(category),
      categoryKey: category,
      amount: amount as number,
      count: categoryCounts[category] || 0,
      percentage: totalAmount > 0 ? (((amount as number) / totalAmount) * 100).toFixed(1) : 0,
      fill: getCategoryColor(category, index)
    })).sort((a, b) => b.amount - a.amount)
  }, [categoryTotals, categoryCounts, getCategoryColor])

  // Calculate monthly category trends for the last 6 months
  const monthlyCategoryTrends = useMemo(() => {
    if (!allExpenses) return []
    
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    })

    // Get all unique categories from the data
    const allCategories = getCategoriesFromData(allExpenses)

    return last6Months.map(month => {
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

      const monthCategoryTotals = monthExpenses.reduce((acc: Record<string, number>, expense: { category: string; id: string }) => {
        const expenseIndex = allExpenses.findIndex((e: { id: string }) => e.id === expense.id)
        const convertedAmount = allConvertedAmounts[expenseIndex] || 0
        acc[expense.category] = (acc[expense.category] || 0) + convertedAmount
        return acc
      }, {} as Record<string, number>)

      const monthData: Record<string, string | number> = {
        month: format(month, 'MMM yyyy'),
        monthShort: format(month, 'MMM')
      }

      // Add each category's amount for this month (including all categories found in data)
      allCategories.forEach(category => {
        monthData[category] = monthCategoryTotals[category] || 0
      })

      return monthData
    })
  }, [allExpenses, allConvertedAmounts])

  // Calculate category growth rates
  const categoryGrowthRates = useMemo(() => {
    if (monthlyCategoryTrends.length < 2 || !allExpenses) return {}
    
    const currentMonth = monthlyCategoryTrends[monthlyCategoryTrends.length - 1]
    const previousMonth = monthlyCategoryTrends[monthlyCategoryTrends.length - 2]
    
    const growthRates: Record<string, number> = {}
    
    // Get all unique categories from the data
    const allCategories = getCategoriesFromData(allExpenses)
    
    allCategories.forEach(category => {
      const current = (currentMonth[category] as number) || 0
      const previous = (previousMonth[category] as number) || 0
      
      if (previous === 0) {
        growthRates[category] = current > 0 ? 100 : 0
      } else {
        growthRates[category] = ((current - previous) / previous) * 100
      }
    })
    
    return growthRates
  }, [monthlyCategoryTrends, allExpenses])

  // Calculate top performing categories
  const topCategories = useMemo(() => {
    return categoryData.slice(0, 3)
  }, [categoryData])

  // Calculate average spending per transaction by category
  const categoryAverages = useMemo(() => {
    return categoryData.map((cat: { amount: number; count: number; category: string; categoryKey: string; percentage: string | number; fill: string }) => ({
      ...cat,
      averagePerTransaction: cat.count > 0 ? (cat.amount as number) / cat.count : 0
    }))
  }, [categoryData])

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

        {/* Monthly Trends Chart Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>

        {/* Category Details Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="border-b">
                  <div className="grid grid-cols-7 gap-4 p-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-7 gap-4 p-4 border-b last:border-b-0">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
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
          <p className="text-muted-foreground">Failed to load category analysis data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Category Analysis</h1>
          <p className="text-muted-foreground">
            Detailed analysis of spending by category
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            All time analysis
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryData.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active spending categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topCategories[0]?.category || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {topCategories[0] ? `${topCategories[0].percentage}% of total` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryData.reduce((max: { count: number; category: string }, cat: { count: number; category: string }) => cat.count > max.count ? cat : max, { count: 0, category: '' }).category || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryData.reduce((max: { count: number }, cat: { count: number }) => cat.count > max.count ? cat : max, { count: 0 }).count || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Average</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryAverages.reduce((max: { averagePerTransaction: number; category: string }, cat: { averagePerTransaction: number; category: string }) => cat.averagePerTransaction > max.averagePerTransaction ? cat : max, { averagePerTransaction: 0, category: '' }).category || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(categoryAverages.reduce((max: { averagePerTransaction: number }, cat: { averagePerTransaction: number }) => cat.averagePerTransaction > max.averagePerTransaction ? cat : max, { averagePerTransaction: 0 }).averagePerTransaction, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>
              Spending breakdown by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
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
                    data={categoryData} 
                    dataKey="amount" 
                    nameKey="category"
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80}
                    label={({ category, percentage }) => `${category} (${percentage}%)`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Spending Comparison</CardTitle>
            <CardDescription>
              Amount spent by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
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
                  <Bar dataKey="amount" radius={4}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Category Trends */}
      <Card>
        <CardHeader>
          <CardTitle>6-Month Category Trends</CardTitle>
          <CardDescription>
            Monthly spending trends by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCategoryTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthShort" />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value, name) => [
                      <div key="tooltip">
                        <div>{name}: {formatCurrency(Number(value), currency)}</div>
                      </div>
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />} 
                />
                {getCategoriesFromData(allExpenses || []).map((category, index) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={getCategoryColor(category, index)}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Category Details
          </CardTitle>
          <CardDescription>
            Comprehensive breakdown of all spending categories with detailed metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Category</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-center">Transactions</TableHead>
                  <TableHead className="text-center">Percentage</TableHead>
                  <TableHead className="text-center">Avg per Transaction</TableHead>
                  <TableHead className="text-center">Growth Rate</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryData.map((category) => {
                  const growthRate = categoryGrowthRates[category.categoryKey] || 0
                  const averagePerTransaction = category.count > 0 ? (category.amount as number) / category.count : 0
                  
                  return (
                    <TableRow key={category.categoryKey}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: category.fill }}
                          />
                          <div>
                            <div className="font-medium">{category.category}</div>
                            <div className="text-sm text-muted-foreground">
                              {category.categoryKey}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold">
                          {formatCurrency(category.amount as number, currency)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-medium">
                          {category.count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-medium">
                          {category.percentage}%
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {formatCurrency(averagePerTransaction, currency)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {growthRate !== 0 ? (
                          <Badge 
                            variant={growthRate > 0 ? "destructive" : "secondary"}
                            className="flex items-center gap-1 w-fit mx-auto"
                          >
                            {growthRate > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(growthRate).toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Progress 
                            value={parseFloat(category.percentage as string)} 
                            className="w-20 h-2"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
