"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus, IconLoader2 } from "@tabler/icons-react"
import { apiClient } from '@/lib/api-client'
import { toast } from "sonner"

interface AddPatientDialogProps {
  onPatientAdded: () => void
}

export function AddPatientDialog({ onPatientAdded }: AddPatientDialogProps) {
  const [open, setOpen] = useState(false)
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

      await apiClient.addPatient(formData)

      // Reset form and close dialog
      setFormData({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        sex: "",
        city: "",
        state: "",
      })
      setOpen(false)
      onPatientAdded()
      toast.success('Patient added successfully!')
    } catch (err) {
      console.error('Error adding patient:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to add patient')
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          Add New Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Enter the patient information below. First Name and Last Name are required.
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Patient'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 