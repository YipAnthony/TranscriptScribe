"use client"

import * as React from "react"
import {
  IconUsers,
  IconCalendar,
  IconLogout,
  IconHome,
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
} from "@/components/ui/sidebar"

const adminNavItems = [
  {
    title: "Patients",
    url: "/admin/patients",
    icon: IconUsers,
  },
  {
    title: "Appointments",
    url: "/admin/appointments",
    icon: IconCalendar,
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <IconHome className="!size-5" />
                <span className="text-base font-semibold">TranscriptScribe Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarMenu>
          {adminNavItems.map((item) => (
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
              <div className="text-xs">Admin User</div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
} 