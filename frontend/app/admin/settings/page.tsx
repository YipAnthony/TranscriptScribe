import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconSettings } from "@tabler/icons-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSettings className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Application configuration and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <IconSettings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                System configuration options will be available here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 