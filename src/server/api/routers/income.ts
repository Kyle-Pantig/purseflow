import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { supabaseServer } from '@/lib/supabase-server'
import { addMonths, addYears, endOfMonth } from 'date-fns'

// Helper function to auto-generate due recurring income
async function generateDueRecurringIncome(userId: string, recurringIncome: Array<{
  id: string;
  amount: number;
  type: string;
  description?: string;
  date: string;
  is_recurring: boolean;
  recurring_frequency: string;
  currency_code: string;
}>, today: Date) {
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  for (const income of recurringIncome) {
    const lastDate = new Date(income.date)
    let shouldGenerate = false
    let nextDate = new Date()

    // Calculate next generation date based on frequency
    switch (income.recurring_frequency) {
      case 'monthly':
        nextDate = addMonths(lastDate, 1)
        shouldGenerate = today >= nextDate
        break
        
      case 'mid_month':
        // Generate on middle day of current month (14th or 15th depending on month)
        const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        const midDay = Math.ceil(daysInCurrentMonth / 2)
        const midMonth = new Date(currentYear, currentMonth, midDay)
        nextDate = midMonth
        shouldGenerate = today >= midMonth && lastDate < midMonth
        break
        
      case 'end_month':
        // Generate on last day of current month if not already generated
        const endMonth = new Date(currentYear, currentMonth + 1, 0) // Last day of current month
        nextDate = endMonth
        shouldGenerate = today >= endMonth && lastDate < endMonth
        break
        
      case 'yearly':
        nextDate = addYears(lastDate, 1)
        shouldGenerate = today >= nextDate
        break
    }

    if (shouldGenerate) {
      // Check if we already generated an entry for this period
      const periodStart = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1)
      const periodEnd = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0)
      
      const { data: existingEntry } = await supabaseServer
        .from('income')
        .select('id')
        .eq('user_id', userId)
        .eq('type', income.type)
        .eq('amount', income.amount)
        .eq('is_recurring', true)
        .gte('date', periodStart.toISOString().split('T')[0])
        .lte('date', periodEnd.toISOString().split('T')[0])
        .single()

      if (!existingEntry) {
        // Generate new recurring income entry
        await supabaseServer
          .from('income')
          .insert({
            user_id: userId,
            amount: income.amount,
            type: income.type,
            description: income.description || `Recurring ${income.type}`,
            date: nextDate.toISOString().split('T')[0],
            is_recurring: true,
            recurring_frequency: income.recurring_frequency,
            currency_code: income.currency_code,
          })
      }
    }
  }
}

