"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconUser } from "@tabler/icons-react"
import { apiClient } from "@/lib/api-client"
import type { Patient } from "@/types"

export function PatientHeader() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  // Extract patient ID from current path
  const getPatientIdFromPath = () => {
    const match = pathname.match(/\/patient\/([^\/]+)/)
    return match ? match[1] : null
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    const patientId = getPatientIdFromPath()
    if (patients.length > 0 && patientId) {
      const found = patients.find(p => p.id === patientId)
      setSelectedPatient(found || patients[0])
    }
  }, [patients, pathname])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getPatients()
      setPatients(data)
    } catch (err) {
      console.error('Error fetching patients:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    if (patient) {
      setSelectedPatient(patient)
      // Navigate to the same page but with the new patient ID
      const currentPath = pathname
      const newPath = currentPath.replace(/\/patient\/[^\/]+/, `/patient/${patientId}`)
      router.push(newPath)
    }
  }

  const formatName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`.trim()
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <IconUser className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Proxy as:</span>
        </div>
        <Select
          value={selectedPatient?.id || ""}
          onValueChange={handlePatientChange}
        >
          <SelectTrigger className="w-64">
            <SelectValue 
              placeholder={loading ? "Loading patients..." : "Select a patient"}
            />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {formatName(patient.first_name, patient.last_name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPatient && (
          <div className="text-sm text-gray-600">
            Currently viewing: <span className="font-medium">{formatName(selectedPatient.first_name, selectedPatient.last_name)}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
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