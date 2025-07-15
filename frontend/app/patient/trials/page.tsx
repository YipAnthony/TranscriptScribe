"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  IconUser, 
  IconLoader2,
  IconBookmark,
  IconStar,
  IconEye,
  IconCheck,
  IconStethoscope,
  IconMapPin,
  IconTrash,
  IconDots,
  IconChevronDown,
  IconChevronRight
} from "@tabler/icons-react"
import { apiClient } from "@/lib/api-client"
import ReactMarkdown from 'react-markdown'
import type { Patient, ClinicalTrial, ClinicalTrialDetails } from "@/types"

interface SavedTrial {
  id: string
  patient_id: string
  clinical_trial_id: string
  created_at: string
  trial: ClinicalTrial
}

interface ProviderRecommendedTrial {
  id: string
  patient_id: string
  clinical_trial_id: string
  notes: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  trial: ClinicalTrial
}

export default function PatientTrialsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [savedTrials, setSavedTrials] = useState<SavedTrial[]>([])
  const [providerRecommendations, setProviderRecommendations] = useState<ProviderRecommendedTrial[]>([])
  const [acceptedRecommendations, setAcceptedRecommendations] = useState<ProviderRecommendedTrial[]>([])
  const [rejectedRecommendations, setRejectedRecommendations] = useState<ProviderRecommendedTrial[]>([])
  const [providerSuggestions, setProviderSuggestions] = useState<ClinicalTrial[]>([])
  const [loading, setLoading] = useState(true)
  const [trialsLoading, setTrialsLoading] = useState(false)
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null)
  const [selectedTrialDetails, setSelectedTrialDetails] = useState<ClinicalTrialDetails | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [loadingTrialDetails, setLoadingTrialDetails] = useState<Set<string>>(new Set())
  const [showAllLocations, setShowAllLocations] = useState(false)
  const [showFullSummary, setShowFullSummary] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [showRejectedRecommendations, setShowRejectedRecommendations] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientTrials(selectedPatient.id)
    }
  }, [selectedPatient])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getPatientsWithTrials()
      setPatients(data)
      if (data && data.length > 0) {
        setSelectedPatient(data[0])
      }
    } catch (err) {
      console.error('Error fetching patients:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatientTrials = async (patientId: string) => {
    try {
      setTrialsLoading(true)
      const {
        savedTrials,
        providerRecommendations,
        acceptedRecommendations,
        rejectedRecommendations,
        providerSuggestions
      } = await apiClient.getPatientTrials(patientId)
      setSavedTrials(savedTrials)
      setProviderRecommendations(providerRecommendations)
      setAcceptedRecommendations(acceptedRecommendations)
      setRejectedRecommendations(rejectedRecommendations)
      setProviderSuggestions(providerSuggestions)
    } catch (err) {
      console.error('Error fetching patient trials:', err)
    } finally {
      setTrialsLoading(false)
    }
  }

  const handleSaveTrial = async (trialId: string, recommendationId?: string) => {
    if (!selectedPatient) return
    try {
      await apiClient.saveTrialWithRecommendation(selectedPatient.id, trialId, recommendationId)
      fetchPatientTrials(selectedPatient.id)
    } catch (err) {
      console.error('Error saving trial:', err)
    }
  }

  const handleRemoveTrial = async (savedTrialId: string) => {
    if (!selectedPatient) return
    try {
      await apiClient.removeSavedTrialById(savedTrialId)
      fetchPatientTrials(selectedPatient.id)
    } catch (err) {
      console.error('Error removing trial:', err)
    }
  }

  const handleRejectRecommendation = async (recommendationId: string) => {
    if (!selectedPatient) return
    try {
      await apiClient.rejectRecommendation(recommendationId)
      fetchPatientTrials(selectedPatient.id)
    } catch (err) {
      console.error('Error rejecting recommendation:', err)
    }
  }

  const handleRejectSavedTrial = async (savedTrialId: string) => {
    if (!selectedPatient) return
    try {
      await apiClient.rejectSavedTrial(savedTrialId, selectedPatient.id)
      fetchPatientTrials(selectedPatient.id)
    } catch (err) {
      console.error('Error rejecting saved trial:', err)
    }
  }

  const handleEnroll = async () => {
    if (!selectedTrial) return

    setEnrolling(true)
    try {
      // Here you would implement the enrollment logic
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Close the dialog
      setDetailsDialogOpen(false)
      setSelectedTrial(null)
      
      // Show success message (you could add a toast notification here)
      alert('Enrollment request submitted successfully!')
    } catch (err) {
      console.error('Error enrolling in trial:', err)
    } finally {
      setEnrolling(false)
    }
  }

  const unescapeText = (text: string): string => {
    if (!text) return text;
    
    // Unescape common LaTeX/HTML entities
    return text
      .replace(/\\>/g, '>')  // Unescape greater than
      .replace(/\\</g, '<')  // Unescape less than
      .replace(/\\&/g, '&')  // Unescape ampersand
      .replace(/\\"/g, '"')  // Unescape quotes
      .replace(/\\'/g, "'")  // Unescape single quotes
      .replace(/\\\\/g, '\\'); // Unescape backslashes
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return 'No description available'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      RECRUITING: { color: 'bg-green-100 text-green-800', label: 'Recruiting' },
      ACTIVE_NOT_RECRUITING: { color: 'bg-yellow-100 text-yellow-800', label: 'Active' },
      COMPLETED: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      TERMINATED: { color: 'bg-red-100 text-red-800', label: 'Terminated' },
      SUSPENDED: { color: 'bg-orange-100 text-orange-800', label: 'Suspended' },
      WITHDRAWN: { color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', label: status }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getRecommendationStatusBadge = (status: 'pending' | 'accepted' | 'rejected') => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    }
    
    const config = statusConfig[status]
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const fetchTrialDetails = async (trialId: string) => {
    try {
      // Add trial ID to loading set
      setLoadingTrialDetails(prev => new Set(prev).add(trialId))
      
      const response = await apiClient.getClinicalTrial(trialId)
      
      if (response.error) {
        console.error('Error fetching trial details:', response.error)
        return
      }
      
      if (response.data?.trial) {
        setSelectedTrialDetails(response.data.trial)
        setShowAllLocations(false)
        setShowFullSummary(false)
        setShowFullDescription(false)
      }
    } catch (err) {
      console.error('Error fetching trial details:', err)
    } finally {
      // Remove trial ID from loading set
      setLoadingTrialDetails(prev => {
        const newSet = new Set(prev)
        newSet.delete(trialId)
        return newSet
      })
    }
  }

  const handleAcceptAndSaveRejected = async (recommendation: ProviderRecommendedTrial) => {
    if (!selectedPatient) return
    try {
      await apiClient.acceptAndSaveRejected(recommendation)
      fetchPatientTrials(selectedPatient.id)
    } catch (err) {
      console.error('Error accepting and saving rejected trial:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading patients...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Patient Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Clinical Trials</h1>
          <p className="text-muted-foreground">
            View your saved clinical trials and provider recommendations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <IconUser className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Proxy as:</span>
          </div>
          <Select
            value={selectedPatient?.id || ""}
            onValueChange={(value) => {
              const patient = patients.find(p => p.id === value)
              setSelectedPatient(patient || null)
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {formatName(patient.first_name, patient.last_name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedPatient ? (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saved Trials</CardTitle>
                <IconBookmark className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{savedTrials.length}</div>
                <p className="text-xs text-muted-foreground">
                  Trials you've saved
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Recommendations</CardTitle>
                <IconStar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{providerRecommendations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Trials awaiting your decision
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepted Recommendations</CardTitle>
                <IconCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{acceptedRecommendations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Trials you've accepted
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Saved Trials Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBookmark className="h-5 w-5" />
                Saved Clinical Trials
              </CardTitle>
              <CardDescription>
                Clinical trials you've saved for {formatName(selectedPatient.first_name, selectedPatient.last_name)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trialsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <IconLoader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading trials...</span>
                </div>
              ) : savedTrials.length === 0 ? (
                <div className="text-center py-8">
                  <IconBookmark className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No saved trials</h3>
                  <p className="text-gray-500">
                    You haven't saved any clinical trials yet. Check your appointments page to see potential trials.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trial ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Conditions</TableHead>
                        <TableHead>Saved Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedTrials.map((savedTrial) => (
                        <TableRow key={savedTrial.id}>
                          <TableCell className="font-medium">
                            {savedTrial.trial.external_id}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="font-medium truncate" title={savedTrial.trial.brief_title}>
                              {savedTrial.trial.brief_title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {savedTrial.trial.conditions?.slice(0, 2).map((condition, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {condition}
                                </Badge>
                              ))}
                              {savedTrial.trial.conditions && savedTrial.trial.conditions.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{savedTrial.trial.conditions.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(savedTrial.created_at)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <IconDots className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTrial(savedTrial.trial)
                                    fetchTrialDetails(savedTrial.trial.external_id)
                                    setDetailsDialogOpen(true)
                                  }}
                                  disabled={loadingTrialDetails.has(savedTrial.trial.external_id)}
                                >
                                  {loadingTrialDetails.has(savedTrial.trial.external_id) ? (
                                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <IconEye className="mr-2 h-4 w-4" />
                                  )}
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRemoveTrial(savedTrial.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <IconTrash className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Provider Recommendations Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconStar className="h-5 w-5" />
                Pending Provider Recommendations
              </CardTitle>
              <CardDescription>
                Clinical trials recommended by your healthcare provider awaiting your decision.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trialsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <IconLoader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading recommendations...</span>
                </div>
              ) : providerRecommendations.length === 0 ? (
                <div className="text-center py-4">
                  <IconStar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No pending recommendations</h3>
                  <p className="text-xs text-gray-500">
                    You have no pending provider recommendations at this time.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trial ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Conditions</TableHead>
                        <TableHead>Provider Notes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recommended Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providerRecommendations.map((recommendation) => (
                        <React.Fragment key={recommendation.id}>
                          <TableRow>
                            <TableCell className="font-medium">
                              {recommendation.trial.external_id}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="font-medium truncate" title={recommendation.trial.brief_title}>
                                {recommendation.trial.brief_title}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {recommendation.trial.conditions?.slice(0, 2).map((condition, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {condition}
                                  </Badge>
                                ))}
                                {recommendation.trial.conditions && recommendation.trial.conditions.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{recommendation.trial.conditions.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-600 truncate flex-1" title={recommendation.notes || 'No notes provided'}>
                                  {recommendation.notes || 'No notes provided'}
                                </div>
                                {recommendation.notes && recommendation.notes.length > 50 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newExpanded = new Set(expandedNotes)
                                      if (newExpanded.has(recommendation.id)) {
                                        newExpanded.delete(recommendation.id)
                                      } else {
                                        newExpanded.add(recommendation.id)
                                      }
                                      setExpandedNotes(newExpanded)
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    {expandedNotes.has(recommendation.id) ? (
                                      <IconChevronDown className="h-3 w-3" />
                                    ) : (
                                      <IconChevronRight className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                                                      <TableCell>
                            {getRecommendationStatusBadge(recommendation.status)}
                          </TableCell>
                          <TableCell>
                            {formatDate(recommendation.created_at)}
                          </TableCell>
                          <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <IconDots className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedTrial(recommendation.trial)
                                      fetchTrialDetails(recommendation.trial.external_id)
                                      setDetailsDialogOpen(true)
                                    }}
                                    disabled={loadingTrialDetails.has(recommendation.trial.external_id)}
                                  >
                                    {loadingTrialDetails.has(recommendation.trial.external_id) ? (
                                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <IconEye className="mr-2 h-4 w-4" />
                                    )}
                                    View Details
                                  </DropdownMenuItem>
                                                                  <DropdownMenuItem
                                  onClick={() => handleSaveTrial(recommendation.trial.id, recommendation.id)}
                                >
                                  <IconBookmark className="mr-2 h-4 w-4" />
                                  Accept & Save Trial
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRejectRecommendation(recommendation.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <IconTrash className="mr-2 h-4 w-4" />
                                  Reject Recommendation
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          {/* Expanded Notes Row */}
                          {expandedNotes.has(recommendation.id) && recommendation.notes && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-gray-50 border-t-0">
                                <div className="p-4">
                                  <div className="flex items-start gap-3">
                                    <IconStethoscope className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm text-gray-900 mb-2">Provider Notes</h4>
                                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-md border">
                                        {recommendation.notes}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rejected Provider Recommendations Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTrash className="h-5 w-5" />
                Rejected Provider Recommendations
              </CardTitle>
              <CardDescription>
                Clinical trials recommended by your healthcare provider that you've rejected.
              </CardDescription>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectedRecommendations(!showRejectedRecommendations)}
                  className="text-xs"
                >
                  {showRejectedRecommendations ? 'Hide' : 'Show'} Rejected Recommendations ({rejectedRecommendations.length})
                </Button>
              </div>
            </CardHeader>
            {showRejectedRecommendations && (
              <CardContent>
                {trialsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <IconLoader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading rejected recommendations...</span>
                  </div>
                ) : rejectedRecommendations.length === 0 ? (
                  <div className="text-center py-4">
                    <IconTrash className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No rejected recommendations</h3>
                    <p className="text-xs text-gray-500">
                      You haven't rejected any provider recommendations yet.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Trial ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Conditions</TableHead>
                          <TableHead>Provider Notes</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Rejected Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectedRecommendations.map((recommendation) => (
                          <React.Fragment key={recommendation.id}>
                            <TableRow>
                              <TableCell className="font-medium">
                                {recommendation.trial.external_id}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <div className="font-medium truncate" title={recommendation.trial.brief_title}>
                                  {recommendation.trial.brief_title}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {recommendation.trial.conditions?.slice(0, 2).map((condition, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {condition}
                                    </Badge>
                                  ))}
                                  {recommendation.trial.conditions && recommendation.trial.conditions.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{recommendation.trial.conditions.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm text-gray-600 truncate flex-1" title={recommendation.notes || 'No notes provided'}>
                                    {recommendation.notes || 'No notes provided'}
                                  </div>
                                  {recommendation.notes && recommendation.notes.length > 50 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newExpanded = new Set(expandedNotes)
                                        if (newExpanded.has(recommendation.id)) {
                                          newExpanded.delete(recommendation.id)
                                        } else {
                                          newExpanded.add(recommendation.id)
                                        }
                                        setExpandedNotes(newExpanded)
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      {expandedNotes.has(recommendation.id) ? (
                                        <IconChevronDown className="h-3 w-3" />
                                      ) : (
                                        <IconChevronRight className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getRecommendationStatusBadge(recommendation.status)}
                              </TableCell>
                              <TableCell>
                                {formatDate(recommendation.created_at)}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <IconDots className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedTrial(recommendation.trial)
                                        fetchTrialDetails(recommendation.trial.external_id)
                                        setDetailsDialogOpen(true)
                                      }}
                                      disabled={loadingTrialDetails.has(recommendation.trial.external_id)}
                                    >
                                      {loadingTrialDetails.has(recommendation.trial.external_id) ? (
                                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <IconEye className="mr-2 h-4 w-4" />
                                      )}
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleAcceptAndSaveRejected(recommendation)}
                                    >
                                      <IconBookmark className="mr-2 h-4 w-4" />
                                      Accept & Save Trial
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                            {/* Expanded Notes Row */}
                            {expandedNotes.has(recommendation.id) && recommendation.notes && (
                              <TableRow>
                                <TableCell colSpan={7} className="bg-gray-50 border-t-0">
                                  <div className="p-4">
                                    <div className="flex items-start gap-3">
                                      <IconStethoscope className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <h4 className="font-medium text-sm text-gray-900 mb-2">Provider Notes</h4>
                                        <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-md border">
                                          {recommendation.notes}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <IconUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patient selected</h3>
            <p className="text-gray-500">
              Please select a patient to view their clinical trials.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Trial Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconStar className="h-5 w-5" />
              Clinical Trial Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about the clinical trial
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrialDetails ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Status</h4>
                  {getStatusBadge(selectedTrialDetails.status)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Sponsor</h4>
                  <p className="text-sm">{selectedTrialDetails.sponsor_name || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Study Type</h4>
                  <p className="text-sm">{selectedTrialDetails.study_type || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Phases</h4>
                  <p className="text-sm">{selectedTrialDetails.phases.length > 0 ? selectedTrialDetails.phases.join(', ') : 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Enrollment</h4>
                  <p className="text-sm">{selectedTrialDetails.enrollment_count || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Age Range</h4>
                  <p className="text-sm">
                    {selectedTrialDetails.minimum_age && selectedTrialDetails.maximum_age 
                      ? `${selectedTrialDetails.minimum_age} - ${selectedTrialDetails.maximum_age}`
                      : 'Not specified'
                    }
                  </p>
                </div>
              </div>

              {/* Conditions */}
              {selectedTrialDetails.conditions && selectedTrialDetails.conditions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Conditions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrialDetails.conditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Brief Summary */}
              {selectedTrialDetails.brief_summary && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Brief Summary</h4>
                  <div className="prose prose-sm max-w-none text-sm text-gray-600">
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="mb-2">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        li: ({children}) => <li className="text-sm">{children}</li>,
                      }}
                    >
                      {showFullSummary 
                        ? unescapeText(selectedTrialDetails.brief_summary)
                        : unescapeText(selectedTrialDetails.brief_summary.length > 600 
                            ? selectedTrialDetails.brief_summary.substring(0, 600) + '...'
                            : selectedTrialDetails.brief_summary
                          )
                      }
                    </ReactMarkdown>
                    {selectedTrialDetails.brief_summary.length > 600 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullSummary(!showFullSummary)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                      >
                        {showFullSummary ? 'Show Less' : 'Show More'}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Description */}
              {selectedTrialDetails.detailed_description && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Detailed Description</h4>
                  <div className="prose prose-sm max-w-none text-sm text-gray-600">
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="mb-2">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        li: ({children}) => <li className="text-sm">{children}</li>,
                      }}
                    >
                      {showFullDescription 
                        ? unescapeText(selectedTrialDetails.detailed_description)
                        : unescapeText(selectedTrialDetails.detailed_description.length > 800 
                            ? selectedTrialDetails.detailed_description.substring(0, 800) + '...'
                            : selectedTrialDetails.detailed_description
                          )
                      }
                    </ReactMarkdown>
                    {selectedTrialDetails.detailed_description.length > 800 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                      >
                        {showFullDescription ? 'Show Less' : 'Show More'}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Eligibility Criteria */}
              {selectedTrialDetails.eligibility_criteria && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Eligibility Criteria</h4>
                  <div className="prose prose-sm max-w-none text-sm text-gray-600">
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="mb-2">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        li: ({children}) => <li className="text-sm">{children}</li>,
                      }}
                    >
                      {unescapeText(selectedTrialDetails.eligibility_criteria)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Interventions */}
              {selectedTrialDetails.interventions && selectedTrialDetails.interventions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Interventions</h4>
                  <div className="space-y-2">
                    {selectedTrialDetails.interventions.map((intervention, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">{intervention.name}</div>
                        <div className="text-xs text-gray-600">Type: {intervention.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outcomes */}
              {(selectedTrialDetails.primary_outcomes.length > 0 || selectedTrialDetails.secondary_outcomes.length > 0) && (
                <Accordion type="single" collapsible className="w-full">
                  {selectedTrialDetails.primary_outcomes.length > 0 && (
                    <AccordionItem value="primary-outcomes">
                      <AccordionTrigger className="font-semibold text-sm">
                        Primary Outcomes ({selectedTrialDetails.primary_outcomes.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {selectedTrialDetails.primary_outcomes.map((outcome, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="font-medium text-sm">{outcome.measure}</div>
                              <div className="text-xs text-gray-600 mt-1">{outcome.description}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Time Frame: {outcome.time_frame} | Type: {outcome.outcome_type}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                  {selectedTrialDetails.secondary_outcomes.length > 0 && (
                    <AccordionItem value="secondary-outcomes">
                      <AccordionTrigger className="font-semibold text-sm">
                        Secondary Outcomes ({selectedTrialDetails.secondary_outcomes.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {selectedTrialDetails.secondary_outcomes.map((outcome, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="font-medium text-sm">{outcome.measure}</div>
                              <div className="text-xs text-gray-600 mt-1">{outcome.description}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Time Frame: {outcome.time_frame} | Type: {outcome.outcome_type}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              )}

              {/* Locations */}
              {selectedTrialDetails.locations && selectedTrialDetails.locations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">
                    Locations ({selectedTrialDetails.locations.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(showAllLocations 
                      ? selectedTrialDetails.locations 
                      : selectedTrialDetails.locations.slice(0, 6)
                    ).map((location, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-md">
                        <IconMapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                        <span className="truncate">{location}</span>
                      </div>
                    ))}
                  </div>
                  {selectedTrialDetails.locations.length > 6 && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllLocations(!showAllLocations)}
                        className="text-xs"
                      >
                        {showAllLocations ? 'Show Less' : `Show ${selectedTrialDetails.locations.length - 6} More Locations`}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Contacts */}
              {(selectedTrialDetails.central_contacts.length > 0 || selectedTrialDetails.overall_officials.length > 0) && (
                <Accordion type="single" collapsible className="w-full">
                  {selectedTrialDetails.central_contacts.length > 0 && (
                    <AccordionItem value="central-contacts">
                      <AccordionTrigger className="font-semibold text-sm">
                        Central Contacts ({selectedTrialDetails.central_contacts.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {selectedTrialDetails.central_contacts.map((contact, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="font-medium text-sm">{contact.name}</div>
                              {contact.email && <div className="text-xs text-gray-600">Email: {contact.email}</div>}
                              {contact.phone && <div className="text-xs text-gray-600">Phone: {contact.phone}</div>}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                  {selectedTrialDetails.overall_officials.length > 0 && (
                    <AccordionItem value="overall-officials">
                      <AccordionTrigger className="font-semibold text-sm">
                        Overall Officials ({selectedTrialDetails.overall_officials.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {selectedTrialDetails.overall_officials.map((contact, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="font-medium text-sm">{contact.name}</div>
                              {contact.email && <div className="text-xs text-gray-600">Email: {contact.email}</div>}
                              {contact.phone && <div className="text-xs text-gray-600">Phone: {contact.phone}</div>}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Start Date</h4>
                  <p className="text-sm">{formatDate(selectedTrialDetails.start_date || null)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Completion Date</h4>
                  <p className="text-sm">{formatDate(selectedTrialDetails.completion_date || null)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Primary Completion</h4>
                  <p className="text-sm">{formatDate(selectedTrialDetails.primary_completion_date || null)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Last Updated</h4>
                  <p className="text-sm">{formatDate(selectedTrialDetails.last_updated || null)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDetailsDialogOpen(false)
                    setSelectedTrialDetails(null)
                  }}
                >
                  Close
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  
                    <>
                      Enroll in Trial
                    </>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <IconLoader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading trial details...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 