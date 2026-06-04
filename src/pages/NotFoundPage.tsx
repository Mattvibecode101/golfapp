import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center py-16">
      <p className="text-6xl mb-4">⛳</p>
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        Looks like this hole doesn't exist. Head back to the clubhouse.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  )
}
