import { initTRPC, TRPCError } from '@trpc/server'
import { type Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { supabaseServer } from '@/lib/supabase-server'
import { type NextRequest } from 'next/server'

interface CreateContextOptions {
  session: Session | null
}

interface CreateTRPCContextOptions {
  req: NextRequest
  res?: Response
}

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    supabase,
  }
}

export const createTRPCContext = async (opts: CreateTRPCContextOptions) => {
  const { req } = opts

  // Get the session from the Authorization header
  const authHeader = req.headers.get('authorization')
  let session: Session | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const cleanToken = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabaseServer.auth.getUser(cleanToken)
      
      if (user) {
        session = { user, access_token: cleanToken } as Session
      }
    } catch {
      console.error('Error getting user from token')
    }
  }

  return createInnerTRPCContext({
    session,
  })
}

const t = initTRPC.context<typeof createTRPCContext>().create()

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource'
    })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
