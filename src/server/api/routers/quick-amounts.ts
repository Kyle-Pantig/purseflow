import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { supabaseServer } from '@/lib/supabase-server'

export const quickAmountsRouter = createTRPCRouter({
  // Get all quick amounts for the user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await supabaseServer
      .from('quick_amounts')
      .select('*')
      .eq('user_id', ctx.session.user.id)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }),

  // Create a new quick amount
  create: protectedProcedure
    .input(
      z.object({
        description: z.string().optional(),
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
        amount: z.number().positive(),
        currency_code: z.string().optional().default('PHP'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabaseServer
        .from('quick_amounts')
        .insert({
          user_id: ctx.session.user.id,
          description: input.description,
          category: input.category,
          amount: input.amount,
          currency_code: input.currency_code,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  // Update a quick amount
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        description: z.string().optional(),
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
        ]).optional(),
        amount: z.number().positive().optional(),
        currency_code: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input
      
      const { data, error } = await supabaseServer
        .from('quick_amounts')
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

  // Delete a quick amount
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabaseServer
        .from('quick_amounts')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.session.user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  // Quick add expense using preset
  quickAdd: protectedProcedure
    .input(
      z.object({
        presetId: z.string(),
        description: z.string().optional(),
        date: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First get the quick amount preset
      const { data: preset, error: presetError } = await supabaseServer
        .from('quick_amounts')
        .select('*')
        .eq('id', input.presetId)
        .eq('user_id', ctx.session.user.id)
        .single()

      if (presetError || !preset) {
        throw new Error('Quick amount preset not found')
      }

      // Add the expense using the preset data
      const { data, error } = await supabaseServer
        .from('expenses')
        .insert({
          user_id: ctx.session.user.id,
          amount: preset.amount,
          category: preset.category,
          description: input.description || preset.description,
          date: input.date || new Date().toISOString(),
          currency_code: preset.currency_code,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),
})
