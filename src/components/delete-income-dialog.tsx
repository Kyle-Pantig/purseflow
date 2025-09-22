'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { formatDateForDisplay, formatTimestampForDisplay } from '@/lib/date-utils'

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

interface DeleteIncomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  income: Income | null
  onSuccess?: () => void
}

export function DeleteIncomeDialog({ open, onOpenChange, income, onSuccess }: DeleteIncomeDialogProps) {
  const utils = trpc.useUtils()
  
  const deleteIncome = trpc.income.deleteIncome.useMutation({
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

  const handleDelete = () => {
    if (income?.id) {
      deleteIncome.mutate({ id: income.id })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle>Delete Income Entry</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete this income entry? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {income && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Type:</span>
                <span className="capitalize">{income.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Amount:</span>
                <span>{income.amount} {income.currency_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <div className="text-right">
                  <div>{formatTimestampForDisplay(income.date)}</div>
                </div>
              </div>
              {income.description && (
                <div className="flex justify-between">
                  <span className="font-medium">Description:</span>
                  <span className="text-sm text-muted-foreground">{income.description}</span>
                </div>
              )}
              {income.is_recurring && (
                <div className="flex justify-between">
                  <span className="font-medium">Recurring:</span>
                  <span className="text-sm text-muted-foreground capitalize">{income.recurring_frequency}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={deleteIncome.isPending}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteIncome.isPending}
            className="flex items-center gap-2"
          >
            {deleteIncome.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleteIncome.isPending ? 'Deleting...' : 'Delete Income'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
