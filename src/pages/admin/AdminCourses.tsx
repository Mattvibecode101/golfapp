import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Upload, Star, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import type { GolfCourse } from '@/types/app.types'

const EMPTY: Partial<GolfCourse> = {
  name: '', city: '', country: 'South Africa', holes: 18, par: 72,
  green_fee_min: 0, green_fee_max: 0, description: '', address: '',
  phone: '', website: '', image_url: null, rating: null, is_active: true,
}

export function AdminCourses() {
  const [courses, setCourses] = useState<GolfCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<GolfCourse>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)
  const [search, setSearch] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignCourse, setAssignCourse] = useState<GolfCourse | null>(null)
  const [assignEmail, setAssignEmail] = useState('')
  const [assigning, setAssigning] = useState(false)

  const fetchCourses = () => {
    setLoading(true)
    supabase.from('golf_courses').select('*').order('name')
      .then(({ data }) => { setCourses((data ?? []) as GolfCourse[]); setLoading(false) })
  }

  useEffect(() => { fetchCourses() }, [])

  const openNew = () => { setEditing({ ...EMPTY }); setOpen(true) }
  const openEdit = (c: GolfCourse) => { setEditing({ ...c }); setOpen(true) }

  const handleSave = async () => {
    if (!editing.name?.trim() || !editing.city?.trim()) {
      toast.error('Course name and city are required')
      return
    }
    setSaving(true)
    const payload = {
      name: editing.name.trim(),
      city: editing.city.trim(),
      country: editing.country?.trim() || 'South Africa',
      holes: Number(editing.holes) || 18,
      par: Number(editing.par) || 72,
      green_fee_min: Number(editing.green_fee_min) || 0,
      green_fee_max: Number(editing.green_fee_max) || 0,
      description: editing.description?.trim() || null,
      address: editing.address?.trim() || null,
      phone: editing.phone?.trim() || null,
      website: editing.website?.trim() || null,
      image_url: editing.image_url || null,
      rating: editing.rating != null && editing.rating !== 0 ? Number(editing.rating) : null,
      is_active: editing.is_active ?? true,
    }
    const { error } = editing.id
      ? await supabase.from('golf_courses').update(payload).eq('id', editing.id)
      : await supabase.from('golf_courses').insert(payload)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing.id ? 'Course updated' : 'Course created')
    setOpen(false)
    fetchCourses()
  }

  const toggleActive = async (c: GolfCourse) => {
    await supabase.from('golf_courses').update({ is_active: !c.is_active }).eq('id', c.id)
    setCourses(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
    toast.success(c.is_active ? 'Course hidden from public' : 'Course visible to public')
  }

  const handleDelete = async (c: GolfCourse) => {
    if (!confirm(`Delete "${c.name}" and all its tee times? This cannot be undone.`)) return
    const { error } = await supabase.from('golf_courses').delete().eq('id', c.id)
    if (error) { toast.error(error.message); return }
    setCourses(prev => prev.filter(x => x.id !== c.id))
    toast.success('Course deleted')
  }

  const openAssign = (c: GolfCourse) => { setAssignCourse(c); setAssignEmail(''); setAssignOpen(true) }

  const handleAssign = async () => {
    if (!assignCourse || !assignEmail.trim()) { toast.error('Enter an email address'); return }
    setAssigning(true)
    // Look up the user by email in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', assignEmail.trim().toLowerCase())
      .single()
    if (profileError || !profile) {
      toast.error('No account found for that email. They must sign up first.')
      setAssigning(false)
      return
    }
    const { error } = await supabase
      .from('profiles')
      .update({ is_club_manager: true, managed_course_id: assignCourse.id })
      .eq('id', profile.id)
    setAssigning(false)
    if (error) { toast.error(error.message); return }
    toast.success(`${profile.full_name ?? assignEmail} is now the manager of ${assignCourse.name}`)
    setAssignOpen(false)
  }

  const handleImport = async () => {
    const lines = csvText.trim().split('\n').filter(Boolean)
    if (lines.length < 2) { toast.error('CSV needs a header row and at least one data row'); return }
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
    })
    setImporting(true)
    const payload = rows.map(r => ({
      name: r.name, city: r.city,
      country: r.country || 'South Africa',
      holes: Number(r.holes) || 18,
      par: Number(r.par) || 72,
      green_fee_min: Number(r.green_fee_min) || 0,
      green_fee_max: Number(r.green_fee_max) || 0,
      description: r.description || null,
      address: r.address || null,
      phone: r.phone || null,
      website: r.website || null,
      image_url: r.image_url || null,
      rating: r.rating ? Number(r.rating) : null,
      is_active: true,
    }))
    const { error, data } = await supabase.from('golf_courses').insert(payload).select()
    setImporting(false)
    if (error) { toast.error(error.message); return }
    toast.success(`Imported ${data?.length ?? payload.length} course(s)`)
    setImportOpen(false)
    setCsvText('')
    fetchCourses()
  }

  const filtered = courses.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold flex-1">Courses ({courses.length})</h2>
        <Input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-44 h-8"
        />
        <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-3.5 w-3.5 mr-1" />CSV Import
        </Button>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 mr-1" />Add Course
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">No courses found</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium w-12" />
                <th className="text-left px-4 py-2 font-medium">Course</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Fees</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Rating</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 w-32" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2">
                    <div className="h-10 w-14 rounded overflow-hidden bg-muted shrink-0">
                      {c.image_url
                        ? <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-xs">No img</div>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <p className="font-medium leading-tight">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.holes} holes · Par {c.par}</p>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground hidden md:table-cell">{c.city}, {c.country}</td>
                  <td className="px-4 py-2 hidden lg:table-cell text-sm">
                    {formatCurrency(c.green_fee_min)}–{formatCurrency(c.green_fee_max)}
                  </td>
                  <td className="px-4 py-2 hidden lg:table-cell">
                    {c.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm">{c.rating}</span>
                      </div>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={c.is_active ? 'success' : 'secondary'} className="text-xs">
                      {c.is_active ? 'Live' : 'Hidden'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-0.5 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Assign manager" onClick={() => openAssign(c)}>
                        <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title={c.is_active ? 'Hide' : 'Show'} onClick={() => toggleActive(c)}>
                        {c.is_active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete" onClick={() => handleDelete(c)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Course edit / create dialog ── */}
      <Dialog open={open} onOpenChange={open => { if (!saving) setOpen(open) }}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? `Edit: ${editing.name}` : 'Add New Course'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Image */}
            <div className="space-y-1.5">
              <Label>Course Photo</Label>
              <ImageUpload
                value={editing.image_url ?? null}
                onChange={url => setEditing(p => ({ ...p, image_url: url }))}
              />
            </div>

            <Separator />

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Course Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Steenberg Golf Club"
                  value={editing.name ?? ''}
                  onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>City <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Cape Town"
                  value={editing.city ?? ''}
                  onChange={e => setEditing(p => ({ ...p, city: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input
                  placeholder="South Africa"
                  value={editing.country ?? ''}
                  onChange={e => setEditing(p => ({ ...p, country: e.target.value }))}
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label>Address</Label>
                <Input
                  placeholder="123 Golf Road, Tokai"
                  value={editing.address ?? ''}
                  onChange={e => setEditing(p => ({ ...p, address: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            {/* Course specs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Holes</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={editing.holes ?? 18}
                  onChange={e => setEditing(p => ({ ...p, holes: Number(e.target.value) }))}
                >
                  {[9, 18, 27, 36].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Par</Label>
                <Input
                  type="number"
                  placeholder="72"
                  value={editing.par ?? ''}
                  onChange={e => setEditing(p => ({ ...p, par: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rating (0–5)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="4.5"
                  value={editing.rating ?? ''}
                  onChange={e => setEditing(p => ({ ...p, rating: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min Green Fee (ZAR)</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={editing.green_fee_min ?? ''}
                  onChange={e => setEditing(p => ({ ...p, green_fee_min: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Green Fee (ZAR)</Label>
                <Input
                  type="number"
                  placeholder="1500"
                  value={editing.green_fee_max ?? ''}
                  onChange={e => setEditing(p => ({ ...p, green_fee_max: Number(e.target.value) }))}
                />
              </div>
            </div>

            <Separator />

            {/* Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  placeholder="+27 21 000 0000"
                  value={editing.phone ?? ''}
                  onChange={e => setEditing(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={editing.website ?? ''}
                  onChange={e => setEditing(p => ({ ...p, website: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Describe the course, facilities, highlights..."
                value={editing.description ?? ''}
                onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Visible to public</p>
                <p className="text-xs text-muted-foreground">When off, the course won't appear in search results</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(p => ({ ...p, is_active: !p.is_active }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editing.is_active ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editing.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-24">
              {saving ? 'Saving...' : editing.id ? 'Save Changes' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Manager dialog ── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Club Manager</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Assigning a manager for <strong>{assignCourse?.name}</strong>. They must have an existing account on the platform.
            </p>
            <div className="space-y-1.5">
              <Label>Manager's Email Address</Label>
              <Input
                type="email"
                placeholder="clubmanager@example.com"
                value={assignEmail}
                onChange={e => setAssignEmail(e.target.value)}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              They'll get access to the Club Portal at <code className="bg-muted px-1 rounded">/club</code> after their next login.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assigning || !assignEmail.trim()}>
              {assigning ? 'Assigning...' : 'Assign Manager'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CSV Import dialog ── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Courses via CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Required columns: <code className="bg-muted px-1 rounded text-xs">name</code>, <code className="bg-muted px-1 rounded text-xs">city</code>.
              Optional: country, address, holes, par, green_fee_min, green_fee_max, description, phone, website, image_url, rating
            </p>
            <div className="bg-muted rounded-md p-3 text-xs font-mono leading-relaxed overflow-x-auto">
              name,city,country,holes,par,green_fee_min,green_fee_max,rating,description<br/>
              Humewood Golf Club,Port Elizabeth,South Africa,18,70,400,600,4.3,A classic links course on the bay<br/>
              Durban Country Club,Durban,South Africa,18,70,600,900,4.6,One of Africa's finest parkland courses
            </div>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[160px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Paste CSV here..."
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || !csvText.trim()}>
              {importing ? 'Importing...' : 'Import Courses'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
