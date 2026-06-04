import { useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function CourseFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const update = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value)
    else p.delete(key)
    setSearchParams(p)
  }

  const clearAll = () => setSearchParams({})

  const hasFilters = Array.from(searchParams.keys()).length > 0

  return (
    <aside className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 px-2 text-xs gap-1">
            <X className="h-3.5 w-3.5" />Clear all
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Location</Label>
        <Input
          placeholder="City or region"
          value={searchParams.get('city') ?? ''}
          onChange={e => update('city', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Holes</Label>
        <div className="flex gap-2 flex-wrap">
          {[9, 18].map(n => (
            <Button
              key={n}
              size="sm"
              variant={searchParams.get('holes') === String(n) ? 'default' : 'outline'}
              onClick={() => update('holes', searchParams.get('holes') === String(n) ? '' : String(n))}
              className="flex-1"
            >
              {n} holes
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Min Price (ZAR)</Label>
        <Input
          type="number"
          placeholder="e.g. 500"
          min={0}
          value={searchParams.get('minPrice') ?? ''}
          onChange={e => update('minPrice', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Max Price (ZAR)</Label>
        <Input
          type="number"
          placeholder="e.g. 2000"
          min={0}
          value={searchParams.get('maxPrice') ?? ''}
          onChange={e => update('maxPrice', e.target.value)}
        />
      </div>
    </aside>
  )
}
