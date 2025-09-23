import { Metadata } from 'next'
import { ExpensesContent } from "@/components/expenses-content"
import { requireAuth } from "@/lib/auth-server"

export const metadata: Metadata = {
  title: "Expenses - Manage Your Daily Spending",
  description: "Track and manage your daily expenses with PurseFlow's intuitive expense management tools",
}

export default async function ExpensesPage() {
  await requireAuth()
  return <ExpensesContent />
}
