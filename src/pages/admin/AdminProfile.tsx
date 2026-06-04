import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/types/app.types'

export function AdminProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Password change fields
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile)
        setLoading(false)
      })
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name?.trim() || null,
      phone: profile.phone?.trim() || null,
      avatar_url: profile.avatar_url || null,
    }).eq('id', user.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Profile updated')
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)
    if (error) { toast.error(error.message); return }
    toast.success('Password updated')
    setNewPassword('')
    setConfirmPassword('')
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'A'

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">My Profile</h2>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Details</CardTitle>
          <CardDescription>Update your name, phone, and profile photo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile.full_name || 'Admin'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Separator />

          {/* Avatar upload */}
          <div className="space-y-1.5">
            <Label>Profile Photo</Label>
            <ImageUpload
              value={profile.avatar_url ?? null}
              onChange={url => setProfile(p => ({ ...p, avatar_url: url }))}
              bucket="course-images"
              folder="avatars"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="Jane Smith"
                value={profile.full_name ?? ''}
                onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ''} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+27 82 000 0000"
                value={profile.phone ?? ''}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Password change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
          <CardDescription>Set a new password for your admin account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={changingPassword || !newPassword} variant="outline">
              {changingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
