"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCalendar, IconRefresh } from "@tabler/icons-react"
import { AppointmentsTable } from "@/components/appointments-table"
import { AddAppointmentDialog } from "@/components/add-appointment-dialog"

export default function AppointmentsPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [appointmentCount, setAppointmentCount] = useState(0)

  const handleAppointmentAdded = () => {
    setRefreshKey(prev => prev + 1)
    setAppointmentCount(prev => prev + 1)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage patient appointments and conversations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <AddAppointmentDialog onAppointmentAdded={handleAppointmentAdded} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentCount}</div>
            <p className="text-xs text-muted-foreground">
              All time appointments
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCalendar className="h-5 w-5" />
            Appointment List
          </CardTitle>
          <CardDescription>
            View and manage all patient appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentsTable refreshKey={refreshKey} />
        </CardContent>
      </Card>
    </div>
  )
} 