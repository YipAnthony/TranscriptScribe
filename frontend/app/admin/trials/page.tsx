import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconFileDescription, IconSearch, IconFilter } from "@tabler/icons-react"
import { TrialsTable } from "@/components/trials-table"

export default function TrialsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trial Recommendations</h1>
          <p className="text-muted-foreground">
            View and manage clinical trial recommendations for patients
          </p>
        </div>
        <Button>
          <IconFilter className="mr-2 h-4 w-4" />
          Filter Results
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileDescription className="h-5 w-5" />
            Clinical Trial Matches
          </CardTitle>
          <CardDescription>
            AI-generated clinical trial recommendations based on patient transcripts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trials..."
                className="pl-8"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
          <TrialsTable />
        </CardContent>
      </Card>
    </div>
  )
} 