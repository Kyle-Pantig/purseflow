import { PreferencesSettings } from "@/components/preferences-settings"
import { requireAuth } from "@/lib/auth-server"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Preferences",
    description: "Customize your app experience with personalized settings",
}

export default async function PreferencesPage() {
  await requireAuth()
  
  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground">
          Customize your app experience with personalized settings
        </p>
      </div>

      <PreferencesSettings />
    </div>
  )
}
