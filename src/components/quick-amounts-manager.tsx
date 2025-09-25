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
import { DeleteQuickAmountDialog } from './delete-quick-amount-dialog'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrency } from '@/contexts/currency-context'
import { toast } from 'sonner'

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

export function QuickAmountsManager() {
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

  const { data: presets, isLoading } = trpc.quickAmounts.getAll.useQuery()
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

  if (isLoading) {
    return <div>Loading quick amount presets...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quick Amount Presets</h3>
          <p className="text-sm text-muted-foreground">
            Create presets for quick expense adding with specific amounts and categories
          </p>
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

      {presets && presets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <Card key={preset.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{categories.find(c => c.value === preset.category)?.label}</Badge>
                      <span className="text-sm text-muted-foreground">{preset.currency_code}</span>
                    </div>
                    <CardTitle className="text-base">{currency.symbol}{preset.amount.toFixed(2)}</CardTitle>
                    {preset.description && (
                      <CardDescription className="mt-1">
                        {preset.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(preset)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(preset)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No quick amount presets yet</p>
          <p className="text-sm">Create your first preset to get started</p>
        </div>
      )}

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
    </div>
  )
}
