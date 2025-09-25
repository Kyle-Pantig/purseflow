'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { formatCurrency } from '@/lib/currency'
import { useCurrency } from '@/contexts/currency-context'

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

interface DeleteQuickAmountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preset: {
    id: string
    amount: number
    category: string
    description?: string
    currency_code: string
  } | null
  onSuccess?: () => void
}

export function DeleteQuickAmountDialog({ open, onOpenChange, preset, onSuccess }: DeleteQuickAmountDialogProps) {
  const utils = trpc.useUtils()
  const { currency } = useCurrency()
  
  const deletePreset = trpc.quickAmounts.delete.useMutation({
    onSuccess: async () => {
      await utils.quickAmounts.getAll.invalidate()
      onOpenChange(false)
      onSuccess?.()
    },
  })

  const handleDelete = () => {
    if (preset?.id) {
      deletePreset.mutate({ id: preset.id })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle>Delete Quick Amount Preset</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete this preset? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {preset && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Category:</span>
                <span className="text-sm">{categories.find(c => c.value === preset.category)?.label}</span>
              </div>
              
              {preset.description && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Description:</span>
                  <span className="text-sm">{preset.description}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm font-bold">
                  {preset.currency_code} {preset.amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={deletePreset.isPending}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deletePreset.isPending}
            className="flex items-center gap-2"
          >
            {deletePreset.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deletePreset.isPending ? 'Deleting...' : 'Delete Preset'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
