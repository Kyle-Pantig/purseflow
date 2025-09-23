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
import { formatDateForDisplay, formatTimestampForDisplay } from '@/lib/date-utils'
import { useCurrencyAmountsWithCurrency } from '@/hooks/use-currency-amount'
import { AddExpenseDialog } from './add-expense-dialog'
import { DeleteExpenseDialog } from './delete-expense-dialog'
import { DatePicker } from './date-picker'
import { Search, Filter, Calendar, DollarSign, Edit2, Check, X, Trash2 } from 'lucide-react'
import { getCategoryLabel } from '@/lib/categories'

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

export function ExpensesContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [displayLimit, setDisplayLimit] = useState(10)
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date()
  })

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null)
  
  const { currency } = useCurrency()
  const { data: expenses, isLoading, error } = trpc.expense.getRecentExpenses.useQuery({ limit: 100 })
  const utils = trpc.useUtils()

  // Update expense mutation
  const updateExpenseMutation = trpc.expense.updateExpense.useMutation({
    onSuccess: () => {
      setEditingId(null)
      setEditForm({ amount: '', category: '', description: '', date: new Date() })
      utils.expense.getRecentExpenses.invalidate()
      utils.expense.getAllExpenses.invalidate()
      utils.expense.getTodayExpenses.invalidate()
    },
    onError: (error) => {
      console.error('Error updating expense:', error)
    }
  })

  // Delete expense function
  const handleDeleteClick = (expense: any) => {
    setExpenseToDelete(expense)
    setDeleteDialogOpen(true)
  }

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

  // Inline editing functions
  const startEdit = (expense: any) => {
    setEditingId(expense.id)
    setEditForm({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description || '',
      date: new Date(expense.date)
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ amount: '', category: '', description: '', date: new Date() })
  }

  const saveEdit = () => {
    if (!editingId) return

    const parsedAmount = parseFloat(editForm.amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    updateExpenseMutation.mutate({
      id: editingId,
      amount: parsedAmount,
      category: editForm.category as any,
      description: editForm.description || undefined,
      date: editForm.date.toISOString(),
    })
  }


  // Reset display limit when filters change
  React.useEffect(() => {
    setDisplayLimit(10)
  }, [searchTerm, selectedCategory, selectedDate])

  // Convert amounts for display (only for displayed expenses)
  const expenseData = React.useMemo(() => 
    filteredExpenses.map(expense => ({
      amount: expense.amount,
      currency_code: expense.currency_code || 'PHP'
    })), [filteredExpenses]
  )
  
  const { convertedAmounts, isLoading: isConverting } = useCurrencyAmountsWithCurrency(expenseData)

  // Create a map of expense ID to converted amount for reliable lookup
  const expenseAmountMap = React.useMemo(() => {
    const map = new Map()
    filteredExpenses.forEach((expense, index) => {
      // Use converted amount if available, otherwise fall back to original amount
      const convertedAmount = convertedAmounts && convertedAmounts[index] !== undefined 
        ? convertedAmounts[index] 
        : expense.amount
      map.set(expense.id, convertedAmount)
    })
    return map
  }, [filteredExpenses, convertedAmounts])

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
              {formatCurrency(totalAmount, currency)}
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
              {formatCurrency(totalExpenses > 0 ? totalAmount / totalExpenses : 0, currency)}
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
                    <TableHead className="text-right w-[120px]">Amount</TableHead>
                    <TableHead className="w-[120px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense, index) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {editingId === expense.id ? (
                          <Select
                            value={editForm.category}
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.slice(1).map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">
                            {getCategoryLabel(expense.category)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === expense.id ? (
                          <Input
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter description"
                            className="max-w-[200px]"
                          />
                        ) : (
                          <div className="max-w-[200px]">
                            <p className="text-sm font-medium truncate">
                              {expense.description || '-'}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === expense.id ? (
                          <DatePicker
                            value={editForm.date}
                            onChange={(date) => setEditForm(prev => ({ ...prev, date: date || new Date() }))}
                            placeholder="Select date"
                          />
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">
                              {formatTimestampForDisplay(expense.date)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right w-[120px] pr-6">
                        {editingId === expense.id ? (
                          <div className="flex justify-end">
                            <Input
                              type="number"
                              value={editForm.amount}
                              onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                              placeholder="0.00"
                              className="w-[100px] text-right"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <span className="text-sm font-bold">
                              {isConverting ? (
                                <Skeleton className="h-4 w-16" />
                              ) : (
                                formatCurrency(
                                  Number(expenseAmountMap.get(expense.id)) || expense.amount, 
                                  currency
                                )
                              )}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center pl-4">
                        {editingId === expense.id ? (
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={saveEdit}
                              disabled={updateExpenseMutation.isPending}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(expense)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClick(expense)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
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

      {/* Delete Confirmation Dialog */}
      <DeleteExpenseDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        expense={expenseToDelete}
        onSuccess={() => {
          setExpenseToDelete(null)
        }}
      />
    </div>
  )
}
