import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useClubManager } from '@/hooks/useClubManager'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function ClubProfile() {
  const { user } = useAuth()
  const { course } = useClubManager()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) { setFullName(data.full_name ?? ''); setPhone(data.phone ?? '') }
      })
  }, [user])

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() || null, phone: phone.trim() || null }).eq('id', user.id)
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Profile updated')
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) { toast.error('Min 6 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPw(false)
    if (error) toast.error(error.message)
    else { toast.success('Password updated'); setNewPassword(''); setConfirmPassword('') }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-lg font-semibold">My Profile</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Details</CardTitle>
          <CardDescription>Manage for {course?.name ?? 'your course'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="opacity-60" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 82 000 0000" />
          </div>
          <Button onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="Repeat" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <Button type="submit" variant="outline" disabled={changingPw || !newPassword}>
              {changingPw ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
