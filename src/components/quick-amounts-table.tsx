'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Receipt } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCurrency } from '@/contexts/currency-context'
import { useCurrencyAmountWithCurrency } from '@/hooks/use-currency-amount'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'
import { DeleteQuickAmountDialog } from './delete-quick-amount-dialog'

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

// Component for table row with currency conversion
function PresetTableRow({ preset, onEdit, onDelete }: { 
  preset: any, 
  onEdit: (preset: any) => void, 
  onDelete: (preset: any) => void 
}) {
  const { currency } = useCurrency()
  const { convertedAmount, isLoading: isConverting } = useCurrencyAmountWithCurrency(
    preset.amount,
    preset.currency_code
  )

  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline">
          {categories.find(c => c.value === preset.category)?.label}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">
        {isConverting ? '...' : formatCurrency(convertedAmount, currency)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {preset.description || '-'}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(preset)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(preset)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function QuickAmountsTable({ presets: externalPresets }: { presets?: any[] } = {}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<any>(null)
  const [deletingPreset, setDeletingPreset] = useState<any>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: ''
  })

  const { currency } = useCurrency()
  const utils = trpc.useUtils()

  // Use external presets if provided, otherwise fetch them
  const { data: fetchedPresets, isLoading } = trpc.quickAmounts.getAll.useQuery(undefined, {
    enabled: !externalPresets // Only fetch if no external presets provided
  })
  
  const presets = externalPresets || fetchedPresets
  const createMutation = trpc.quickAmounts.create.useMutation()
  const updateMutation = trpc.quickAmounts.update.useMutation()

  const resetForm = () => {
    setFormData({
      description: '',
      category: '',
      amount: ''
    })
    setEditingPreset(null)
  }

  const handleCreate = async () => {
    if (!formData.category || !formData.amount) {
      toast.error('Category and amount are required')
      return
    }

    try {
      await createMutation.mutateAsync({
        description: formData.description.trim() || undefined,
        category: formData.category as any,
        amount: parseFloat(formData.amount),
        currency_code: currency.code,
      })
      
      toast.success('Quick amount preset created successfully')
      setIsCreateOpen(false)
      resetForm()
      utils.quickAmounts.getAll.invalidate()
    } catch (error) {
      toast.error('Failed to create preset')
    }
  }

  const handleUpdate = async () => {
    if (!formData.category || !formData.amount || !editingPreset) {
      toast.error('Category and amount are required')
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: editingPreset.id,
        description: formData.description.trim() || undefined,
        category: formData.category as any,
        amount: parseFloat(formData.amount),
        currency_code: currency.code,
      })
      
      toast.success('Quick amount preset updated successfully')
      setEditingPreset(null)
      resetForm()
      utils.quickAmounts.getAll.invalidate()
    } catch (error) {
      toast.error('Failed to update preset')
    }
  }

  const handleDeleteClick = (preset: any) => {
    setDeletingPreset(preset)
    setIsDeleteOpen(true)
  }

  const handleEdit = (preset: any) => {
    setEditingPreset(preset)
    setFormData({
      description: preset.description || '',
      category: preset.category,
      amount: preset.amount.toString(),
    })
  }

  if (isLoading && !externalPresets) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Quick Amount Presets
          </CardTitle>
          <CardDescription>
            Loading your quick amount presets...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p>Loading presets...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Quick Amount Presets
            </CardTitle>
            <CardDescription>
              Create presets for quick expense adding with specific amounts and categories
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Preset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Quick Amount Preset</DialogTitle>
                <DialogDescription>
                  Create a preset for quick expense adding
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
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
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({currency.code}) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description for this preset"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {createMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : null}
                  {createMutation.isPending ? 'Creating...' : 'Create Preset'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {presets && presets.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presets.map((preset) => (
                  <PresetTableRow
                    key={preset.id}
                    preset={preset}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No quick amount presets yet</p>
            <p className="text-sm">Create your first preset to get started</p>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingPreset} onOpenChange={() => setEditingPreset(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Quick Amount Preset</DialogTitle>
            <DialogDescription>
              Update your quick amount preset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
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
            
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount ({currency.code}) *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Optional description for this preset"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingPreset(null)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              {updateMutation.isPending ? 'Updating...' : 'Update Preset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteQuickAmountDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        preset={deletingPreset}
        onSuccess={() => {
          setDeletingPreset(null)
          toast.success('Quick amount preset deleted successfully')
        }}
      />
    </Card>
  )
}
