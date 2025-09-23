import { Metadata } from 'next'
import { WeeklyReportContent } from '@/components/weekly-report-content'
import { requireAuth } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Weekly Financial Reports - Analyze Weekly Spending',
  description: 'View your weekly expense and income reports with comprehensive weekly analytics',
}

export default async function WeeklyReportPage() {
  await requireAuth()
  return <WeeklyReportContent />
}
