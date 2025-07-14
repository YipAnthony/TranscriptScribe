"use client"

import * as React from "react"
import { IconBell, IconSearch } from "@tabler/icons-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AdminHeader() {
  const { user } = useAuth()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex items-center gap-2 px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="w-8 h-8"
              variant="outline"
              size="sm"
            >
              <IconSearch className="h-4 w-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search patients, transcripts..."
            className="w-full max-w-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <IconBell className="h-4 w-4" />
        </Button>
        {user && (
          <div className="flex items-center gap-2 px-2">
            <div className="text-sm">
              <div className="font-medium">{user.email}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 