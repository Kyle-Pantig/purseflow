import { Metadata } from 'next'
import { DailyReportContent } from '@/components/daily-report-content'
import { requireAuth } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Daily Financial Reports - Track Daily Spending',
  description: 'View your daily expense and income reports with detailed analytics and insights',
}

export default async function DailyReportPage() {
  await requireAuth()
  return <DailyReportContent />
}
