"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { IconEye, IconLoader2, IconCalendar } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"
import { ViewAppointmentDialog } from "@/components/view-appointment-dialog"

interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  recorded_at: string | null
  status: string
  created_at: string
  updated_at: string
}

interface AppointmentsTableProps {
  refreshKey?: number
}

export function AppointmentsTable({ refreshKey = 0 }: AppointmentsTableProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchAppointments()
  }, [refreshKey])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch transcripts (appointments) with patient names
      const { data: transcriptsData, error: transcriptsError } = await supabase
        .from('transcripts')
        .select(`
          *,
          patients:patient_id(first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      if (transcriptsError) {
        throw transcriptsError
      }

      // Transform the data to include patient names
      const transformedAppointments = transcriptsData?.map(transcript => ({
        ...transcript,
        patient_name: transcript.patients 
          ? `${transcript.patients.first_name} ${transcript.patients.last_name}`
          : 'Unknown Patient'
      })) || []

      setAppointments(transformedAppointments)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      PROCESSING: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      COMPLETED: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      FAILED: { color: 'bg-red-100 text-red-800', label: 'Failed' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const handleViewAppointment = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId)
    setViewDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <IconLoader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading appointments...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading appointments</p>
          <p className="text-sm text-gray-600">{error}</p>
          <Button onClick={fetchAppointments} variant="outline" className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No appointments found</p>
          <p className="text-sm text-gray-500">Create your first appointment to get started</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Appointment Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">
                  {appointment.patient_name}
                </TableCell>
                <TableCell>{formatDateTime(appointment.recorded_at)}</TableCell>
                <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                <TableCell>{formatDate(appointment.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewAppointment(appointment.id)}
                  >
                    <IconEye className="mr-2 h-4 w-4" />
                    View Transcript Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ViewAppointmentDialog
        appointmentId={selectedAppointmentId}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
    </>
  )
} 