import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface SiteSettings {
  hero_image_url: string
  hero_title: string
  hero_subtitle: string
  bottom_bg_image_url: string | null
  bottom_bg_color: string
}

const DEFAULTS: SiteSettings = {
  hero_image_url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1600&auto=format&fit=crop',
  hero_title: 'Book Your Perfect Round of Golf',
  hero_subtitle: 'Search tee times at top South African courses — instantly confirm your round online.',
  bottom_bg_image_url: null,
  bottom_bg_color: '#f8fafc',
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('site_settings').select('key, value')
      .then(({ data }) => {
        if (data) {
          const map = Object.fromEntries(data.map(r => [r.key, r.value]))
          setSettings({
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

  return { settings, loading }
}
