import { Metadata } from 'next'
import { CategoryAnalysisContent } from '@/components/category-analysis-content'
import { requireAuth } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Category Analysis - Spending Patterns & Insights',
  description: 'Analyze your expenses by category and spending patterns with detailed PurseFlow analytics',
}

export default async function CategoryAnalysisPage() {
  await requireAuth()
  return <CategoryAnalysisContent />
}
