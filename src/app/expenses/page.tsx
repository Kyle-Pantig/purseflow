import { Metadata } from 'next'
import { ExpensesContent } from "@/components/expenses-content"
import { requireAuth } from "@/lib/auth-server"

export const metadata: Metadata = {
  title: "Expenses",
  description: "Track and manage your daily expenses",
}

export default async function ExpensesPage() {
  await requireAuth()
  return <ExpensesContent />
}
