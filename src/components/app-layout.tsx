'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { FloatingAddButton } from "@/components/floating-add-button"
import { useCssVariables } from "@/hooks/use-css-variables"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { usePathname } from 'next/navigation'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Update CSS variables with user's color preferences
  useCssVariables()
  
  // Don't show sidebar on login, forgot password, and reset password pages
  if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="sticky top-0 z-50 bg-background">
          <AppHeader />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
        <FloatingAddButton />
      </SidebarInset>
    </SidebarProvider>
  )
}
