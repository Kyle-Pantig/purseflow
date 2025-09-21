import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { supabaseServer } from '@/lib/supabase-server'

export const expenseRouter = createTRPCRouter({
  addExpense: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        category: z.enum([
          'transportation', 
          'food', 
          'bills', 
          'entertainment',
          'shopping',
          'healthcare',
          'education',
          'travel',
          'groceries',
          'utilities',
          'others'
        ]),
        description: z.string().optional(),
        date: z.string(),
        currency_code: z.string().optional().default('PHP'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabaseServer
        .from('expenses')
        .insert({
          user_id: ctx.session.user.id,
          amount: input.amount,
          category: input.category,
          description: input.description,
          date: input.date,
          currency_code: input.currency_code,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  getExpensesByDate: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabaseServer
        .from('expenses')
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

  getTodayExpenses: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabaseServer
      .from('expenses')
      .select('*')
      .eq('user_id', ctx.session.user.id)
      .eq('date', today)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }),

  getRecentExpenses: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const limit = input.limit || 10
      
      const { data, error } = await supabaseServer
        .from('expenses')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  getAllExpenses: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await supabaseServer
      .from('expenses')
      .select('*')
      .eq('user_id', ctx.session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }),

  getReport: protectedProcedure
    .input(
      z.object({
        period: z.enum(['week', 'month']),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await supabaseServer
        .from('expenses')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .gte('date', input.startDate)
        .lte('date', input.endDate)
        .order('date', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      // Group by category
      const categoryTotals = data.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      }, {} as Record<string, number>)

      // Group by date for time series
      const dailyTotals = data.reduce((acc, expense) => {
        const date = expense.date
        acc[date] = (acc[date] || 0) + expense.amount
        return acc
      }, {} as Record<string, number>)

      return {
        total: data.reduce((sum, expense) => sum + expense.amount, 0),
        categoryTotals,
        dailyTotals: Object.entries(dailyTotals).map(([date, amount]) => ({
          date,
          amount,
        })),
        expenses: data,
      }
    }),

  deleteExpense: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await supabaseServer
        .from('expenses')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.session.user.id)

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    }),
})
