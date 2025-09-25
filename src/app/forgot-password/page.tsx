import { Metadata } from 'next'
import Image from 'next/image'
import { ForgotPasswordForm } from "@/components/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot Password - Reset Your PurseFlow Account",
  description: "Reset your password to regain access to your PurseFlow expense tracker account",
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-svh w-full p-6 md:p-10 relative">
      {/* Branding positioned in top left on desktop, centered on mobile */}
      <div className="flex justify-center md:justify-start mb-8">
        <div className="flex items-center gap-4">
          <Image 
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
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
