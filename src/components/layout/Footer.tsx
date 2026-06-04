import { Link } from 'react-router-dom'
import { Flag } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-8 mt-auto">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">FairwayBook</span>
          <span>— Book tee times at top South African courses</span>
        </div>
        <nav className="flex gap-4">
          <Link to="/courses" className="hover:text-foreground transition-colors">Browse Courses</Link>
          <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} FairwayBook</p>
      </div>
    </footer>
  )
}