export const incomeRouter = createTRPCRouter({
  addIncome: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        type: z.enum(['salary', 'freelance', 'investment', 'bonus', 'other']),
        description: z.string().optional(),
        date: z.string(),
        is_recurring: z.boolean().default(false),
        recurring_frequency: z.enum(['monthly', 'mid_month', 'end_month', 'yearly']).optional(),
        currency_code: z.string().optional().default('PHP'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabaseServer
        .from('income')
        .insert({
          user_id: ctx.session.user.id,
          amount: input.amount,
          type: input.type,
          description: input.description,
          date: input.date,
          is_recurring: input.is_recurring,
          recurring_frequency: input.is_recurring ? input.recurring_frequency : null,
          currency_code: input.currency_code,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  getIncomeByDate: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabaseServer
        .from('income')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .gte('date', input.startDate)
        .lte('date', input.endDate)
        .order('date', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  getMonthlyIncome: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.year, input.month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(input.year, input.month, 0).toISOString().split('T')[0]
      
      const { data, error } = await supabaseServer
        .from('income')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  getAllIncome: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await supabaseServer
      .from('income')
      .select('*')
      .eq('user_id', ctx.session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }),

  getRecurringIncome: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await supabaseServer
      .from('income')
      .select('*')
      .eq('user_id', ctx.session.user.id)
      .eq('is_recurring', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }),

  updateIncome: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().positive().optional(),
        type: z.enum(['salary', 'freelance', 'investment', 'bonus', 'other']).optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        is_recurring: z.boolean().optional(),
        recurring_frequency: z.enum(['monthly', 'mid_month', 'end_month', 'yearly']).optional(),
        currency_code: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input
      
      // Handle recurring_frequency properly
      if (updateData.is_recurring === false && updateData.recurring_frequency !== undefined) {
        updateData.recurring_frequency = undefined
      }
      
      const { data, error } = await supabaseServer
        .from('income')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', ctx.session.user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  deleteIncome: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await supabaseServer
        .from('income')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.session.user.id)

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    }),

  getIncomeReport: protectedProcedure
    .input(
      z.object({
        period: z.enum(['week', 'month', 'year']),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabaseServer
        .from('income')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .gte('date', input.startDate)
        .lte('date', input.endDate)
        .order('date', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      // Group by type
      const typeTotals = data.reduce((acc, income) => {
        acc[income.type] = (acc[income.type] || 0) + income.amount
        return acc
      }, {} as Record<string, number>)

      // Group by date for time series
      const dailyTotals = data.reduce((acc, income) => {
        const date = income.date
        acc[date] = (acc[date] || 0) + income.amount
        return acc
      }, {} as Record<string, number>)

      return {
        total: data.reduce((sum, income) => sum + income.amount, 0),
        typeTotals,
        dailyTotals: Object.entries(dailyTotals).map(([date, amount]) => ({
          date,
          amount,
        })),
        income: data,
      }
    }),

  generateRecurringIncome: protectedProcedure
    .mutation(async ({ ctx }) => {
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      
      // Get all recurring income entries
      const { data: recurringIncome, error: recurringError } = await supabaseServer
        .from('income')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .eq('is_recurring', true)

      if (recurringError) {
        throw new Error(`Failed to fetch recurring income: ${recurringError.message}`)
      }

      if (!recurringIncome || recurringIncome.length === 0) {
        return { generated: 0, message: 'No recurring income sources found' }
      }

      const generatedEntries = []
      
      for (const income of recurringIncome) {
        const lastDate = new Date(income.date)
        let shouldGenerate = false
        let nextDate = new Date()

        // Calculate next generation date based on frequency
        switch (income.recurring_frequency) {
          case 'monthly':
            nextDate = addMonths(lastDate, 1)
            shouldGenerate = today >= nextDate
            break
            
          case 'mid_month':
            // Generate on middle day of current month (14th or 15th depending on month)
            const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
            const midDay = Math.ceil(daysInCurrentMonth / 2)
            const midMonth = new Date(currentYear, currentMonth, midDay)
            nextDate = midMonth
            shouldGenerate = today >= midMonth && lastDate < midMonth
            break
            
          case 'end_month':
            // Generate on last day of current month if not already generated
            const endMonth = new Date(currentYear, currentMonth + 1, 0) // Last day of current month
            nextDate = endMonth
            shouldGenerate = today >= endMonth && lastDate < endMonth
            break
            
          case 'yearly':
            nextDate = addYears(lastDate, 1)
            shouldGenerate = today >= nextDate
            break
        }

        if (shouldGenerate) {
          // Check if we already generated an entry for this period
          const periodStart = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1)
          const periodEnd = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0)
          
          const { data: existingEntry } = await supabaseServer
            .from('income')
            .select('id')
            .eq('user_id', ctx.session.user.id)
            .eq('type', income.type)
            .eq('amount', income.amount)
            .eq('is_recurring', true)
            .gte('date', periodStart.toISOString().split('T')[0])
            .lte('date', periodEnd.toISOString().split('T')[0])
            .single()

          if (!existingEntry) {
            // Generate new recurring income entry
            const { data: newEntry, error: insertError } = await supabaseServer
              .from('income')
              .insert({
                user_id: ctx.session.user.id,
                amount: income.amount,
                type: income.type,
                description: income.description || `Recurring ${income.type}`,
                date: nextDate.toISOString().split('T')[0],
                is_recurring: true,
                recurring_frequency: income.recurring_frequency,
                currency_code: income.currency_code,
              })
              .select()
              .single()

            if (insertError) {
              console.error(`Failed to generate recurring income for ${income.type}:`, insertError)
            } else {
              generatedEntries.push(newEntry)
            }
          }
        }
      }

      return {
        generated: generatedEntries.length,
        entries: generatedEntries,
        message: `Generated ${generatedEntries.length} recurring income entries`
      }
    }),

  getRecurringIncomeStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const today = new Date()
      
      // Get all recurring income entries
      const { data: recurringIncome, error } = await supabaseServer
        .from('income')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .eq('is_recurring', true)
        .order('date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch recurring income: ${error.message}`)
      }

      if (!recurringIncome || recurringIncome.length === 0) {
        return { recurringIncome: [], nextGenerations: [] }
      }

      // Auto-generate any due recurring income
      await generateDueRecurringIncome(ctx.session.user.id, recurringIncome, today)

      // Calculate next generation dates
      const nextGenerations = recurringIncome.map(income => {
        const lastDate = new Date(income.date)
        let nextDate = new Date()

        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        
        switch (income.recurring_frequency) {
          case 'monthly':
            nextDate = addMonths(lastDate, 1)
            break
          case 'mid_month':
            // Calculate next mid-month date based on the month's length
            const nextMonth = currentMonth + 1
            const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear
            const actualNextMonth = nextMonth > 11 ? 0 : nextMonth
            const daysInNextMonth = new Date(nextYear, actualNextMonth + 1, 0).getDate()
            const nextMidDay = Math.ceil(daysInNextMonth / 2)
            nextDate = new Date(nextYear, actualNextMonth, nextMidDay)
            break
          case 'end_month':
            // For end-month, show the last day of the current month
            // Use date-fns endOfMonth to get the last day of current month
            nextDate = endOfMonth(today)
            break
          case 'yearly':
            nextDate = addYears(lastDate, 1)
            break
        }

        return {
          incomeId: income.id,
          nextDate: nextDate.toISOString().split('T')[0],
          isDue: today >= nextDate,
          frequency: income.recurring_frequency
        }
      })

      return {
        recurringIncome,
        nextGenerations
      }
    }),
})
