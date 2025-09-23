'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Trash2, Calendar, DollarSign, Repeat } from 'lucide-react'
import { EditIncomeDialog } from '@/components/edit-income-dialog'
import { DeleteIncomeDialog } from '@/components/delete-income-dialog'
import { trpc } from '@/lib/trpc-client'
import { formatCurrency } from '@/lib/currency'
import { useCurrency } from '@/contexts/currency-context'
import { formatTimestampForDisplay } from '@/lib/date-utils'
import { useCurrencyAmountsWithCurrency } from '@/hooks/use-currency-amount'

const incomeTypeLabels = {
  salary: 'Salary',
  freelance: 'Freelance',
  investment: 'Investment',
  bonus: 'Bonus',
  other: 'Other',
}

const incomeTypeColors = {
  salary: 'bg-blue-100 text-blue-800',
  freelance: 'bg-green-100 text-green-800',
  investment: 'bg-purple-100 text-purple-800',
  bonus: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
}

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

interface IncomeListProps {
  incomeData?: Income[]
  refetch?: () => void
}

export function IncomeList({ incomeData: propIncomeData, refetch: propRefetch }: IncomeListProps = {}) {
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null)
  const { currency } = useCurrency()
  const formatAmount = (amount: number) => formatCurrency(amount, currency)

  // Use prop data if provided, otherwise fetch from API
  const { data: fetchedIncomeData, refetch: fetchedRefetch } = trpc.income.getAllIncome.useQuery(undefined, {
    enabled: !propIncomeData // Only fetch if no prop data provided
  })
  
  const incomeData = propIncomeData || fetchedIncomeData
  const refetch = propRefetch || fetchedRefetch
  
  // Convert income amounts from their stored currencies to display currency
  const incomeDataForConversion = useMemo(() => 
    incomeData?.map(income => ({ 
      amount: income.amount, 
      currency_code: income.currency_code || 'PHP' 
    })) || [], 
    [incomeData]
  )

  const { convertedAmounts: convertedIncomeAmounts } = useCurrencyAmountsWithCurrency(incomeDataForConversion)
  
  const handleEdit = (income: Income) => {
    setEditingIncome(income)
  }

  const handleDelete = (income: Income) => {
    setDeletingIncome(income)
  }

  const handleEditSuccess = () => {
    refetch()
  }

  const handleDeleteSuccess = () => {
    refetch()
  }


  if (!incomeData || incomeData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No income entries yet</h3>
          <p className="text-muted-foreground text-center">
            Start tracking your income by adding your first entry.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Recurring</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incomeData.map((income, index) => (
              <TableRow key={income.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatTimestampForDisplay(income.date)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={incomeTypeColors[income.type as keyof typeof incomeTypeColors] || 'bg-gray-100 text-gray-800'}
                  >
                    {incomeTypeLabels[income.type as keyof typeof incomeTypeLabels] || income.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate">
                    {income.description || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatAmount(convertedIncomeAmounts[index] || income.amount)}
                </TableCell>
                <TableCell className="text-center">
                  {income.is_recurring ? (
                    <div className="flex items-center justify-center">
                      <Repeat className="h-4 w-4 text-green-600" />
                      <span className="ml-1 text-xs text-muted-foreground">
                        {income.recurring_frequency}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(income)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(income)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {incomeData.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Total entries: {incomeData.length}</span>
          <span>
            Total amount: {formatAmount(
              convertedIncomeAmounts.length > 0 ? convertedIncomeAmounts.reduce((sum, amount) => sum + amount, 0) : 0
            )}
          </span>
        </div>
      )}

      {/* Edit Dialog */}
      <EditIncomeDialog
        open={!!editingIncome}
        onOpenChange={(open) => !open && setEditingIncome(null)}
        income={editingIncome}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Dialog */}
      <DeleteIncomeDialog
        open={!!deletingIncome}
        onOpenChange={(open) => !open && setDeletingIncome(null)}
        income={deletingIncome}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  )
}
