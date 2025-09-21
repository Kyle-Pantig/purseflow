'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, Calendar, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { toast } from 'sonner'

interface ResetDataDialogProps {
  children: React.ReactNode
}

export function ResetDataDialog({ children }: ResetDataDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [resetType, setResetType] = useState<'everything' | 'time_period'>('everything')
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'year'>('month')
  const [selectedDate, setSelectedDate] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const utils = trpc.useUtils()

  const resetEverything = trpc.data.resetEverything.useMutation({
    onSuccess: () => {
      toast.success('All data has been reset successfully!')
      // Invalidate all queries to refresh the UI
      utils.invalidate()
      setIsOpen(false)
      setConfirmText('')
    },
    onError: (error) => {
      toast.error(`Failed to reset data: ${error.message}`)
    },
    onSettled: () => {
      setIsResetting(false)
    }
  })

  const resetByTimePeriod = trpc.data.resetByTimePeriod.useMutation({
    onSuccess: () => {
      toast.success(`Data for ${timePeriod} has been reset successfully!`)
      // Invalidate all queries to refresh the UI
      utils.invalidate()
      setIsOpen(false)
      setConfirmText('')
    },
    onError: (error) => {
      toast.error(`Failed to reset data: ${error.message}`)
    },
    onSettled: () => {
      setIsResetting(false)
    }
  })

  const handleReset = () => {
    if (confirmText !== 'RESET') {
      toast.error('Please type "RESET" to confirm')
      return
    }

    setIsResetting(true)

    if (resetType === 'everything') {
      resetEverything.mutate()
    } else {
      if (!selectedDate) {
        toast.error('Please select a date')
        setIsResetting(false)
        return
      }
      resetByTimePeriod.mutate({
        period: timePeriod,
        date: selectedDate
      })
    }
  }

  const getDateInputType = () => {
    switch (timePeriod) {
      case 'week':
        return 'week'
      case 'month':
        return 'month'
      case 'year':
        return 'number'
      default:
        return 'date'
    }
  }

  const getDatePlaceholder = () => {
    switch (timePeriod) {
      case 'week':
        return 'Select week (YYYY-WW format)'
      case 'month':
        return 'Select month (YYYY-MM format)'
      case 'year':
        return 'Enter year (YYYY format)'
      default:
        return 'Select date'
    }
  }

  const getDateValue = () => {
    if (timePeriod === 'year') {
      return selectedDate
    }
    return selectedDate
  }

  const handleDateChange = (value: string) => {
    if (timePeriod === 'year') {
      // Validate year format
      if (value.length <= 4 && /^\d*$/.test(value)) {
        setSelectedDate(value)
      }
    } else {
      setSelectedDate(value)
    }
  }

  const getCurrentDate = () => {
    const now = new Date()
    switch (timePeriod) {
      case 'week':
        const year = now.getFullYear()
        const week = getWeekNumber(now)
        return `${year}-W${week.toString().padStart(2, '0')}`
      case 'month':
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
      case 'year':
        return now.getFullYear().toString()
      default:
        return now.toISOString().split('T')[0]
    }
  }

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Reset Data
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete your data. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Reset Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">What would you like to reset?</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="everything"
                  checked={resetType === 'everything'}
                  onCheckedChange={() => setResetType('everything')}
                />
                <Label htmlFor="everything" className="text-sm font-normal">
                  Everything (All expenses, income, and settings)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="time_period"
                  checked={resetType === 'time_period'}
                  onCheckedChange={() => setResetType('time_period')}
                />
                <Label htmlFor="time_period" className="text-sm font-normal">
                  Specific time period
                </Label>
              </div>
            </div>
          </div>

          {/* Time Period Selection */}
          {resetType === 'time_period' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="time-period">Time Period</Label>
                <Select value={timePeriod} onValueChange={(value: 'week' | 'month' | 'year') => setTimePeriod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Select {timePeriod}</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <input
                    id="date"
                    type={getDateInputType()}
                    value={getDateValue()}
                    onChange={(e) => handleDateChange(e.target.value)}
                    placeholder={getDatePlaceholder()}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(getCurrentDate())}
                  >
                    Current
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation */}
          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <span className="font-mono font-bold">RESET</span> to confirm:
            </Label>
            <input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={isResetting || confirmText !== 'RESET'}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isResetting ? 'Resetting...' : 'Reset Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
