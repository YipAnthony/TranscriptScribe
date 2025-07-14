import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Search across patients, transcripts, and clinical trials
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSearch className="h-5 w-5" />
            Advanced Search
          </CardTitle>
          <CardDescription>
            Search functionality coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <IconSearch className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Search functionality</h3>
              <p className="mt-1 text-sm text-gray-500">
                Advanced search and filtering will be available soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 