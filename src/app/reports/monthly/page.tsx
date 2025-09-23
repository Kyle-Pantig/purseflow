import { Metadata } from 'next'
import { MonthlyReportContent } from '@/components/monthly-report-content'
import { requireAuth } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Monthly Financial Reports - Track Monthly Budget',
  description: 'View your monthly expense and income reports with detailed monthly budget analysis',
}

export default async function MonthlyReportPage() {
  await requireAuth()
  return <MonthlyReportContent />
}
