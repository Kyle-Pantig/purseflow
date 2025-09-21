import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dataRouter = createTRPCRouter({
  resetEverything: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const userId = ctx.session.user.id

        // Delete all user data using Supabase
        const { error: expensesError } = await supabaseServer
          .from('expenses')
          .delete()
          .eq('user_id', userId)

        if (expensesError) throw expensesError

        const { error: incomeError } = await supabaseServer
          .from('income')
          .delete()
          .eq('user_id', userId)

        if (incomeError) throw incomeError

        // Note: Recurring income is stored in the income table with is_recurring=true
        // It will be deleted by the income deletion above

        // Reset user preferences to defaults
        const { error: preferencesError } = await supabaseServer
          .from('user_preferences')
          .update({
            monthly_salary: 0,
            currency_code: 'PHP',
            color_scheme: 'violet'
          })
          .eq('user_id', userId)

        if (preferencesError) throw preferencesError

        return { success: true, message: 'All data has been reset successfully' }
      } catch (error) {
        console.error('Error resetting all data:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset all data'
        })
      }
    }),

  resetByTimePeriod: protectedProcedure
    .input(
      z.object({
        period: z.enum(['week', 'month', 'year']),
        date: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id
        const { period, date } = input

        // Parse the date based on period
        let startDate: string
        let endDate: string

        switch (period) {
          case 'week':
            // Parse YYYY-WW format
            const [year, week] = date.split('-W')
            const weekStart = getWeekStartDate(parseInt(year), parseInt(week))
            startDate = weekStart.toISOString()
            endDate = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            break

          case 'month':
            // Parse YYYY-MM format
            const [yearMonth, month] = date.split('-')
            const monthStart = new Date(parseInt(yearMonth), parseInt(month) - 1, 1)
            const monthEnd = new Date(parseInt(yearMonth), parseInt(month), 1)
            startDate = monthStart.toISOString()
            endDate = monthEnd.toISOString()
            break

          case 'year':
            // Parse YYYY format
            const yearStart = new Date(parseInt(date), 0, 1)
            const yearEnd = new Date(parseInt(date) + 1, 0, 1)
            startDate = yearStart.toISOString()
            endDate = yearEnd.toISOString()
            break

          default:
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid time period'
            })
        }

        // Delete data within the time period using Supabase
        const { error: expensesError } = await supabaseServer
          .from('expenses')
          .delete()
          .eq('user_id', userId)
          .gte('date', startDate)
          .lt('date', endDate)

        if (expensesError) throw expensesError

        const { error: incomeError } = await supabaseServer
          .from('income')
          .delete()
          .eq('user_id', userId)
          .gte('date', startDate)
          .lt('date', endDate)

        if (incomeError) throw incomeError

        // Note: Recurring income is stored in the income table with is_recurring=true
        // It will be deleted by the income deletion above

        return { 
          success: true, 
          message: `Data for ${period} has been reset successfully`,
          period,
          dateRange: { startDate, endDate }
        }
      } catch (error) {
        console.error('Error resetting data by time period:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset data for the specified time period'
        })
      }
    })
})

// Helper function to get the start date of a week
function getWeekStartDate(year: number, week: number): Date {
  const jan1 = new Date(year, 0, 1)
  const jan1Day = jan1.getDay()
  const daysToAdd = (week - 1) * 7 - jan1Day + 1
  return new Date(year, 0, 1 + daysToAdd)
}
