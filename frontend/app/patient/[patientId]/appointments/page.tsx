"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCalendar, IconRefresh, IconUsers, IconFileDescription, IconLoader2 } from "@tabler/icons-react"
import { AppointmentsTable } from "@/components/appointments-table"
import { apiClient } from '@/lib/api-client'
import type { Patient, Transcript } from "@/types"

export default function PatientAppointmentsPage() {
  const router = useRouter()
  const params = useParams() as { patientId: string }
  const { patientId } = params

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientTranscripts, setPatientTranscripts] = useState<Transcript[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [transcriptLoading, setTranscriptLoading] = useState(false)

  useEffect(() => {
    fetchPatientData()
  }, [patientId])

  const fetchPatientData = async () => {
    try {
      setLoading(true)
      const patient = await apiClient.getPatientById(patientId)
      setSelectedPatient(patient)
      if (patient) {
        await fetchPatientTranscripts(patient.id)
      }
    } catch (err) {
      console.error('Error fetching patient data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatientTranscripts = async (pid: string) => {
    try {
      setTranscriptLoading(true)
      const data = await apiClient.getAppointments(pid)
      setPatientTranscripts(data)
    } catch (err) {
      console.error('Error fetching transcripts:', err)
    } finally {
      setTranscriptLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    if (selectedPatient) {
      fetchPatientTranscripts(selectedPatient.id)
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

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading patient data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            View appointments for the selected patient
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <IconRefresh className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {selectedPatient ? (
        <>
          {/* Patient Info Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Patient Name</CardTitle>
                <IconUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatName(selectedPatient.first_name, selectedPatient.last_name)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Age & Sex</CardTitle>
                <IconUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calculateAge(selectedPatient.date_of_birth || '')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getSexDisplay(selectedPatient.sex || '')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                <IconFileDescription className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientTranscripts.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time appointments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDate(selectedPatient.created_at || '')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Patient registered
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Appointments Table */}
          <AppointmentsTable
            refreshKey={refreshKey}
            patientId={selectedPatient.id}
            showPatientColumn={false}
            isPatientView={true}
          />
        </>
      ) : (
        <div className="flex items-center justify-center h-64">
          <span className="text-gray-500">No patient selected</span>
        </div>
      )}
    </div>
  )
} 