import { Metadata } from 'next'
import { CategoryAnalysisContent } from '@/components/category-analysis-content'
import { requireAuth } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Category Analysis',
  description: 'Analyze your expenses by category and spending patterns',
}

export default async function CategoryAnalysisPage() {
  await requireAuth()
  return <CategoryAnalysisContent />
}
