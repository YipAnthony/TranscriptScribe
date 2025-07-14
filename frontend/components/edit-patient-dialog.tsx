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
import { createClient } from "@/lib/supabase/client"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  sex: string | null
  email: string | null
  phone: string | null
  address_id: string | null
}

interface EditPatientDialogProps {
  patientId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPatientUpdated: () => void
}

export function EditPatientDialog({ patientId, open, onOpenChange, onPatientUpdated }: EditPatientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

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
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select(`
          *,
          addresses:address_id(city, state)
        `)
        .eq('id', patientId)
        .single()

      if (patientError) throw patientError

      setFormData({
        first_name: patient.first_name || "",
        last_name: patient.last_name || "",
        date_of_birth: patient.date_of_birth || "",
        sex: patient.sex || "",
        city: patient.addresses?.city || "",
        state: patient.addresses?.state || "",
      })
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
        throw new Error("First Name and Last Name are required")
      }

      // Validate state field (must be exactly 2 letters if provided)
      if (formData.state && (formData.state.length !== 2 || !/^[A-Za-z]{2}$/.test(formData.state))) {
        throw new Error("State must be exactly 2 letters (e.g., NY, CA)")
      }

      let addressId = null

      // Create or update address if city or state is provided
      if (formData.city || formData.state) {
        // Check if address already exists
        const { data: existingAddress } = await supabase
          .from('addresses')
          .select('id')
          .eq('city', formData.city || null)
          .eq('state', formData.state || null)
          .single()

        if (existingAddress) {
          addressId = existingAddress.id
        } else {
          // Create new address
          const { data: newAddress, error: addressError } = await supabase
            .from('addresses')
            .insert({
              city: formData.city || null,
              state: formData.state || null,
            })
            .select('id')
            .single()

          if (addressError) {
            throw addressError
          }

          addressId = newAddress.id
        }
      }

      // Update patient
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth || null,
          sex: formData.sex || null,
          address_id: addressId,
        })
        .eq('id', patientId)

      if (updateError) {
        throw updateError
      }

      onOpenChange(false)
      onPatientUpdated()
    } catch (err) {
      console.error('Error updating patient:', err)
      setError(err instanceof Error ? err.message : 'Failed to update patient')
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