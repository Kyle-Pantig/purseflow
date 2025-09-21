import { Metadata } from 'next'
import { DailyReportContent } from '@/components/daily-report-content'
import { requireAuth } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Daily Reports',
  description: 'View your daily expense and income reports',
}

export default async function DailyReportPage() {
  await requireAuth()
  return <DailyReportContent />
}
