import { createTRPCRouter } from '@/server/api/trpc'
import { expenseRouter } from '@/server/api/routers/expense'
import { userRouter } from '@/server/api/routers/user'
import { incomeRouter } from '@/server/api/routers/income'
import { dataRouter } from '@/server/api/routers/data'
import { quickAmountsRouter } from '@/server/api/routers/quick-amounts'

export const appRouter = createTRPCRouter({
  expense: expenseRouter,
  user: userRouter,
  income: incomeRouter,
  data: dataRouter,
  quickAmounts: quickAmountsRouter,
})

export type AppRouter = typeof appRouter
