import { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Login - Access Your PurseFlow Account",
  description: "Sign in to your PurseFlow expense tracker account to manage your finances",
}

function LoginFormWrapper() {
  return (
    <div className="min-h-svh w-full p-6 md:p-10 relative">
      {/* Branding positioned in top left on desktop, centered on mobile */}
      <div className="flex justify-center md:justify-start mb-8">
        <div className="flex items-center gap-4">
          <img 
            src="/branding-icon.png" 
            alt="PurseFlow" 
            width={48} 
            height={48}
            className="h-12 w-12 dark:invert"
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground">PurseFlow</h1>
            <p className="text-sm text-muted-foreground">Expense Tracker & Budget App</p>
          </div>
        </div>
      </div>
      
      {/* Form centered both horizontally and vertically */}
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <LoginFormWrapper />
    </Suspense>
  )
}
