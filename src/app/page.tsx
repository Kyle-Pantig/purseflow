import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses and manage your finances with ease",
}

// This page should never be reached due to middleware redirects
// But as a fallback, we'll redirect to login
export default function Home() {
  redirect('/dashboard')
}
