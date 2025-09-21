"use client"

import * as React from "react"
import {
  BarChart3,
  CreditCard,
  Home,
  Settings,
  Calendar,
  TrendingUp,
  PieChart,
} from "lucide-react"
import Image from "next/image"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        isActive: true,
      },
      {
        title: "Expenses",
        url: "/expenses",
        icon: CreditCard,
        items: [
          {
            title: "View All",
            url: "/expenses",
          },
          {
            title: "Categories",
            url: "/expenses/categories",
          },
        ],
      },
      {
        title: "Reports",
        url: "/reports",
        icon: BarChart3,
        items: [
          {
            title: "Overview",
            url: "/reports",
            icon: BarChart3,
          },
          {
            title: "Daily Report",
            url: "/reports/daily",
            icon: Calendar,
          },
          {
            title: "Weekly Report",
            url: "/reports/weekly",
            icon: TrendingUp,
          },
          {
            title: "Monthly Report",
            url: "/reports/monthly",
            icon: BarChart3,
          },
          {
            title: "Category Analysis",
            url: "/reports/category-analysis",
            icon: PieChart,
          },
        ],
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        items: [
          {
            title: "Profile",
            url: "/settings/profile",
          },
          {
            title: "Preferences",
            url: "/settings/preferences",
          },
        ],
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Image 
            src="/branding-icon.png" 
            alt="PurseFlow" 
            width={24} 
            height={24}
            className="h-6 w-6 dark:invert"
          />
          <span className="font-semibold group-data-[collapsible=icon]:hidden">PurseFlow</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
