import { Metadata } from 'next'
import { DashboardContent } from "@/components/dashboard-content"
import { requireAuth } from "@/lib/auth-server"

export const metadata: Metadata = {
  title: "Dashboard - Track Expenses & Income",
  description: "Overview of your expenses, income, and financial insights with PurseFlow's comprehensive dashboard",
}

export default async function Page() {
  // This will redirect to /login if user is not authenticated
  await requireAuth()
  
  return <DashboardContent />
}
