"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"

export function PatientHeader() {
  const { user } = useAuth()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex items-center gap-2 ml-auto">
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