'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/date-picker'
import { Plus } from 'lucide-react'
import { parseCurrency } from '@/lib/currency'
import { useCurrency } from '@/contexts/currency-context'
import { toLocalTimestampString } from '@/lib/date-utils'

const categories = [
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

interface AddExpenseDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddExpenseDialog({ open: externalOpen, onOpenChange }: AddExpenseDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { currency } = useCurrency()
  const utils = trpc.useUtils()

  const addExpenseMutation = trpc.expense.addExpense.useMutation({
    onSuccess: async () => {
      // Reset form
      setAmount('')
      setCategory('')
      setDescription('')
      setDate(new Date())
      setOpen(false)
      setIsSubmitting(false)
      
      // Use optimistic updates to avoid loading states
      try {
        // Invalidate queries in the background without showing loading
        utils.expense.getAllExpenses.invalidate()
        utils.expense.getTodayExpenses.invalidate()
        utils.expense.getRecentExpenses.invalidate()
      } catch (refetchError) {
        console.error('Error invalidating queries:', refetchError)
      }
    },
    onError: (error) => {
      console.error('Error adding expense:', error)
      setIsSubmitting(false)
    }
  })

  const handleSubmit = () => {
    if (!amount || !category || !date) {
      return
    }

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      // Parse the amount from the input
      const parsedAmount = parseCurrency(amount)
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setIsSubmitting(false)
        return
      }
      
      addExpenseMutation.mutate({
        amount: parsedAmount,
        category: category as 'transportation' | 'food' | 'bills' | 'entertainment' | 'shopping' | 'healthcare' | 'education' | 'travel' | 'groceries' | 'utilities' | 'others',
        description: description || undefined,
        date: date ? toLocalTimestampString(date) : toLocalTimestampString(new Date()),
        currency_code: currency.code, // Store the currency the user entered
      })
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form when dialog closes
      setAmount('')
      setCategory('')
      setDescription('')
      setDate(new Date())
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!onOpenChange && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Record your daily expenses to track your spending
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currency.code}) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {currency.symbol}
                </span>
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  className="pl-8"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter expense description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder="Select date"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || !amount || !category || !date}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
