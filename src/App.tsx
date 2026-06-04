import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { LandingPage } from '@/pages/LandingPage'
import { CoursesPage } from '@/pages/CoursesPage'
import { CourseDetailPage } from '@/pages/CourseDetailPage'
import { BookingPage } from '@/pages/BookingPage'
import { BookingSuccessPage } from '@/pages/BookingSuccessPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminOverview } from '@/pages/admin/AdminOverview'
import { AdminCourses } from '@/pages/admin/AdminCourses'
import { AdminTeeTimes } from '@/pages/admin/AdminTeeTimes'
import { AdminBookings } from '@/pages/admin/AdminBookings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<Navigate to="/dashboard" replace />} />
          <Route path="/book/:teeTimeId" element={<AuthGuard><BookingPage /></AuthGuard>} />
          <Route path="/booking-success/:bookingId" element={<AuthGuard><BookingSuccessPage /></AuthGuard>} />
          <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />

          {/* Admin routes — protected by AdminGuard */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<AdminOverview />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="tee-times" element={<AdminTeeTimes />} />
            <Route path="bookings" element={<AdminBookings />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
