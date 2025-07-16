"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconLoader2 } from "@tabler/icons-react"
import { apiClient } from '@/lib/api-client'
import { toast } from "sonner"

interface EditPatientDialogProps {
  patientId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPatientUpdated: () => void
}

export function EditPatientDialog({ patientId, open, onOpenChange, onPatientUpdated }: EditPatientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    sex: "",
    city: "",
    state: "",
  })

  useEffect(() => {
    if (open && patientId) {
      fetchPatientData()
    }
  }, [open, patientId])

  const fetchPatientData = async () => {
    if (!patientId) return
    try {
      setLoading(true)
      const patient = await apiClient.getPatientById(patientId)
      if (patient) {
        setFormData({
          first_name: patient.first_name || "",
          last_name: patient.last_name || "",
          date_of_birth: patient.date_of_birth || "",
          sex: patient.sex || "",
          city: (patient as any).city || "",
          state: (patient as any).state || "",
        })
      }
    } catch (err) {
      console.error('Error fetching patient data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch patient data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Validate required fields
      if (!formData.first_name || !formData.last_name) {
        toast.error("First Name and Last Name are required")
        setLoading(false)
        return
      }

      // Validate first and last name length
      if (formData.first_name.length < 2) {
        toast.error("First Name must be at least 2 characters long")
        setLoading(false)
        return
      }

      if (formData.last_name.length < 2) {
        toast.error("Last Name must be at least 2 characters long")
        setLoading(false)
        return
      }

      // Validate date of birth
      if (formData.date_of_birth) {
        const birthDate = new Date(formData.date_of_birth)
        const today = new Date()
        const minDate = new Date('1900-01-01')
        
        // Check if date is valid
        if (isNaN(birthDate.getTime())) {
          toast.error("Please enter a valid date of birth")
          setLoading(false)
          return
        }
        
        // Check if date is in the future
        if (birthDate > today) {
          toast.error("Date of birth cannot be in the future")
          setLoading(false)
          return
        }
        
        // Check if date is too far in the past (before 1900)
        if (birthDate < minDate) {
          toast.error("Date of birth cannot be before 1900")
          setLoading(false)
          return
        }
        
        // Check if person would be older than 150 years
        const ageInYears = today.getFullYear() - birthDate.getFullYear()
        if (ageInYears > 150) {
          toast.error("Please enter a valid date of birth (person cannot be older than 150 years)")
          setLoading(false)
          return
        }
      }

      // Validate state field (must be exactly 2 letters if provided)
      if (formData.state && (formData.state.length !== 2 || !/^[A-Za-z]{2}$/.test(formData.state))) {
        toast.error("State must be exactly 2 letters (e.g., NY, CA)")
        setLoading(false)
        return
      }

      // Validate city length if provided
      if (formData.city && formData.city.length < 2) {
        toast.error("City must be at least 2 characters long")
        setLoading(false)
        return
      }

      if (patientId) {
        await apiClient.updatePatient(patientId, formData)
      }
      onOpenChange(false)
      onPatientUpdated()
      toast.success('Patient profile updated!')
    } catch (err) {
      console.error('Error updating patient:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update patient')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
          <DialogDescription>
            Update the patient information below. First Name and Last Name are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="John"
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Doe"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sex">Sex</Label>
                <Select value={formData.sex} onValueChange={(value) => handleInputChange('sex', value)}>
                  <SelectTrigger disabled={loading}>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                                  <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
                </Select>
              </div>
            </div>



            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="New York"
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                  placeholder="NY"
                  maxLength={2}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Patient'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 