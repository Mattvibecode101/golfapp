import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import type { GolfCourse } from '@/types/app.types'

const EMPTY: Partial<GolfCourse> = {
  name: '', city: '', country: 'South Africa', holes: 18, par: 72,
  green_fee_min: 0, green_fee_max: 0, description: '', address: '',
  phone: '', website: '', image_url: '', rating: null,
}

export function AdminCourses() {
  const [allCourses, setAllCourses] = useState<GolfCourse[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<GolfCourse>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)

  // Use admin-visible courses (including inactive) fetched directly
  const [adminLoading, setAdminLoading] = useState(true)

  useState(() => {
    supabase.from('golf_courses').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setAllCourses((data ?? []) as GolfCourse[]); setAdminLoading(false) })
  })

  const openNew = () => { setEditing(EMPTY); setOpen(true) }
  const openEdit = (c: GolfCourse) => { setEditing({ ...c }); setOpen(true) }

  const handleSave = async () => {
    if (!editing.name || !editing.city) { toast.error('Name and city are required'); return }
    setSaving(true)
    const payload = {
      name: editing.name!, city: editing.city!, country: editing.country ?? 'South Africa',
      holes: Number(editing.holes) || 18, par: Number(editing.par) || 72,
      green_fee_min: Number(editing.green_fee_min) || 0,
      green_fee_max: Number(editing.green_fee_max) || 0,
      description: editing.description || null, address: editing.address || null,
      phone: editing.phone || null, website: editing.website || null,
      image_url: editing.image_url || null,
      rating: editing.rating ? Number(editing.rating) : null,
      is_active: editing.is_active ?? true,
    }
    const { error } = editing.id
      ? await supabase.from('golf_courses').update(payload).eq('id', editing.id)
      : await supabase.from('golf_courses').insert(payload)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editing.id ? 'Course updated' : 'Course created')
    setOpen(false)
    supabase.from('golf_courses').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setAllCourses((data ?? []) as GolfCourse[]))
  }

  const toggleActive = async (c: GolfCourse) => {
    await supabase.from('golf_courses').update({ is_active: !c.is_active }).eq('id', c.id)
    setAllCourses(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
    toast.success(c.is_active ? 'Course hidden' : 'Course visible')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course and all its tee times?')) return
    const { error } = await supabase.from('golf_courses').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setAllCourses(prev => prev.filter(x => x.id !== id))
    toast.success('Course deleted')
  }

  const handleImport = async () => {
    const lines = csvText.trim().split('\n').filter(Boolean)
    if (lines.length < 2) { toast.error('CSV needs a header row and at least one data row'); return }
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
    })
    setImporting(true)
    const payload = rows.map(r => ({
      name: r.name, city: r.city, country: r.country || 'South Africa',
      holes: Number(r.holes) || 18, par: Number(r.par) || 72,
      green_fee_min: Number(r.green_fee_min) || 0,
      green_fee_max: Number(r.green_fee_max) || 0,
      description: r.description || null, address: r.address || null,
      phone: r.phone || null, website: r.website || null,
      image_url: r.image_url || null,
      rating: r.rating ? Number(r.rating) : null,
      is_active: true,
    }))
    const { error } = await supabase.from('golf_courses').insert(payload)
    setImporting(false)
    if (error) { toast.error(error.message); return }
    toast.success(`Imported ${payload.length} course(s)`)
    setImportOpen(false)
    setCsvText('')
    supabase.from('golf_courses').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setAllCourses((data ?? []) as GolfCourse[]))
  }

  const field = (key: keyof GolfCourse, label: string, type = 'text', placeholder = '') => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={(editing[key] as string | number) ?? ''}
        onChange={e => setEditing(p => ({ ...p, [key]: e.target.value }))}
        className="h-8 text-sm"
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Courses ({allCourses.length})</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-3.5 w-3.5 mr-1" />CSV Import
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add Course
          </Button>
        </div>
      </div>

      {adminLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Course</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">City</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Fees</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {allCourses.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/admin/tee-times?course=${c.id}`} className="hover:text-primary">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.city}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {formatCurrency(c.green_fee_min)}–{formatCurrency(c.green_fee_max)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.is_active ? 'success' : 'secondary'}>
                      {c.is_active ? 'Active' : 'Hidden'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleActive(c)}>
                        {c.is_active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}>
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

      {/* Edit/Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Edit Course' : 'Add Course'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">{field('name', 'Course Name *', 'text', 'Steenberg Golf Club')}</div>
            {field('city', 'City *', 'text', 'Cape Town')}
            {field('country', 'Country', 'text', 'South Africa')}
            {field('address', 'Address', 'text', '123 Golf Road')}
            {field('holes', 'Holes', 'number', '18')}
            {field('par', 'Par', 'number', '72')}
            {field('green_fee_min', 'Min Fee (ZAR)', 'number', '500')}
            {field('green_fee_max', 'Max Fee (ZAR)', 'number', '1500')}
            {field('rating', 'Rating (0–5)', 'number', '4.5')}
            {field('phone', 'Phone', 'text', '+27 21 000 0000')}
            <div className="col-span-2">{field('website', 'Website URL', 'url', 'https://...')}</div>
            <div className="col-span-2">{field('image_url', 'Image URL', 'url', 'https://images.unsplash.com/...')}</div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Description</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Course description..."
                value={editing.description ?? ''}
                onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Course'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Courses via CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Paste CSV with headers. Required: <code className="bg-muted px-1 rounded">name,city</code>. Optional: <code className="bg-muted px-1 rounded">country,address,holes,par,green_fee_min,green_fee_max,description,phone,website,image_url,rating</code>
            </p>
            <div className="bg-muted rounded-md p-2 text-xs font-mono">
              name,city,country,holes,par,green_fee_min,green_fee_max,rating<br/>
              Humewood Golf Club,Port Elizabeth,South Africa,18,70,400,600,4.3<br/>
              Durban Country Club,Durban,South Africa,18,70,600,900,4.6
            </div>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[180px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
