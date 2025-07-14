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
import { IconDots, IconEye, IconEdit, IconTrash, IconFileText, IconLoader2 } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"
import { EditPatientDialog } from "./edit-patient-dialog"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  sex: string | null
  created_at: string
  updated_at: string
  transcript_count?: number

}

interface PatientsTableProps {
  refreshKey?: number
}

export function PatientsTable({ refreshKey = 0 }: PatientsTableProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPatients()
  }, [refreshKey])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch patients with transcript count
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select(`
          *,
          transcripts:transcripts(count)
        `)
        .order('created_at', { ascending: false })

      if (patientsError) {
        throw patientsError
      }

      // Transform the data to include transcript count
      const transformedPatients = patientsData?.map(patient => ({
        ...patient,
        transcript_count: patient.transcripts?.[0]?.count || 0
      })) || []

      setPatients(transformedPatients)
    } catch (err) {
      console.error('Error fetching patients:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch patients')
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
              <TableHead>Transcripts</TableHead>
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
                <TableCell>{formatDate(patient.date_of_birth)}</TableCell>
                <TableCell>{getSexDisplay(patient.sex)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconFileText className="h-4 w-4" />
                    {patient.transcript_count}
                  </div>
                </TableCell>
                <TableCell>{formatDate(patient.created_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <IconDots className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <IconEye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingPatientId(patient.id)}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit Patient
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <IconFileText className="mr-2 h-4 w-4" />
                        View Transcripts
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
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
    </>
  )
} 