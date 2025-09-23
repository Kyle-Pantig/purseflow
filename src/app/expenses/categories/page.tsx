import { Metadata } from 'next'
import { CategoriesContent } from "@/components/categories-content"
import { requireAuth } from "@/lib/auth-server"

export const metadata: Metadata = {
  title: "Expense Categories - Organize Your Spending",
  description: "Manage and organize your expense categories to better track your spending patterns",
}

export default async function CategoriesPage() {
  await requireAuth()
  return <CategoriesContent />
}
