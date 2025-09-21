'use client'

import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import { supabase } from './supabase'
import type { AppRouter } from '@/server/api/root'

export const trpc = createTRPCReact<AppRouter>()

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        headers: async () => {
          const { data: { session } } = await supabase.auth.getSession()
          
          const headers: Record<string, string> = {}
          if (session?.access_token) {
            headers['authorization'] = `Bearer ${session.access_token}`
          }
          
          return headers
        },
      }),
    ],
  })
}
