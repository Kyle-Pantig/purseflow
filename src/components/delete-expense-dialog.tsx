'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { formatCurrency } from '@/lib/currency'
import { formatTimestampForDisplay } from '@/lib/date-utils'
import { getCategoryLabel } from '@/lib/categories'
import { useCurrency } from '@/contexts/currency-context'

interface DeleteExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: {
    id: string
    amount: number
    category: string
    description?: string
    date: string
    currency_code?: string
  } | null
  onSuccess?: () => void
}

export function DeleteExpenseDialog({ open, onOpenChange, expense, onSuccess }: DeleteExpenseDialogProps) {
  const utils = trpc.useUtils()
  const { currency } = useCurrency()
  
  const deleteExpense = trpc.expense.deleteExpense.useMutation({
    onSuccess: async () => {
      // Invalidate all expense-related queries to refresh all components
      await Promise.all([
        utils.expense.getRecentExpenses.invalidate(),
        utils.expense.getAllExpenses.invalidate(),
        utils.expense.getTodayExpenses.invalidate()
      ])
      
      onOpenChange(false)
      onSuccess?.()
    },
  })

  const handleDelete = () => {
    if (expense?.id) {
      deleteExpense.mutate({ id: expense.id })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle>Delete Expense</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete this expense? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {expense && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Category:</span>
                <span className="text-sm">{getCategoryLabel(expense.category)}</span>
              </div>
              
              {expense.description && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Description:</span>
                  <span className="text-sm">{expense.description}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Date:</span>
                <span className="text-sm">{formatTimestampForDisplay(expense.date)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm font-bold">
                  {formatCurrency(expense.amount, currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={deleteExpense.isPending}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteExpense.isPending}
            className="flex items-center gap-2"
          >
            {deleteExpense.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleteExpense.isPending ? 'Deleting...' : 'Delete Expense'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
