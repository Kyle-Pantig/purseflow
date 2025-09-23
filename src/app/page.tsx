import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "PurseFlow - Expense Tracker & Budget Management App",
  description: "Track your expenses and manage your finances with ease using PurseFlow's intuitive expense tracker and budget management features.",
}

// This page should never be reached due to middleware redirects
// But as a fallback, we'll redirect to login
export default function Home() {
  redirect('/dashboard')
}
