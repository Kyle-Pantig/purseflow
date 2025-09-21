import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { supabaseServer } from '@/lib/supabase-server'

export const userRouter = createTRPCRouter({
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await supabaseServer
        .from('user_preferences')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Failed to fetch user preferences: ${error.message}`)
      }

      // If no preferences exist, return default values
      if (!data) {
        return {
          colorScheme: 'violet' as const,
          currencyCode: 'PHP' as const,
          monthlySalary: 0
        }
      }

      return {
        colorScheme: data.color_scheme as 'violet' | 'blue' | 'green' | 'orange' | 'red' | 'indigo',
        currencyCode: data.currency_code as 'PHP' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD',
        monthlySalary: data.monthly_salary || 0
      }
    }),

  updatePreferences: protectedProcedure
    .input(z.object({
      colorScheme: z.enum(['violet', 'blue', 'green', 'orange', 'red', 'indigo']).optional(),
      currencyCode: z.enum(['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']).optional(),
      monthlySalary: z.number().min(0).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { colorScheme, currencyCode, monthlySalary } = input
      
      // Check if preferences already exist
      const { data: existing } = await supabaseServer
        .from('user_preferences')
        .select('id')
        .eq('user_id', ctx.session.user.id)
        .single()

      if (existing) {
        // Update existing preferences
        const updateData: Record<string, unknown> = {}
        if (colorScheme) updateData.color_scheme = colorScheme
        if (currencyCode) updateData.currency_code = currencyCode
        if (monthlySalary !== undefined) updateData.monthly_salary = monthlySalary

        const { error } = await supabaseServer
          .from('user_preferences')
          .update(updateData)
          .eq('user_id', ctx.session.user.id)

        if (error) {
          throw new Error(`Failed to update user preferences: ${error.message}`)
        }
      } else {
        // Create new preferences
        const { error } = await supabaseServer
          .from('user_preferences')
          .insert({
            user_id: ctx.session.user.id,
            color_scheme: colorScheme || 'violet',
            currency_code: currencyCode || 'PHP',
            monthly_salary: monthlySalary || 0
          })

        if (error) {
          throw new Error(`Failed to create user preferences: ${error.message}`)
        }
      }

      return { success: true }
    })
})
