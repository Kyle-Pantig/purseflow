'use client'

import { useMemo, useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart
} from 'recharts'
import { TrendingUp } from "lucide-react"
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from '@/lib/currency'
import { useCurrency } from '@/contexts/currency-context'
import { useCurrencyAmountsWithCurrency } from '@/hooks/use-currency-amount'
import { useColor } from '@/contexts/color-context'

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

// ChartRadarDots component
function ChartRadarDots({ 
  data, 
  colors
}: { 
  data: Array<{ category: string; amount: number; fill: string }>, 
  colors: string[]
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="items-center">
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>Distribution of expenses across categories</CardDescription>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="flex items-center justify-center h-80">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>
          Distribution of expenses across categories
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {!isMounted ? (
          <div className="h-[250px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <PolarAngleAxis dataKey="category" />
                <PolarGrid />
                <Radar
                  dataKey="amount"
                  fill={data[0]?.fill || colors[0]}
                  fillOpacity={0.6}
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Total spending across {data.length} categories <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 leading-none">
          Click on points to see details
        </div>
      </CardFooter>
    </Card>
  )
}

interface CategoryData {
  category: string
  amount: number
  count: number
  expenses: Array<{ id: string; amount: number; description?: string; date: string; currency_code?: string }>
}

export function CategoriesContent() {
  const { data: allExpenses, isLoading, error } = trpc.expense.getAllExpenses.useQuery()
  const { currency } = useCurrency()
  const { colors } = useColor()

  // Group expenses by category
  const categoryData = useMemo((): CategoryData[] => {
    if (!allExpenses) return []
    
    const grouped = allExpenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = {
          category: expense.category,
          amount: 0,
          count: 0,
          expenses: []
        }
      }
      acc[expense.category].amount += expense.amount
      acc[expense.category].count += 1
      acc[expense.category].expenses.push(expense)
      return acc
    }, {} as Record<string, CategoryData>)

    return (Object.values(grouped) as CategoryData[]).sort((a, b) => b.amount - a.amount)
  }, [allExpenses])

  // Convert amounts for display
  const categoryDataForConversion = useMemo(() => 
    categoryData.map(item => ({
      amount: item.amount,
      currency_code: item.expenses[0]?.currency_code || 'PHP'
    })) || [], 
    [categoryData]
  )
  
  const { convertedAmounts, isLoading: isConverting } = useCurrencyAmountsWithCurrency(categoryDataForConversion)

  // Calculate total amount
  const totalAmount = convertedAmounts.reduce((sum, amount) => sum + amount, 0)

  // Prepare data for charts
  const radarData = categoryData.map((item, index) => ({
    category: categoryLabels[item.category as keyof typeof categoryLabels] || item.category,
    amount: convertedAmounts[index] || 0,
    fill: colors[index % colors.length]
  }))

  // Create chart configuration

  const barData = categoryData.map((item, index) => ({
    category: categoryLabels[item.category as keyof typeof categoryLabels] || item.category,
    amount: convertedAmounts[index] || 0,
    count: item.count,
    fill: colors[index % colors.length]
  }))

  if (isLoading || isConverting) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-muted-foreground">Failed to load category data.</p>
        </div>
      </div>
    )
  }

  if (categoryData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            View your spending breakdown by category
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
              <p className="text-muted-foreground">Start adding expenses to see category breakdowns.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          View your spending breakdown by category
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAmount, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryData.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Different categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryData[0] ? categoryLabels[categoryData[0].category as keyof typeof categoryLabels] : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryData[0] ? formatCurrency(convertedAmounts[0] || 0, currency) : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartRadarDots 
          data={radarData} 
          colors={colors} 
        />

        <Card>
          <CardHeader>
            <CardTitle>Category Comparison</CardTitle>
            <CardDescription>
              Bar chart comparing spending amounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
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
                  <Bar dataKey="amount">
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>
            Detailed view of spending by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Transactions</TableHead>
                <TableHead className="text-center">Percentage</TableHead>
                <TableHead className="text-center">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryData.map((item, index) => {
                const convertedAmount = convertedAmounts[index] || 0
                const percentage = totalAmount > 0 ? (convertedAmount / totalAmount * 100) : 0
                
                return (
                  <TableRow key={item.category}>
                    <TableCell className="font-medium">
                      {categoryLabels[item.category as keyof typeof categoryLabels] || item.category}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(convertedAmount, currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {item.count} transaction{item.count !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {percentage.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Progress value={percentage} className="w-20 h-2" />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
