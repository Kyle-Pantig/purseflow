import { Metadata } from 'next'
import { ReportsContent } from "@/components/reports-content"
import { requireAuth } from "@/lib/auth-server"

export const metadata: Metadata = {
  title: "Reports",
  description: "View detailed financial reports and analytics",
}

export default async function ReportsPage() {
  await requireAuth()
  return <ReportsContent />
}
