import { Metadata } from 'next'
import { CategoriesContent } from "@/components/categories-content"
import { requireAuth } from "@/lib/auth-server"

export const metadata: Metadata = {
  title: "Expense Categories",
  description: "Manage and organize your expense categories",
}

export default async function CategoriesPage() {
  await requireAuth()
  return <CategoriesContent />
}
