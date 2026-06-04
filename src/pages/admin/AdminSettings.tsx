import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { SiteSettings } from '@/hooks/useSiteSettings'

const DEFAULTS: SiteSettings = {
  hero_image_url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1600&auto=format&fit=crop',
  hero_title: 'Book Your Perfect Round of Golf',
  hero_subtitle: 'Search tee times at top South African courses — instantly confirm your round online.',
  bottom_bg_image_url: null,
  bottom_bg_color: '#f8fafc',
}

async function saveSetting(key: string, value: string | null) {
  await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() })
}

export function AdminSettings() {
  const [s, setS] = useState<SiteSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('site_settings').select('key, value')
      .then(({ data }) => {
        if (data) {
          const map = Object.fromEntries(data.map(r => [r.key, r.value]))
          setS({
            hero_image_url: map.hero_image_url || DEFAULTS.hero_image_url,
            hero_title: map.hero_title || DEFAULTS.hero_title,
            hero_subtitle: map.hero_subtitle || DEFAULTS.hero_subtitle,
            bottom_bg_image_url: map.bottom_bg_image_url || null,
            bottom_bg_color: map.bottom_bg_color || DEFAULTS.bottom_bg_color,
          })
        }
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await Promise.all([
      saveSetting('hero_image_url', s.hero_image_url),
      saveSetting('hero_title', s.hero_title),
      saveSetting('hero_subtitle', s.hero_subtitle),
      saveSetting('bottom_bg_image_url', s.bottom_bg_image_url),
      saveSetting('bottom_bg_color', s.bottom_bg_color),
    ])
    setSaving(false)
    toast.success('Site settings saved — live on the homepage now')
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  // Live preview styles
  const heroStyle = {
    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.65)), url('${s.hero_image_url}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
  const bottomStyle = s.bottom_bg_image_url
    ? { backgroundImage: `url('${s.bottom_bg_image_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: s.bottom_bg_color }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Site Settings</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Eye className="h-3.5 w-3.5 mr-1.5" />Preview site
            </a>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* ── HERO SECTION ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero Section (Top Banner)</CardTitle>
          <CardDescription>The large background image and text visitors see first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Live preview */}
          <div className="rounded-lg overflow-hidden" style={{ ...heroStyle, minHeight: 160 }}>
            <div className="flex flex-col items-center justify-center text-center text-white p-6 min-h-[160px] space-y-2">
              <p className="text-lg font-bold leading-tight">{s.hero_title || '...'}</p>
              <p className="text-sm text-white/80">{s.hero_subtitle || '...'}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Background Photo</Label>
            <ImageUpload
              value={s.hero_image_url}
              onChange={url => setS(p => ({ ...p, hero_image_url: url ?? DEFAULTS.hero_image_url }))}
              bucket="course-images"
              folder="site"
            />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label>Headline Text</Label>
            <Input
              value={s.hero_title}
              onChange={e => setS(p => ({ ...p, hero_title: e.target.value }))}
              placeholder="Book Your Perfect Round of Golf"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Subtitle Text</Label>
            <Input
              value={s.hero_subtitle}
              onChange={e => setS(p => ({ ...p, hero_subtitle: e.target.value }))}
              placeholder="Search tee times at top South African courses..."
            />
          </div>
        </CardContent>
      </Card>

      {/* ── BOTTOM SECTION ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bottom Section Background</CardTitle>
          <CardDescription>The background behind the Featured Courses section at the bottom of the homepage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Live preview */}
          <div className="rounded-lg overflow-hidden border" style={{ ...bottomStyle, minHeight: 80 }}>
            <div className="flex items-center justify-center min-h-[80px]">
              <p className="text-sm font-medium opacity-60 px-4 py-3">Featured Courses section</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Background Image <span className="text-muted-foreground font-normal text-xs">(optional — overrides colour)</span></Label>
            <ImageUpload
              value={s.bottom_bg_image_url}
              onChange={url => setS(p => ({ ...p, bottom_bg_image_url: url }))}
              bucket="course-images"
              folder="site"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Background Colour <span className="text-muted-foreground font-normal text-xs">(used when no image is set)</span></Label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={s.bottom_bg_color}
                onChange={e => setS(p => ({ ...p, bottom_bg_color: e.target.value }))}
                className="h-10 w-16 rounded-md border border-input cursor-pointer p-1"
              />
              <Input
                value={s.bottom_bg_color}
                onChange={e => setS(p => ({ ...p, bottom_bg_color: e.target.value }))}
                placeholder="#f8fafc"
                className="w-36"
              />
              <div className="flex gap-2 flex-wrap">
                {['#ffffff', '#f8fafc', '#f0fdf4', '#ecfdf5', '#eff6ff', '#1a2e1a'].map(c => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setS(p => ({ ...p, bottom_bg_color: c }))}
                    className="h-7 w-7 rounded-md border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: s.bottom_bg_color === c ? '#16a34a' : '#e2e8f0' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save All Changes'}
      </Button>
    </div>
  )
}
