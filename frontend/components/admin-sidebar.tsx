"use client"

import * as React from "react"
import {
  IconUsers,
  IconCalendar,
  IconFileDescription,
  IconUpload,
  IconSearch,
  IconSettings,
  IconLogout,
  IconHome,
} from "@tabler/icons-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
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
    title: "Dashboard",
    url: "/admin",
    icon: IconHome,
  },
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
  {
    title: "Trial Recommendations",
    url: "/admin/trials",
    icon: IconFileDescription,
  },
  {
    title: "Upload Transcript",
    url: "/admin/upload",
    icon: IconUpload,
  },
  {
    title: "Search",
    url: "/admin/search",
    icon: IconSearch,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: IconSettings,
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/admin">
                <IconHome className="!size-5" />
                <span className="text-base font-semibold">TranscriptScribe Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {adminNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon className="!size-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
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