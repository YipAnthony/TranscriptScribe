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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { IconEye, IconLoader2, IconCalendar, IconDots, IconFlask } from "@tabler/icons-react"
import { apiClient } from '@/lib/api-client'
import { ViewAppointmentDialog } from "@/components/view-appointment-dialog"
import { ViewRecommendedTrialsDialog } from "@/components/view-recommended-trials-dialog"

interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  recorded_at: string | null
  status: string
  created_at: string
  updated_at: string
  clinical_trials_count?: number
}

interface AppointmentsTableProps {
  refreshKey?: number
  patientId?: string
  showPatientColumn?: boolean
  isPatientView?: boolean
}

export function AppointmentsTable({ 
  refreshKey = 0, 
  patientId, 
  showPatientColumn = true,
  isPatientView = false 
}: AppointmentsTableProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedTrialsAppointmentId, setSelectedTrialsAppointmentId] = useState<string | null>(null)
  const [viewTrialsDialogOpen, setViewTrialsDialogOpen] = useState(false)
  const [savedTrials, setSavedTrials] = useState<Set<string>>(new Set())
  const [savingTrial, setSavingTrial] = useState<string | null>(null)

  useEffect(() => {
    fetchAppointments()
    if (isPatientView && patientId) {
      fetchSavedTrials()
    }
  }, [refreshKey, patientId, isPatientView])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      const appointmentsData = await apiClient.getAppointments(patientId)
      setAppointments(appointmentsData)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedTrials = async () => {
    if (!patientId) return
    try {
      const savedTrialIds = await apiClient.getSavedTrials(patientId)
      setSavedTrials(new Set(savedTrialIds))
    } catch (err) {
      console.error('Error fetching saved trials:', err)
      setSavedTrials(new Set())
    }
  }

  const handleSaveTrial = async (trialId: string) => {
    if (!patientId) return
    setSavingTrial(trialId)
    try {
      if (savedTrials.has(trialId)) {
        await apiClient.removeSavedTrial(patientId, trialId)
        setSavedTrials(prev => {
          const newSet = new Set(prev)
          newSet.delete(trialId)
          return newSet
        })
      } else {
        await apiClient.saveTrial(patientId, trialId)
        setSavedTrials(prev => new Set([...prev, trialId]))
      }
    } catch (err) {
      console.error('Error toggling saved trial:', err)
    } finally {
      setSavingTrial(null)
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

  const handleViewRecommendedTrials = (appointmentId: string) => {
    setSelectedTrialsAppointmentId(appointmentId)
    setViewTrialsDialogOpen(true)
  }

  const getClinicalTrialsBadge = (count: number) => {
    if (count === 0) {
      return <Badge variant="outline" className="text-gray-500">No Trials Recommended</Badge>
    }
    if (count <= 3) {
      return <Badge className="bg-green-100 text-green-800">{count} Trial{count !== 1 ? 's' : ''}</Badge>
    }
    if (count <= 10) {
      return <Badge className="bg-yellow-100 text-yellow-800">{count} Potential Trials</Badge>
    }
    return <Badge className="bg-blue-100 text-blue-800">{count} Potential Trials</Badge>
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
              {showPatientColumn && <TableHead>Patient</TableHead>}
              <TableHead>Appointment Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Clinical Trials</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                {showPatientColumn && (
                  <TableCell className="font-medium">
                    {appointment.patient_name}
                  </TableCell>
                )}
                <TableCell>{formatDateTime(appointment.recorded_at)}</TableCell>
                <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconFlask className="h-4 w-4 text-gray-500" />
                    {getClinicalTrialsBadge(appointment.clinical_trials_count || 0)}
                  </div>
                </TableCell>
                <TableCell>{formatDate(appointment.created_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <IconDots className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewAppointment(appointment.id)}>
                        <IconEye className="mr-2 h-4 w-4" />
                        View Transcript Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewRecommendedTrials(appointment.id)}>
                        <IconFlask className="mr-2 h-4 w-4" />
                        View Recommended Trials
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      <ViewRecommendedTrialsDialog
        appointmentId={selectedTrialsAppointmentId}
        open={viewTrialsDialogOpen}
        onOpenChange={setViewTrialsDialogOpen}
        patientId={patientId}
        isPatientView={isPatientView}
      />
    </>
  )
} 