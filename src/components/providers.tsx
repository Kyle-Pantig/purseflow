'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { trpc, createTRPCClient } from '@/lib/trpc-client'
import { AuthProvider } from '@/contexts/auth-context'
import { CurrencyProvider } from '@/contexts/currency-context'
import { CurrencyConversionProvider } from '@/contexts/currency-conversion-context'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { ColorProvider } from '@/contexts/color-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { useState, useMemo } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  
  // Create tRPC client once and let it handle auth headers dynamically
  const trpcClient = useMemo(() => createTRPCClient(), [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CurrencyProvider>
              <CurrencyConversionProvider>
                <ColorProvider>
                  <SidebarProvider>
                    {children}
                  </SidebarProvider>
                </ColorProvider>
              </CurrencyConversionProvider>
            </CurrencyProvider>
          </AuthProvider>
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </trpc.Provider>
      <Toaster position="bottom-right" />
    </ThemeProvider>
  )
}
