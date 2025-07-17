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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconEye, IconLoader2, IconCalendar, IconDots, IconFlask, IconTrash } from "@tabler/icons-react"
import { apiClient } from '@/lib/api-client'
import { ViewAppointmentDialog } from "@/components/view-appointment-dialog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  recorded_at: string | null
  status: string
  created_at: string
  updated_at: string
  clinical_trials_count?: number
  conditions?: string[]
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
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedTrialsAppointmentId, setSelectedTrialsAppointmentId] = useState<string | null>(null)
  const [viewTrialsDialogOpen, setViewTrialsDialogOpen] = useState(false)
  const [savedTrials, setSavedTrials] = useState<Set<string>>(new Set())
  const [savingTrial, setSavingTrial] = useState<string | null>(null)
  const [deletingAppointment, setDeletingAppointment] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null)

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
      toast.error('Failed to fetch appointments. Please try again.')
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
      toast.error('Failed to fetch saved trials. Please try again.')
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
        toast.success('Removed clinical trial from your saved list.')
      } else {
        await apiClient.saveTrial(patientId, trialId)
        setSavedTrials(prev => new Set([...prev, trialId]))
        toast.success('Added clinical trial to your saved list.')
      }
    } catch (err) {
      console.error('Error toggling saved trial:', err)
      toast.error('Failed to update saved trials. Please try again.')
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
    if (patientId) {
      router.push(`/patient/${patientId}/appointments/${appointmentId}/trials`)
    } else {
        router.push(`/admin/appointments/${appointmentId}/trials`)
    }
  }

  const handleDeleteClick = (appointment: Appointment) => {
    setAppointmentToDelete(appointment)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return
    
    setDeletingAppointment(appointmentToDelete.id)
    try {
      await apiClient.deleteAppointment(appointmentToDelete.id)
      toast.success('Appointment deleted successfully')
      fetchAppointments() // Refresh the list
      setDeleteConfirmOpen(false)
      setAppointmentToDelete(null)
    } catch (err) {
      console.error('Error deleting appointment:', err)
      toast.error('Failed to delete appointment. Please try again.')
    } finally {
      setDeletingAppointment(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setAppointmentToDelete(null)
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

  const formatConditions = (conditions: string[] | undefined) => {
    if (!conditions || conditions.length === 0) {
      return <span className="text-gray-500 italic">No conditions recorded</span>
    }
    
    if (conditions.length <= 2) {
      return (
        <div className="flex flex-wrap gap-1">
          {conditions.map((condition, index) => (
            <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {condition}
            </Badge>
          ))}
        </div>
      )
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {conditions.slice(0, 2).map((condition, index) => (
          <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            {condition}
          </Badge>
        ))}
        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
          +{conditions.length - 2} more
        </Badge>
      </div>
    )
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
              <TableHead>Conditions</TableHead>
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
                <TableCell>
                  {formatConditions(appointment.conditions)}
                </TableCell>
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(appointment)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete Appointment
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

      {/* Remove ViewRecommendedTrialsDialog, navigation now handled by router */}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel} disabled={deletingAppointment === appointmentToDelete?.id}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deletingAppointment === appointmentToDelete?.id}
            >
              {deletingAppointment === appointmentToDelete?.id ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Appointment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 