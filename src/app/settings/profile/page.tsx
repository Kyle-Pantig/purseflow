import { Metadata } from 'next'
import { ProfileContent } from "@/components/profile-content"
import { requireAuth } from "@/lib/auth-server"

export const metadata: Metadata = {
  title: "Profile Settings - Manage Account & Personal Info",
  description: "Manage your profile information and income settings in your PurseFlow account",
}

export default async function ProfilePage() {
  await requireAuth()
  
  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and income settings
        </p>
      </div>

      <ProfileContent />
    </div>
  )
}
