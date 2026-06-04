import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flag, Search, Menu, X, LogOut, LayoutDashboard, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navbar() {
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdmin()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary shrink-0">
          <Flag className="h-5 w-5" />
          <span>FairwayBook</span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses or city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-2 ml-auto">
          <Button variant="ghost" asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.user_metadata?.full_name ?? 'Golfer'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  My Bookings
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4 text-primary" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/login">Log In</Link></Button>
              <Button asChild><Link to="/signup">Sign Up</Link></Button>
            </>
          )}
        </nav>

        <Button variant="ghost" size="icon" className="md:hidden ml-auto" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-4 space-y-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/courses" onClick={() => setMobileOpen(false)}>Browse Courses</Link>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />My Bookings
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { signOut(); setMobileOpen(false) }}>
                <LogOut className="mr-2 h-4 w-4" />Sign Out
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/login" onClick={() => setMobileOpen(false)}>Log In</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link to="/signup" onClick={() => setMobileOpen(false)}>Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
