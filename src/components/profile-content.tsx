'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useCurrency } from '@/contexts/currency-context'
import { useColor } from '@/contexts/color-context'
import { useCurrencyAmountWithCurrency, useCurrencyAmountsWithCurrency } from '@/hooks/use-currency-amount'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  User, 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  Wallet,
  CreditCard,
  Repeat,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Receipt
} from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { formatCurrency } from '@/lib/currency'
import { AddIncomeDialog } from '@/components/add-income-dialog'
import { IncomeList } from '@/components/income-list'
import { RecurringIncomeManager } from '@/components/recurring-income-manager'
import { ResetDataDialog } from '@/components/reset-data-dialog'
import { QuickAmountsTable } from '@/components/quick-amounts-table'
import { updatePassword } from '@/lib/auth'
import { toast } from 'sonner'

export function ProfileContent() {
  const { user } = useAuth()
  const { currency } = useCurrency()
  const { colors } = useColor()
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false)
  const [editingSalary, setEditingSalary] = useState(false)
  const [salaryValue, setSalaryValue] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const { data: preferences, isLoading: preferencesLoading } = trpc.user.getPreferences.useQuery(
    undefined,
    {
      enabled: !!user, // Only run query if user is authenticated
      retry: false, // Don't retry on 401 errors
    }
  )
  const { data: allIncomeData, isLoading: incomeLoading } = trpc.income.getAllIncome.useQuery()
  const { data: monthlyIncome, isLoading: monthlyIncomeLoading } = trpc.income.getMonthlyIncome.useQuery({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })
  const { data: recurringStatus, isLoading: recurringLoading } = trpc.income.getRecurringIncomeStatus.useQuery()
  const { data: quickAmounts, isLoading: quickAmountsLoading } = trpc.quickAmounts.getAll.useQuery()

  // Combined loading state for all profile data
  const isProfileLoading = preferencesLoading || incomeLoading || monthlyIncomeLoading || recurringLoading || quickAmountsLoading

  const utils = trpc.useUtils()
  
  const updatePreferences = trpc.user.updatePreferences.useMutation({
    onSuccess: () => {
      // Invalidate user preferences and income queries
      utils.user.getPreferences.invalidate()
      utils.income.getMonthlyIncome.invalidate()
      
      setEditingSalary(false)
      setSalaryValue('')
    }
  })

  // Convert salary from stored currency to display currency
  const { convertedAmount: convertedSalary } = useCurrencyAmountWithCurrency(
    preferences?.monthlySalary || 0, 
    preferences?.currencyCode || 'PHP'
  )

  // Convert income amounts from their stored currencies to display currency
  const incomeData = useMemo(() => 
    monthlyIncome?.map(income => ({ 
      amount: income.amount, 
      currency_code: income.currency_code || 'PHP' 
    })) || [], 
    [monthlyIncome]
  )

  const { convertedAmounts: convertedIncomeAmounts } = useCurrencyAmountsWithCurrency(incomeData || [])

  const formatAmount = (amount: number) => formatCurrency(amount, currency)

  const handleSalaryUpdate = () => {
    const salary = parseFloat(salaryValue)
    if (!isNaN(salary) && salary >= 0) {
      updatePreferences.mutate({ monthlySalary: salary })
    }
  }

  const handleEditSalary = () => {
    setSalaryValue(preferences?.monthlySalary?.toString() || '0')
    setEditingSalary(true)
  }

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast.error('Please enter your current password')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long')
      return
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password')
      return
    }

    setIsUpdatingPassword(true)

    try {
      // First verify current password by attempting to sign in
      const { signIn } = await import('@/lib/auth')
      const { error: signInError } = await signIn(user?.email || '', currentPassword)
      
      if (signInError) {
        toast.error('Current password is incorrect')
        return
      }

      // If current password is correct, update to new password
      const { error } = await updatePassword(newPassword)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password updated successfully!')
        setIsChangingPassword(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  // Calculate totals using converted amounts
  const totalMonthlyIncome = convertedIncomeAmounts.length > 0 ? convertedIncomeAmounts.reduce((sum, amount) => sum + amount, 0) : 0
  const salaryAmount = convertedSalary
  const otherIncome = totalMonthlyIncome - salaryAmount

  if (isProfileLoading) {
    return (
      <div className="w-full space-y-6">
        {/* User Information & Change Password Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
              <CardDescription>
                Your account details and profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-6 w-48 rounded" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-64 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password for better security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-64 rounded" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-32 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Salary Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Monthly Salary
            </CardTitle>
            <CardDescription>
              Set your monthly salary for income tracking and budget calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-32 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
              <Skeleton className="h-10 w-20 rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Income Overview Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Income Overview
            </CardTitle>
            <CardDescription>
              Your income breakdown for this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                  <Skeleton className="h-8 w-24 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recurring Income Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Recurring Income
            </CardTitle>
            <CardDescription>
              Manage your recurring income sources and generate new entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="text-center py-8">
                <Skeleton className="h-12 w-12 mx-auto mb-4 rounded" />
                <Skeleton className="h-6 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Management Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Income Management
            </CardTitle>
            <CardDescription>
              Track additional income sources beyond your salary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
              <Separator />
              <div className="text-center py-8">
                <Skeleton className="h-12 w-12 mx-auto mb-4 rounded" />
                <Skeleton className="h-6 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Amount Presets Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Quick Amount Presets
            </CardTitle>
            <CardDescription>
              Create presets for quick expense adding with specific amounts and categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Skeleton className="h-5 w-40 mb-1" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="rounded-md border">
                <div className="p-4">
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* User Information & Change Password */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>
              Your account details and profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-lg font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                <p className="text-sm font-mono text-muted-foreground">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password for better security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isChangingPassword ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="pr-10"
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handlePasswordChange}
                      disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                    >
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelPasswordChange}
                      disabled={isUpdatingPassword}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Password was last updated when you created your account
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setIsChangingPassword(true)} variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Salary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Monthly Salary
          </CardTitle>
          <CardDescription>
            Set your monthly salary for income tracking and budget calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {editingSalary ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="salary">Monthly Salary ({currency.symbol})</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={salaryValue}
                    onChange={(e) => setSalaryValue(e.target.value)}
                    placeholder="Enter monthly salary"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSalaryUpdate}
                    disabled={updatePreferences.isPending}
                  >
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingSalary(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {formatAmount(convertedSalary)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Monthly salary amount
                  </p>
                </div>
                <Button onClick={handleEditSalary} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Income Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Income Overview
          </CardTitle>
          <CardDescription>
            Your income breakdown for this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Wallet className="h-8 w-8" style={{ color: colors[0] }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: colors[0] }}>
                {formatAmount(totalMonthlyIncome)}
              </p>
              <p className="text-sm text-muted-foreground">Total Income</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="h-8 w-8" style={{ color: colors[5] }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: colors[5] }}>
                {formatAmount(salaryAmount)}
              </p>
              <p className="text-sm text-muted-foreground">Salary</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Plus className="h-8 w-8" style={{ color: colors[0] }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: colors[0] }}>
                {formatAmount(otherIncome)}
              </p>
              <p className="text-sm text-muted-foreground">Other Income</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recurring Income Management */}
      <RecurringIncomeManager 
        recurringStatus={recurringStatus}
        refetch={() => {
          utils.income.getRecurringIncomeStatus.invalidate()
          utils.income.getAllIncome.invalidate()
          utils.income.getMonthlyIncome.invalidate()
        }}
      />

      {/* Income Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Income Management
          </CardTitle>
          <CardDescription>
            Track additional income sources beyond your salary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Income Sources</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your additional income entries
                </p>
              </div>
              <Button onClick={() => setIsAddIncomeOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </div>
            
            <Separator />
            
            <IncomeList 
              incomeData={allIncomeData}
              refetch={() => {
                utils.income.getAllIncome.invalidate()
                utils.income.getMonthlyIncome.invalidate()
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Amount Presets */}
      <QuickAmountsTable presets={quickAmounts} />

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Reset Data</h4>
                <p className="text-sm text-muted-foreground">
                  Delete all your expenses, income, and settings. You can also reset data for specific time periods.
                </p>
              </div>
              <ResetDataDialog>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Data
                </Button>
              </ResetDataDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddIncomeDialog 
        open={isAddIncomeOpen} 
        onOpenChange={setIsAddIncomeOpen} 
      />
    </div>
  )
}
