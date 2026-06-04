import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useClubManager } from '@/hooks/useClubManager'

export function ClubGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { isClubManager, loading } = useClubManager()

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isClubManager) return <Navigate to="/" replace />

  return <>{children}</>
}
