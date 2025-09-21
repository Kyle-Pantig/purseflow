'use client'

import React, { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/currency'
import { useCurrency } from '@/contexts/currency-context'
import { useCurrencyAmountsWithCurrency } from '@/hooks/use-currency-amount'
import { AddExpenseDialog } from './add-expense-dialog'
import { DatePicker } from './date-picker'
import { Search, Filter, Calendar, DollarSign } from 'lucide-react'

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'bills', label: 'Bills & Utilities' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'travel', label: 'Travel' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'others', label: 'Others' },
]

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

export function ExpensesContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [displayLimit, setDisplayLimit] = useState(10)
  
  const { currency } = useCurrency()
  const { data: expenses, isLoading, error } = trpc.expense.getRecentExpenses.useQuery({ limit: 100 })

  // Filter expenses based on search and category
  const allFilteredExpenses = expenses?.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory
    
    const matchesDate = !selectedDate || (() => {
      const expenseDate = new Date(expense.date)
      return expenseDate.toDateString() === selectedDate.toDateString()
    })()
    
    return matchesSearch && matchesCategory && matchesDate
  }) || []

  // Limit displayed expenses
  const filteredExpenses = allFilteredExpenses.slice(0, displayLimit)
  const hasMoreExpenses = allFilteredExpenses.length > displayLimit

  // Load more function
  const loadMore = () => {
    setDisplayLimit(prev => prev + 10)
  }

  // Reset display limit when filters change
  React.useEffect(() => {
    setDisplayLimit(10)
  }, [searchTerm, selectedCategory, selectedDate])

  // Convert amounts for display (only for displayed expenses)
  const expenseData = filteredExpenses.map(expense => ({
    amount: expense.amount,
    currency_code: expense.currency_code || 'PHP'
  }))
  const { convertedAmounts: convertedAmounts, isLoading: isConverting } = useCurrencyAmountsWithCurrency(expenseData)

  // Convert amounts for all filtered expenses for totals
  const allExpenseData = allFilteredExpenses.map(expense => ({
    amount: expense.amount,
    currency_code: expense.currency_code || 'PHP'
  }))
  const { convertedAmounts: allConvertedAmounts } = useCurrencyAmountsWithCurrency(allExpenseData)

  // Calculate totals (using all filtered expenses)
  const totalAmount = allConvertedAmounts.reduce((sum, amount) => sum + amount, 0)
  const totalExpenses = allFilteredExpenses.length

  // Group by category for summary (using all filtered expenses)
  const categoryTotals = allFilteredExpenses.reduce((acc, expense, index) => {
    const convertedAmount = allConvertedAmounts[index] || 0
    acc[expense.category] = (acc[expense.category] || 0) + convertedAmount
    return acc
  }, {} as Record<string, number>)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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

        {/* Filters Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-16 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="border-b">
                <div className="grid grid-cols-5 gap-4 p-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b last:border-b-0">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Expenses</h2>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            View and manage all your expenses
          </p>
        </div>
        <AddExpenseDialog />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConverting ? <Skeleton className="h-8 w-20" /> : formatCurrency(totalAmount, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalExpenses} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Expense</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConverting ? <Skeleton className="h-8 w-20" /> : formatCurrency(totalExpenses > 0 ? totalAmount / totalExpenses : 0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(categoryTotals).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter your expenses by category, date, or search term
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Select a date"
              />
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>
            Showing {filteredExpenses.length} of {totalExpenses} expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No expenses found matching your criteria.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or add a new expense.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense, index) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <Badge variant="secondary">
                          {categoryLabels[expense.category as keyof typeof categoryLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="text-sm font-medium truncate">
                            {expense.description || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-bold">
                          {isConverting ? (
                            <Skeleton className="h-4 w-16" />
                          ) : (
                            formatCurrency(Number(convertedAmounts[index]) || expense.amount, currency)
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {hasMoreExpenses && (
            <div className="flex justify-center mt-4">
              <Button onClick={loadMore} variant="outline">
                Load More ({totalExpenses - filteredExpenses.length} remaining)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
