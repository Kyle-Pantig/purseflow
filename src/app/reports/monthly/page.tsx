import { Metadata } from 'next'
import { MonthlyReportContent } from '@/components/monthly-report-content'
import { requireAuth } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Monthly Reports',
  description: 'View your monthly expense and income reports',
}

export default async function MonthlyReportPage() {
  await requireAuth()
  return <MonthlyReportContent />
}
