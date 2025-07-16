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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconDots, IconEye, IconEdit, IconTrash, IconFileText, IconLoader2, IconCalendar } from "@tabler/icons-react"
import { apiClient } from '@/lib/api-client'
import { EditPatientDialog } from "./edit-patient-dialog"
import type { Patient } from "@/types"
import { toast } from "sonner"

interface PatientsTableProps {
  refreshKey?: number
}

export function PatientsTable({ refreshKey = 0 }: PatientsTableProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null)
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [refreshKey])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      const patientsData = await apiClient.getPatients()
      setPatients(patientsData)
    } catch (err) {
      console.error('Error fetching patients:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch patients')
      toast.error('Failed to fetch patients. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`
  }

  const getSexDisplay = (sex: string | null) => {
    if (!sex) return 'N/A'
    return sex.charAt(0).toUpperCase() + sex.slice(1).toLowerCase()
  }

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return
    
    try {
      setDeleting(true)
      await apiClient.deletePatient(patientToDelete.id)
      toast.success('Patient deleted successfully')
      fetchPatients() // Refresh the list
      setDeleteConfirmOpen(false)
      setPatientToDelete(null)
    } catch (err) {
      console.error('Error deleting patient:', err)
      toast.error('Failed to delete patient. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setPatientToDelete(null)
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <IconLoader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading patients...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading patients</p>
          <p className="text-sm text-gray-600">{error}</p>
          <Button onClick={fetchPatients} variant="outline" className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No patients found</p>
          <p className="text-sm text-gray-500">Add your first patient to get started</p>
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
              <TableHead>Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Sex</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Appointments</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">
                  {formatName(patient.first_name, patient.last_name)}
                </TableCell>
                <TableCell>{formatDate(patient.date_of_birth || '')}</TableCell>
                <TableCell>{getSexDisplay(patient.sex || '')}</TableCell>
                <TableCell>
                  {(patient.city || patient.state) ? `${patient.city || ''}${patient.city && patient.state ? ', ' : ''}${patient.state || ''}` : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4" />
                    {patient.transcript_count}
                  </div>
                </TableCell>
                <TableCell>{formatDate(patient.created_at || '')}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <IconDots className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
           
                      <DropdownMenuItem onClick={() => setEditingPatientId(patient.id)}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
               
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteClick(patient)}
                      >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete Patient
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditPatientDialog
        patientId={editingPatientId}
        open={!!editingPatientId}
        onOpenChange={(open) => !open && setEditingPatientId(null)}
        onPatientUpdated={fetchPatients}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Patient</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {patientToDelete ? `${patientToDelete.first_name} ${patientToDelete.last_name}` : 'this patient'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Patient'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 