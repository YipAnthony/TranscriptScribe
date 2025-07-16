"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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
import { toast } from "sonner"

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
  const router = useRouter()
  const params = useParams() as { patientId: string }
  const { patientId } = params

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [savedTrials, setSavedTrials] = useState<SavedTrial[]>([])
  const [providerRecommendations, setProviderRecommendations] = useState<ProviderRecommendedTrial[]>([])
  const [acceptedRecommendations, setAcceptedRecommendations] = useState<ProviderRecommendedTrial[]>([])
  const [rejectedRecommendations, setRejectedRecommendations] = useState<ProviderRecommendedTrial[]>([])
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
    if (patientId) {
      fetchPatientData()
    }
  }, [patientId])

  const fetchPatientData = async () => {
    try {
      setLoading(true)
      const patient = await apiClient.getPatientById(patientId)
      setSelectedPatient(patient)
      if (patient) {
        await fetchPatientTrials(patient.id)
      }
    } catch (err) {
      console.error('Error fetching patient data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatientTrials = async (patientId: string) => {
    try {
      setTrialsLoading(true)
      const data = await apiClient.getPatientTrials(patientId)
      setSavedTrials(data.savedTrials)
      setProviderRecommendations(data.providerRecommendations)
      setAcceptedRecommendations(data.acceptedRecommendations)
      setRejectedRecommendations(data.rejectedRecommendations)
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
      await fetchPatientTrials(selectedPatient.id)
      toast.success('Trial saved successfully')
    } catch (err) {
      console.error('Error saving trial:', err)
      toast.error('Failed to save trial')
    }
  }

  const handleRemoveTrial = async (savedTrialId: string) => {
    try {
      await apiClient.removeSavedTrialById(savedTrialId)
      await fetchPatientTrials(selectedPatient!.id)
      toast.success('Trial removed successfully')
    } catch (err) {
      console.error('Error removing trial:', err)
      toast.error('Failed to remove trial')
    }
  }

  const handleRejectRecommendation = async (recommendationId: string) => {
    try {
      await apiClient.rejectRecommendation(recommendationId)
      await fetchPatientTrials(selectedPatient!.id)
      toast.success('Recommendation rejected')
    } catch (err) {
      console.error('Error rejecting recommendation:', err)
      toast.error('Failed to reject recommendation')
    }
  }

  const handleRejectSavedTrial = async (savedTrialId: string) => {
    if (!selectedPatient) return
    try {
      await apiClient.rejectSavedTrial(savedTrialId, selectedPatient.id)
      await fetchPatientTrials(selectedPatient.id)
      toast.success('Trial rejected successfully')
    } catch (err) {
      console.error('Error rejecting trial:', err)
      toast.error('Failed to reject trial')
    }
  }

  const handleEnroll = async () => {
    setEnrolling(true)
    // Simulate enrollment process
    setTimeout(() => {
      setEnrolling(false)
      setDetailsDialogOpen(false)
      toast.success('Enrollment request submitted successfully!')
    }, 2000)
  }

  const unescapeText = (text: string): string => {
    if (!text) return text;
    return text
      .replace(/\\>/g, '>')
      .replace(/\\</g, '<')
      .replace(/\\&/g, '&')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECRUITING':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Recruiting</Badge>
      case 'COMPLETED':
        return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Completed</Badge>
      case 'SUSPENDED':
        return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Suspended</Badge>
      case 'TERMINATED':
        return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Terminated</Badge>
      default:
        return <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">{status}</Badge>
    }
  }

  const getRecommendationStatusBadge = (status: 'pending' | 'accepted' | 'rejected') => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
      case 'accepted':
        return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Accepted</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Rejected</Badge>
    }
  }

  const fetchTrialDetails = async (trialId: string) => {
    setLoadingTrialDetails(prev => new Set([...prev, trialId]))
    try {
      const response = await apiClient.getClinicalTrial(trialId)
      if (response.trial) {
        setSelectedTrialDetails(response.trial)
      }
    } catch (err) {
      console.error('Error fetching trial details:', err)
      toast.error('Failed to load trial details')
    } finally {
      setLoadingTrialDetails(prev => {
        const newSet = new Set(prev)
        newSet.delete(trialId)
        return newSet
      })
    }
  }

  const handleAcceptAndSaveRejected = async (recommendation: ProviderRecommendedTrial) => {
    try {
      await apiClient.acceptAndSaveRejected(recommendation)
      await fetchPatientTrials(selectedPatient!.id)
      toast.success('Recommendation accepted and saved')
    } catch (err) {
      console.error('Error accepting recommendation:', err)
      toast.error('Failed to accept recommendation')
    }
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
          <h1 className="text-3xl font-bold tracking-tight">My Clinical Trials</h1>
          <p className="text-muted-foreground">
            View your saved clinical trials and provider recommendations
          </p>
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
                                    fetchTrialDetails(savedTrial.trial.id)
                                    setDetailsDialogOpen(true)
                                  }}
                                  disabled={loadingTrialDetails.has(savedTrial.trial.id)}
                                >
                                  {loadingTrialDetails.has(savedTrial.trial.id) ? (
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
              {providerRecommendations.length === 0 ? (
                <div className="text-center py-8">
                  <IconStar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending recommendations</h3>
                  <p className="text-gray-500">
                    You don't have any pending provider recommendations at this time.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trial ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Provider Notes</TableHead>
                        <TableHead>Recommended Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providerRecommendations.map((recommendation) => (
                        <TableRow key={recommendation.id}>
                          <TableCell className="font-medium">
                            {recommendation.trial.external_id}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="font-medium truncate" title={recommendation.trial.brief_title}>
                              {recommendation.trial.brief_title}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm">
                              {recommendation.notes ? (
                                <div>
                                  {expandedNotes.has(recommendation.id) 
                                    ? recommendation.notes
                                    : truncateText(recommendation.notes, 50)
                                  }
                                  {recommendation.notes.length > 50 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setExpandedNotes(prev => {
                                          const newSet = new Set(prev)
                                          if (newSet.has(recommendation.id)) {
                                            newSet.delete(recommendation.id)
                                          } else {
                                            newSet.add(recommendation.id)
                                          }
                                          return newSet
                                        })
                                      }}
                                      className="ml-2 text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                                    >
                                      {expandedNotes.has(recommendation.id) ? 'Show Less' : 'Show More'}
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">No notes provided</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(recommendation.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveTrial(recommendation.trial.id, recommendation.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <IconCheck className="mr-1 h-3 w-3" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectRecommendation(recommendation.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <IconTrash className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accepted Recommendations Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCheck className="h-5 w-5" />
                Accepted Recommendations
              </CardTitle>
              <CardDescription>
                Clinical trials you've accepted from your healthcare provider.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {acceptedRecommendations.length === 0 ? (
                <div className="text-center py-8">
                  <IconCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No accepted recommendations</h3>
                  <p className="text-gray-500">
                    You haven't accepted any provider recommendations yet.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trial ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Provider Notes</TableHead>
                        <TableHead>Accepted Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {acceptedRecommendations.map((recommendation) => (
                        <TableRow key={recommendation.id}>
                          <TableCell className="font-medium">
                            {recommendation.trial.external_id}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="font-medium truncate" title={recommendation.trial.brief_title}>
                              {recommendation.trial.brief_title}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm">
                              {recommendation.notes ? (
                                <div>
                                  {expandedNotes.has(recommendation.id) 
                                    ? recommendation.notes
                                    : truncateText(recommendation.notes, 50)
                                  }
                                  {recommendation.notes.length > 50 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setExpandedNotes(prev => {
                                          const newSet = new Set(prev)
                                          if (newSet.has(recommendation.id)) {
                                            newSet.delete(recommendation.id)
                                          } else {
                                            newSet.add(recommendation.id)
                                          }
                                          return newSet
                                        })
                                      }}
                                      className="ml-2 text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                                    >
                                      {expandedNotes.has(recommendation.id) ? 'Show Less' : 'Show More'}
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">No notes provided</span>
                              )}
                            </div>
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
                                    fetchTrialDetails(recommendation.trial.id)
                                    setDetailsDialogOpen(true)
                                  }}
                                  disabled={loadingTrialDetails.has(recommendation.trial.id)}
                                >
                                  {loadingTrialDetails.has(recommendation.trial.id) ? (
                                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <IconEye className="mr-2 h-4 w-4" />
                                  )}
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRejectSavedTrial(recommendation.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <IconTrash className="mr-2 h-4 w-4" />
                                  Reject
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

          {/* Rejected Recommendations Section */}
          {rejectedRecommendations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <IconTrash className="h-5 w-5" />
                    Rejected Recommendations
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRejectedRecommendations(!showRejectedRecommendations)}
                  >
                    {showRejectedRecommendations ? <IconChevronDown className="h-4 w-4" /> : <IconChevronRight className="h-4 w-4" />}
                    {showRejectedRecommendations ? 'Hide' : 'Show'} ({rejectedRecommendations.length})
                  </Button>
                </div>
                <CardDescription>
                  Clinical trials you've rejected from your healthcare provider.
                </CardDescription>
              </CardHeader>
              {showRejectedRecommendations && (
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Trial ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Provider Notes</TableHead>
                          <TableHead>Rejected Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectedRecommendations.map((recommendation) => (
                          <TableRow key={recommendation.id}>
                            <TableCell className="font-medium">
                              {recommendation.trial.external_id}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="font-medium truncate" title={recommendation.trial.brief_title}>
                                {recommendation.trial.brief_title}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm">
                                {recommendation.notes ? (
                                  <div>
                                    {expandedNotes.has(recommendation.id) 
                                      ? recommendation.notes
                                      : truncateText(recommendation.notes, 50)
                                    }
                                    {recommendation.notes.length > 50 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setExpandedNotes(prev => {
                                            const newSet = new Set(prev)
                                            if (newSet.has(recommendation.id)) {
                                              newSet.delete(recommendation.id)
                                            } else {
                                              newSet.add(recommendation.id)
                                            }
                                            return newSet
                                          })
                                        }}
                                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                                      >
                                        {expandedNotes.has(recommendation.id) ? 'Show Less' : 'Show More'}
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">No notes provided</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(recommendation.created_at)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptAndSaveRejected(recommendation)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <IconCheck className="mr-1 h-3 w-3" />
                                Accept & Save
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-64">
          <span className="text-gray-500">No patient selected</span>
        </div>
      )}

      {/* Trial Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trial Details</DialogTitle>
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
                  <p className="text-sm">{Array.isArray(selectedTrialDetails.phases) && selectedTrialDetails.phases.length > 0 ? selectedTrialDetails.phases.join(', ') : 'Not specified'}</p>
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

              {/* Locations */}
              {selectedTrialDetails.locations && selectedTrialDetails.locations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Study Locations</h4>
                  <div className="space-y-2">
                    {(showAllLocations ? selectedTrialDetails.locations : selectedTrialDetails.locations.slice(0, 5)).map((location, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <IconMapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{location}</span>
                      </div>
                    ))}
                    {selectedTrialDetails.locations.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllLocations(!showAllLocations)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {showAllLocations ? 'Show Less' : `Show ${selectedTrialDetails.locations.length - 5} More Locations`}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Enrollment Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {enrolling ? (
                    <>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <IconStethoscope className="mr-2 h-4 w-4" />
                      Request Enrollment
                    </>
                  )}
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