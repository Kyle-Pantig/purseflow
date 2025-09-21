'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useCurrency } from '@/contexts/currency-context'
import { trpc } from '@/lib/trpc-client'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const incomeSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  type: z.enum(['salary', 'freelance', 'investment', 'bonus', 'other']),
  description: z.string().optional(),
  date: z.date(),
  is_recurring: z.boolean(),
  recurring_frequency: z.enum(['monthly', 'mid_month', 'end_month', 'yearly']).optional(),
}).refine((data) => {
  // If is_recurring is true, recurring_frequency must be provided
  if (data.is_recurring && !data.recurring_frequency) {
    return false
  }
  return true
}, {
  message: "Recurring frequency is required",
  path: ["recurring_frequency"]
})

type IncomeFormData = z.infer<typeof incomeSchema>

interface AddIncomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

export function AddIncomeDialog({ open, onOpenChange }: AddIncomeDialogProps) {
  const { currency } = useCurrency()
  const [date, setDate] = useState<Date>(new Date())
  const [isRecurring, setIsRecurring] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    // watch,
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: new Date(),
      is_recurring: false,
    },
  })

  const utils = trpc.useUtils()
  
  const addIncome = trpc.income.addIncome.useMutation({
    onSuccess: async () => {
      // Invalidate all income-related queries to refresh all components
      await Promise.all([
        utils.income.getMonthlyIncome.invalidate(),
        utils.income.getIncomeByDate.invalidate(),
        utils.income.getAllIncome.invalidate(),
        utils.income.getRecurringIncomeStatus.invalidate()
      ])
      
      reset()
      setDate(new Date())
      setIsRecurring(false)
      onOpenChange(false)
    },
  })

  const onSubmit = (data: IncomeFormData) => {
    addIncome.mutate({
      amount: data.amount,
      type: data.type,
      description: data.description,
      date: data.date.toISOString().split('T')[0],
      is_recurring: data.is_recurring,
      recurring_frequency: data.recurring_frequency,
      currency_code: currency.code,
    })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset()
      setDate(new Date())
      setIsRecurring(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Income</DialogTitle>
          <DialogDescription>
            Add a new income entry to track your earnings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency.symbol})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Income Type</Label>
            <Select onValueChange={(value) => setValue('type', value as 'salary' | 'freelance' | 'investment' | 'bonus' | 'other')}>
              <SelectTrigger>
                <SelectValue placeholder="Select income type" />
              </SelectTrigger>
              <SelectContent>
                {incomeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDate(newDate)
                      setValue('date', newDate)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked: boolean) => {
                setIsRecurring(checked)
                setValue('is_recurring', checked)
              }}
            />
            <Label htmlFor="recurring">Recurring income</Label>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="frequency">Recurring Frequency *</Label>
              <Select onValueChange={(value) => setValue('recurring_frequency', value as 'monthly' | 'mid_month' | 'end_month' | 'yearly')}>
                <SelectTrigger className={errors.recurring_frequency ? 'border-red-500' : ''}>
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
              {errors.recurring_frequency && (
                <p className="text-sm text-red-500">{errors.recurring_frequency.message}</p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addIncome.isPending}>
              {addIncome.isPending ? 'Adding...' : 'Add Income'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
