import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Calendar, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CourseGrid } from '@/components/courses/CourseGrid'
import { useCourses } from '@/hooks/useCourses'
import { useSiteSettings } from '@/hooks/useSiteSettings'

export function LandingPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { courses, loading } = useCourses()
  const { settings } = useSiteSettings()

  const featured = courses.slice(0, 3)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    navigate(`/courses?${params.toString()}`)
  }

  const heroStyle = {
    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.65)), url('${settings.hero_image_url}')`,
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center' as const,
  }

  const bottomStyle = settings.bottom_bg_image_url
    ? {
        backgroundImage: `url('${settings.bottom_bg_image_url}')`,
        backgroundSize: 'cover' as const,
        backgroundPosition: 'center' as const,
      }
    : { backgroundColor: settings.bottom_bg_color }

  return (
    <div>
      {/* Hero */}
      <section
        className="relative min-h-[520px] flex items-center justify-center"
        style={heroStyle}
      >
        <div className="relative z-10 text-center text-white px-4 max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            {settings.hero_title}
          </h1>
          <p className="text-lg text-white/80">
            {settings.hero_subtitle}
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by course name or city..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9 bg-white text-foreground h-12"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: 'Search Courses', desc: 'Browse and filter from top-rated courses across South Africa by location and price.' },
              { icon: Calendar, title: 'Pick a Tee Time', desc: 'See real-time availability and choose the date and time that works for you.' },
              { icon: CheckCircle, title: 'Confirm & Play', desc: 'Book instantly with your account. Get a confirmation and head to the course.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses — background controlled from admin */}
      <section className="py-16" style={bottomStyle}>
        <div className="container space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Top Rated Courses</h2>
            <Button variant="outline" onClick={() => navigate('/courses')}>
              View All
              <MapPin className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <CourseGrid courses={featured} loading={loading} />
        </div>
      </section>
    </div>
  )
}
