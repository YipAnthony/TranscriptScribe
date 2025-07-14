"use client"

import { useState } from "react"
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
import { IconDots, IconEye, IconExternalLink, IconStar } from "@tabler/icons-react"

// Sample trial data
const sampleTrials = [
  {
    id: "1",
    title: "Novel Immunotherapy for Advanced Melanoma",
    patient: "John Doe",
    matchScore: 95,
    status: "recommended",
    phase: "Phase 2",
    location: "New York, NY",
    sponsor: "BioTech Inc.",
    lastUpdated: "2024-01-15",
  },
  {
    id: "2",
    title: "Targeted Therapy for Lung Cancer",
    patient: "Jane Smith",
    matchScore: 87,
    status: "pending",
    phase: "Phase 3",
    location: "Los Angeles, CA",
    sponsor: "PharmaCorp",
    lastUpdated: "2024-01-12",
  },
  {
    id: "3",
    title: "Gene Therapy for Rare Diseases",
    patient: "Mike Johnson",
    matchScore: 92,
    status: "recommended",
    phase: "Phase 1",
    location: "Boston, MA",
    sponsor: "GeneTech",
    lastUpdated: "2024-01-10",
  },
  {
    id: "4",
    title: "Precision Medicine for Breast Cancer",
    patient: "Sarah Wilson",
    matchScore: 78,
    status: "reviewed",
    phase: "Phase 2",
    location: "Chicago, IL",
    sponsor: "MedResearch",
    lastUpdated: "2024-01-08",
  },
]

export function TrialsTable() {
  const [trials] = useState(sampleTrials)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "recommended":
        return <Badge variant="default">Recommended</Badge>
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>
      case "reviewed":
        return <Badge variant="outline">Reviewed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trial Title</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Match Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Phase</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Sponsor</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trials.map((trial) => (
            <TableRow key={trial.id}>
              <TableCell className="font-medium max-w-xs truncate">
                {trial.title}
              </TableCell>
              <TableCell>{trial.patient}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <IconStar className={`h-4 w-4 ${getMatchScoreColor(trial.matchScore)}`} />
                  <span className={getMatchScoreColor(trial.matchScore)}>
                    {trial.matchScore}%
                  </span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(trial.status)}</TableCell>
              <TableCell>{trial.phase}</TableCell>
              <TableCell>{trial.location}</TableCell>
              <TableCell>{trial.sponsor}</TableCell>
              <TableCell>{trial.lastUpdated}</TableCell>
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
                    <DropdownMenuItem>
                      <IconExternalLink className="mr-2 h-4 w-4" />
                      View Trial Info
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <IconStar className="mr-2 h-4 w-4" />
                      Update Match Score
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 