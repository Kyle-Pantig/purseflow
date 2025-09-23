import { Metadata } from 'next'
import { ReportsContent } from "@/components/reports-content"
import { requireAuth } from "@/lib/auth-server"

export const metadata: Metadata = {
  title: "Financial Reports - Analytics & Insights Dashboard",
  description: "View detailed financial reports and analytics with PurseFlow's comprehensive reporting tools",
}

export default async function ReportsPage() {
  await requireAuth()
  return <ReportsContent />
}
