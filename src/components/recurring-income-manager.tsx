'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Repeat, Clock } from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { formatCurrency } from '@/lib/currency'
import { useCurrency } from '@/contexts/currency-context'
import { useCurrencyAmountsWithCurrency } from '@/hooks/use-currency-amount'
import { format } from 'date-fns'

const frequencyLabels = {
  monthly: 'Monthly',
  mid_month: 'Mid-month',
  end_month: 'End-month',
  yearly: 'Yearly'
}

const frequencyColors = {
  monthly: 'bg-blue-100 text-blue-800',
  mid_month: 'bg-green-100 text-green-800',
  end_month: 'bg-orange-100 text-orange-800',
  yearly: 'bg-purple-100 text-purple-800'
}

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

interface RecurringIncome {
  id: string
  amount: number
  type: string
  description?: string
  recurring_frequency: string
  currency_code?: string
}

interface NextGeneration {
  nextDate: string
  isDue: boolean
}

interface RecurringIncomeManagerProps {
  recurringStatus?: {
    recurringIncome?: RecurringIncome[]
    nextGenerations?: NextGeneration[]
  }
  refetch?: () => void
}

export function RecurringIncomeManager({ recurringStatus: propRecurringStatus }: RecurringIncomeManagerProps = {}) {
  const { currency } = useCurrency()

  // Use prop data if provided, otherwise fetch from API
  const { data: fetchedRecurringStatus } = trpc.income.getRecurringIncomeStatus.useQuery(undefined, {
    enabled: !propRecurringStatus // Only fetch if no prop data provided
  })
  
  const recurringStatus = propRecurringStatus || fetchedRecurringStatus

  // Convert recurring income amounts from their stored currencies to display currency
  const recurringIncomeData = useMemo(() => 
    recurringStatus?.recurringIncome?.map((income: RecurringIncome) => ({ 
      amount: income.amount, 
      currency_code: income.currency_code || 'PHP' 
    })) || [], 
    [recurringStatus?.recurringIncome]
  )

  const { convertedAmounts: convertedRecurringAmounts } = useCurrencyAmountsWithCurrency(recurringIncomeData)

  const formatAmount = (amount: number) => formatCurrency(amount, currency)


  const recurringIncome = recurringStatus?.recurringIncome || []
  const nextGenerations = recurringStatus?.nextGenerations || []

  return (
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
          {/* Generation Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Recurring Income Status</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Income entries are automatically created on their scheduled dates
            </div>
          </div>

          {/* Recurring Income Sources */}
          {recurringIncome.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium">Your Recurring Income Sources</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Generation</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurringIncome.map((income: RecurringIncome, index: number) => {
                      const nextGen = nextGenerations[index]
                      return (
                        <TableRow key={income.id}>
                          
                          <TableCell>
                            <Badge 
                              variant="secondary"
                              className={incomeTypeColors[income.type as keyof typeof incomeTypeColors] || 'bg-gray-100 text-gray-800'}
                            >
                              {incomeTypeLabels[income.type as keyof typeof incomeTypeLabels] || income.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{income.description || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatAmount(convertedRecurringAmounts[index] || income.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary"
                              className={frequencyColors[income.recurring_frequency as keyof typeof frequencyColors] || 'bg-gray-100 text-gray-800'}
                            >
                              {frequencyLabels[income.recurring_frequency as keyof typeof frequencyLabels] || income.recurring_frequency}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {nextGen ? format(new Date(nextGen.nextDate), 'MMM dd, yyyy') : 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {nextGen?.isDue ? (
                              <Badge variant="destructive" className="text-xs">
                                Due
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Scheduled
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Recurring Income Sources</h3>
              <p className="text-muted-foreground">
                Set up recurring income sources to automatically generate income entries
              </p>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  )
}
