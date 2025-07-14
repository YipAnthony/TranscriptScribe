"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { IconUpload, IconFileText, IconUsers } from "@tabler/icons-react"

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedPatient, setSelectedPatient] = useState("")
  const [notes, setNotes] = useState("")

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedPatient) {
      alert("Please select a file and patient")
      return
    }

    // Here you would implement the actual upload logic
    console.log("Uploading file:", selectedFile.name)
    console.log("For patient:", selectedPatient)
    console.log("Notes:", notes)

    // Simulate upload
    alert("Transcript uploaded successfully!")
  }

  // Sample patient data for dropdown
  const patients = [
    { id: "1", name: "John Doe" },
    { id: "2", name: "Jane Smith" },
    { id: "3", name: "Mike Johnson" },
    { id: "4", name: "Sarah Wilson" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Transcript</h1>
        <p className="text-muted-foreground">
          Upload and analyze medical transcripts for patients
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUpload className="h-5 w-5" />
              File Upload
            </CardTitle>
            <CardDescription>
              Select a JSON transcript file to upload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Transcript File</Label>
              <Input
                id="file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Only JSON files are supported
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <IconFileText className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Selected: {selectedFile.name}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUsers className="h-5 w-5" />
              Patient Information
            </CardTitle>
            <CardDescription>
              Link the transcript to a patient
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Select Patient</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this transcript..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Summary</CardTitle>
          <CardDescription>
            Review your upload details before submitting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">File Name</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedFile ? selectedFile.name : "No file selected"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">File Size</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Patient</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedPatient ? patients.find(p => p.id === selectedPatient)?.name : "No patient selected"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <p className="text-sm text-muted-foreground">
                  {notes || "No notes added"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpload} disabled={!selectedFile || !selectedPatient}>
                <IconUpload className="mr-2 h-4 w-4" />
                Upload Transcript
              </Button>
              <Button variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 