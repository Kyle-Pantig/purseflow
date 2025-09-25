'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Settings, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrency } from '@/contexts/currency-context'
import { useCurrencyAmountWithCurrency } from '@/hooks/use-currency-amount'
import { toast } from 'sonner'
import { toLocalTimestampString } from '@/lib/date-utils'
import { formatCurrency } from '@/lib/currency'

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

// Component for individual preset button with currency conversion
function PresetButton({ preset, onQuickAdd, isAdding }: { 
  preset: any, 
  onQuickAdd: (id: string, description: string) => void, 
  isAdding: string | null 
}) {
  const { currency } = useCurrency()
  const { convertedAmount, isLoading: isConverting } = useCurrencyAmountWithCurrency(
    preset.amount,
    preset.currency_code
  )

  return (
    <Button
      variant="outline"
      className={`h-16 w-16 sm:h-20 sm:w-20 p-1.5 sm:p-2 justify-center flex-col rounded-full relative touch-manipulation cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
        isAdding === preset.id ? 'ring-2 ring-primary ring-offset-2 shadow-lg' : ''
      }`}
      onClick={() => onQuickAdd(preset.id, preset.description || 'Quick expense')}
      disabled={isConverting}
    >
      <div className="text-center space-y-0.5">
        <div className="font-bold text-[10px] sm:text-xs leading-none">
          {isConverting ? '...' : formatCurrency(convertedAmount, currency)}
        </div>
        {preset.description && (
          <div className="text-[8px] sm:text-[10px] text-muted-foreground leading-none truncate max-w-[50px] sm:max-w-[60px]">
            {preset.description}
          </div>
        )}
        <div className="text-[8px] sm:text-[10px] text-primary font-medium leading-none">
          {categories.find(c => c.value === preset.category)?.label}
        </div>
      </div>
      {/* Mirror effect overlay */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
    </Button>
  )
}

export function QuickAddExpenses({ 
  showLoading = true, 
  presets: externalPresets 
}: { 
  showLoading?: boolean
  presets?: any[]
} = {}) {
  const [isAdding, setIsAdding] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: ''
  })
  const { currency } = useCurrency()
  const utils = trpc.useUtils()
  const router = useRouter()

  // Use external presets if provided, otherwise fetch them
  const { data: fetchedPresets, isLoading } = trpc.quickAmounts.getAll.useQuery(undefined, {
    enabled: !externalPresets // Only fetch if no external presets provided
  })
  
  const presets = externalPresets || fetchedPresets
  const quickAddMutation = trpc.quickAmounts.quickAdd.useMutation()
  const createMutation = trpc.quickAmounts.create.useMutation()

  const handleQuickAdd = async (presetId: string, presetDescription: string) => {
    setIsAdding(presetId)
    
    try {
      // Create a date with current time to preserve the exact moment of adding
      const now = new Date()
      
      await quickAddMutation.mutateAsync({
        presetId,
        date: toLocalTimestampString(now),
      })
      
      toast.success(`Added expense: ${presetDescription}`)
      utils.expense.getAllExpenses.invalidate()
      utils.expense.getTodayExpenses.invalidate()
      utils.expense.getRecentExpenses.invalidate()
    } catch (error) {
      toast.error('Failed to add expense')
    } finally {
      setIsAdding(null)
    }
  }

  const handleManagePresets = () => {
    router.push('/profile')
  }

  const resetForm = () => {
    setFormData({
      description: '',
      category: '',
      amount: ''
    })
  }

  const handleCreatePreset = async () => {
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
      setIsAddDialogOpen(false)
      resetForm()
      utils.quickAmounts.getAll.invalidate()
    } catch (error) {
      toast.error('Failed to create preset')
    }
  }

  if (isLoading && showLoading && !externalPresets) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Add Expenses
              </CardTitle>
              <CardDescription>
                Click on a preset to instantly add an expense with the stored amount
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 sm:h-20 sm:w-20 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // If loading but not showing loading state, show empty state
  if (isLoading && !showLoading && !externalPresets) {
    return (
      <Card className='mb-0'>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Add Expenses
              </CardTitle>
              <CardDescription className="mt-1">
                Click on a preset to instantly add an expense with the stored amount
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={resetForm}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
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
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={createMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreatePreset}
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleManagePresets}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Settings className="h-4 w-4" />
                Manage Presets
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm mb-2">Loading presets...</p>
            <p className="text-xs">Quick amount presets will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!presets || presets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Add Expenses
          </CardTitle>
          <CardDescription>
            Create quick amount presets to enable quick adding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm mb-2">No quick amount presets available</p>
            <p className="text-xs mb-4">Create presets to enable quick expense adding</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManagePresets}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Manage Presets
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='mb-0'>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Add Expenses
            </CardTitle>
            <CardDescription className="mt-1">
              Click on a preset to instantly add an expense with the stored amount
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={resetForm}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
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
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={createMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePreset}
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleManagePresets}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Settings className="h-4 w-4" />
              Manage Presets
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
          {presets.map((preset) => (
            <PresetButton
              key={preset.id}
              preset={preset}
              onQuickAdd={handleQuickAdd}
              isAdding={isAdding}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
