"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconUsers, IconSearch, IconRefresh } from "@tabler/icons-react"
import { PatientsTable } from "@/components/patients-table"
import { AddPatientDialog } from "@/components/add-patient-dialog"
import { createClient } from "@/lib/supabase/client"

export default function PatientsPage() {
  const [patientCount, setPatientCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    fetchPatientCount()
  }, [])

  const fetchPatientCount = async () => {
    try {
      setLoading(true)
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error('Error fetching patient count:', error)
      } else {
        setPatientCount(count || 0)
      }
    } catch (err) {
      console.error('Error fetching patient count:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePatientAdded = () => {
    // Refresh both the count and the table
    fetchPatientCount()
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            Manage patient records and view their transcript analysis
            {!loading && (
              <span className="ml-2 text-sm font-medium">
                ({patientCount} {patientCount === 1 ? 'patient' : 'patients'})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPatientCount}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <AddPatientDialog onPatientAdded={handlePatientAdded} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUsers className="h-5 w-5" />
            Patient Records
          </CardTitle>
          <CardDescription>
            View and manage all patient information from your Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                className="pl-8"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
          <PatientsTable refreshKey={refreshKey} />
        </CardContent>
      </Card>
    </div>
  )
} 