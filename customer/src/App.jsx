import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import ScrollToTop from './components/layout/ScrollToTop'
import CustomCursor from './components/common/CustomCursor'

import Home from './pages/Home'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Staff from './pages/Staff'
import StaffDetail from './pages/StaffDetail'
import Packages from './pages/Packages'
import AcademyPage from './pages/academy/AcademyPage'
import CourseDetail from './pages/academy/CourseDetail'
import TrainerDetail from './pages/academy/TrainerDetail'
import ApplyForm from './pages/academy/ApplyForm'
import Gallery from './pages/Gallery'
import BookingPage from './pages/booking/BookingPage'
import Appointments from './pages/account/Appointments'
import MyPackages from './pages/account/MyPackages'
import PackageDetail from './pages/packages/PackageDetail'
import MyAcademyFees from './pages/account/MyAcademyFees'
import MyEnrollments from './pages/account/MyEnrollments'
import MyAttendance from './pages/account/MyAttendance'
import MyResults from './pages/account/MyResults'
import MyPracticals from './pages/account/MyPracticals'
import MyCertificates from './pages/account/MyCertificates'
import Profile from './pages/account/Profile'

import About from './pages/About'
import Contact from './pages/Contact'
import MyApplications from './pages/account/MyApplications'
import NotFound from './pages/NotFound'

import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <CustomCursor />

        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:id" element={<ServiceDetail />} />
            <Route path="staff" element={<Staff />} />
            <Route path="staff/:id" element={<StaffDetail />} />
            <Route path="packages" element={<Packages />} />
            <Route path="academy" element={<AcademyPage />} />
            <Route path="academy/trainers/:id" element={<TrainerDetail />} />
            <Route path="academy/:id" element={<CourseDetail />} />
            <Route path="academy/:id/apply" element={<ApplyForm />} />
            <Route path="packages/:id" element={<PackageDetail />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route
              path="book"
              element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/packages"
              element={
                <ProtectedRoute>
                  <MyPackages />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/academy"
              element={
                <ProtectedRoute>
                  <MyEnrollments />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/academy/attendance"
              element={
                <ProtectedRoute>
                  <MyAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/academy/results"
              element={
                <ProtectedRoute>
                  <MyResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/academy/practicals"
              element={
                <ProtectedRoute>
                  <MyPracticals />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/academy/certificates"
              element={
                <ProtectedRoute>
                  <MyCertificates />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/academy-fees"
              element={
                <ProtectedRoute>
                  <MyAcademyFees />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/applications"
              element={
                <ProtectedRoute>
                  <MyApplications />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
