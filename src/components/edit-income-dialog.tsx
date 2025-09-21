'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useCurrency } from '@/contexts/currency-context'
import { trpc } from '@/lib/trpc-client'

const incomeTypes = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Investment' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'other', label: 'Other' },
]

const recurringFrequencies = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'mid_month', label: 'Mid-month' },
  { value: 'end_month', label: 'End-month' },
  { value: 'yearly', label: 'Yearly' },
]

interface Income {
  id: string
  amount: number
  type: string
  description?: string
  date: string
  currency_code?: string
  is_recurring?: boolean
  recurring_frequency?: string
}

interface EditIncomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  income: Income | null
  onSuccess?: () => void
}

export function EditIncomeDialog({ open, onOpenChange, income, onSuccess }: EditIncomeDialogProps) {
  const { currency } = useCurrency()
  const [formData, setFormData] = useState({
    amount: '',
    type: '',
    description: '',
    date: '',
    is_recurring: false,
    recurring_frequency: '',
  })

  const utils = trpc.useUtils()
  
  const updateIncome = trpc.income.updateIncome.useMutation({
    onSuccess: async () => {
      // Invalidate all income-related queries to refresh all components
      await Promise.all([
        utils.income.getMonthlyIncome.invalidate(),
        utils.income.getIncomeByDate.invalidate(),
        utils.income.getAllIncome.invalidate(),
        utils.income.getRecurringIncomeStatus.invalidate()
      ])
      
      onOpenChange(false)
      onSuccess?.()
    },
  })

  useEffect(() => {
    if (income) {
      setFormData({
        amount: income.amount?.toString() || '',
        type: income.type || '',
        description: income.description || '',
        date: income.date || '',
        is_recurring: income.is_recurring || false,
        recurring_frequency: income.recurring_frequency || '',
      })
    }
  }, [income])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!income?.id) return

    // Validate that recurring frequency is provided when is_recurring is true
    if (formData.is_recurring && !formData.recurring_frequency) {
      alert('Recurring frequency is required when recurring income is selected')
      return
    }

    updateIncome.mutate({
      id: income.id,
      amount: parseFloat(formData.amount),
      type: formData.type as 'salary' | 'freelance' | 'investment' | 'bonus' | 'other',
      description: formData.description,
      date: formData.date,
      is_recurring: formData.is_recurring,
      recurring_frequency: formData.recurring_frequency as 'monthly' | 'mid_month' | 'end_month' | 'yearly' | undefined,
    })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData({
        amount: '',
        type: '',
        description: '',
        date: '',
        is_recurring: false,
        recurring_frequency: '',
      })
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Income</DialogTitle>
          <DialogDescription>
            Update your income entry details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currency.symbol})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Income Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {incomeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked: boolean) => 
                  setFormData(prev => ({ ...prev, is_recurring: checked }))
                }
              />
              <Label htmlFor="recurring">Recurring income</Label>
            </div>

            {formData.is_recurring && (
              <div className="space-y-2">
                <Label htmlFor="frequency">Recurring Frequency *</Label>
                <Select
                  value={formData.recurring_frequency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, recurring_frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {recurringFrequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateIncome.isPending || !formData.amount || !formData.type || !formData.date}
            >
              {updateIncome.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
