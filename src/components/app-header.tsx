'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CurrencySelector } from "@/components/currency-selector"
import { usePathname } from 'next/navigation'
import { useAuth } from "@/contexts/auth-context"
import { useColor } from "@/contexts/color-context"
import { useRef } from "react"
import {
  BadgeCheck,
  Settings,
  LogOut,
  UserCircle,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/auth"
import { useIsMobile } from "@/hooks/use-mobile"
import { useCurrency, SUPPORTED_CURRENCIES } from "@/contexts/currency-context"

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) return []
  
  const breadcrumbs = [
    {
      href: '/dashboard',
      label: 'PurseFlow',
      key: 'home'
    }
  ]
  
  if (segments[0] === 'dashboard') {
    if (segments.length === 1) {
      breadcrumbs.push({
        href: '/dashboard',
        label: 'Dashboard',
        key: 'dashboard'
      })
    }
  } else if (segments[0] === 'expenses') {
    breadcrumbs.push({
      href: '/expenses',
      label: 'Expenses',
      key: 'expenses'
    })
  } else if (segments[0] === 'reports') {
    breadcrumbs.push({
      href: '/reports',
      label: 'Reports',
      key: 'reports'
    })
  } else if (segments[0] === 'settings') {
    breadcrumbs.push({
      href: '/settings',
      label: 'Settings',
      key: 'settings'
    })
  }
  
  return breadcrumbs
}

export function AppHeader() {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)
  const { user } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { currency, setCurrency } = useCurrency()
  const { colors } = useColor()
  const currencySubmenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const handleCurrencyChange = (newCurrency: { code: string; name: string; symbol: string; locale: string }) => {
    setCurrency(newCurrency)
    // Close the submenu by clicking outside or programmatically
    if (currencySubmenuRef.current) {
      currencySubmenuRef.current.click()
    }
  }

  const userData = {
    name: user?.email?.split('@')[0] || "User",
    email: user?.email || "user@example.com",
    avatar: undefined, // No avatar image, will use fallback with icon
  }

  // Use default color if not authenticated or colors not loaded
  const avatarColor = user && colors.length > 0 ? colors[0] : '#8b5cf6' // Default violet

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4 flex-1">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.key} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={breadcrumb.href}>
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2 px-4">
        {!isMobile && (
          <>
            <CurrencySelector />
            <Separator orientation="vertical" className="h-6" />
          </>
        )}
        <ThemeToggle />
        <Separator orientation="vertical" className="h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center rounded-lg p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>
                  <UserCircle className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>
                    <UserCircle className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-xs text-muted-foreground">{userData.email}</span>
                  {isMobile && (
                    <span className="truncate text-xs text-muted-foreground">
                      {currency.symbol} {currency.code}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {isMobile && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger ref={currencySubmenuRef}>
                    <span className="text-md ml-1 text-muted-foreground">{currency.symbol}</span>
                    <span className="ml-3">Currency: {currency.code}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <DropdownMenuItem
                        key={curr.code}
                        onClick={() => handleCurrencyChange(curr)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{curr.symbol}</span>
                          <span className="font-medium">{curr.code}</span>
                        </div>
                        {currency.code === curr.code && (
                          <span className="text-xs text-muted-foreground">✓</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
                <Settings />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/preferences')}>
                <BadgeCheck />
                Preferences
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
