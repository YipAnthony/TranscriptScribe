"use client"

import * as React from "react"
import {
  IconUsers,
  IconFileText,
  IconChartBar,
  IconLogout,
  IconHome,
  IconUser,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function PatientSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()

  // Extract patient ID from current path
  const getPatientIdFromPath = () => {
    const match = pathname.match(/\/patient\/([^\/]+)/)
    return match ? match[1] : null
  }

  const patientId = getPatientIdFromPath()

  // Check if we're on a main page (appointments or trials) vs nested pages
  const isMainPage = () => {
    const mainPaths = [
      `/patient/${patientId}/appointments`,
      `/patient/${patientId}/trials`
    ]
    return mainPaths.some(path => pathname === path)
  }

  const patientNavItems = [
    {
      title: "Appointments",
      url: patientId ? `/patient/${patientId}/appointments` : "/patient/appointments",
      icon: IconCalendar,
    },
    {
      title: "Clinical Trials",
      url: patientId ? `/patient/${patientId}/trials` : "/patient/trials",
      icon: IconChartBar,
    },
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <IconHome className="!size-5" />
                <span className="text-base font-semibold">TranscriptScribe Patient</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarMenu>
          {patientNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                <a href={item.url}>
                  <item.icon className="!size-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <IconLogout className="!size-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {user && (
          <div className="p-4 border-t">
            <div className="text-sm text-gray-600">
              <div className="font-medium">{user.email}</div>
              <div className="text-xs">Patient Portal</div>
            </div>
          </div>
        )}
      </SidebarFooter>
      
      {/* Toggle button on the sidebar border - only show on main pages */}
      {isMainPage() && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-background border border-border rounded-full p-1.5 shadow-md hover:bg-accent hover:text-accent-foreground transition-colors z-20"
          aria-label={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
        >
          {state === "expanded" ? (
            <IconChevronLeft className="h-4 w-4" />
          ) : (
            <IconChevronRight className="h-4 w-4" />
          )}
        </button>
      )}
    </Sidebar>
  )
} 