import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Layout from "./components/layout/Layout";
import { ROLES } from "./utils/constants";

import CustomerDetail from "./pages/CustomerDetail";
import CustomerForm from "./pages/CustomerForm";
import ServiceForm from "./pages/ServiceForm";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Services from "./pages/Services";
import ServiceCategories from "./pages/ServiceCategories";
import Staff from "./pages/Staff";
import StaffForm from "./pages/StaffForm";
import StaffDetail from "./pages/StaffDetail";
import Packages from "./pages/Packages";
import PackageForm from "./pages/PackageForm";
import Appointments from "./pages/Appointments";
import AppointmentForm from "./pages/AppointmentForm";
import Payments from "./pages/Payments";
// import PaymentDetail from "./pages/PaymentDetail";
import Reports from "./pages/Reports";

import Applications from "./pages/academy/Applications";
import ApplicationDetail from "./pages/academy/ApplicationDetail";
import Students from "./pages/academy/Students";
import StudentDetail from "./pages/academy/StudentDetail";
import StudentForm from "./pages/academy/StudentForm";
import Trainers from "./pages/academy/Trainers";
import TrainerDetail from "./pages/academy/TrainerDetail";
import TrainerForm from "./pages/academy/TrainerForm";
import Batches from "./pages/academy/Batches";
import BatchDetail from "./pages/academy/BatchDetail";
import BatchForm from "./pages/academy/BatchForm";
import Courses from "./pages/academy/Courses";
import CourseForm from "./pages/academy/CourseForm";
import CourseDetail from "./pages/academy/CourseDetail";
import Attendance from "./pages/academy/Attendance";
import AttendanceSessions from "./pages/academy/AttendanceSessions";
import AttendanceMarking from "./pages/academy/AttendanceMarking";
import TrainerBatchesAttendance from "./pages/academy/TrainerBatchesAttendance";
import BatchStudentsAttendance from "./pages/academy/BatchStudentsAttendance";
import StudentAttendanceDetail from "./pages/academy/StudentAttendanceDetail";
import Assessments from "./pages/academy/Assessments";
import AssessmentForm from "./pages/academy/AssessmentForm";
import AssessmentResults from "./pages/academy/AssessmentResults";
import PracticalSessions from "./pages/academy/PracticalSessions";
import PracticalSessionForm from "./pages/academy/PracticalSessionForm";
import PracticalEvaluation from "./pages/academy/PracticalEvaluation";
import Certificates from "./pages/academy/Certificates";
import Users from "./pages/Users";
import StudentProgress from "./pages/academy/StudentProgress";
import AcademyPayments from "./pages/academy/AcademyPayments";
import StudentCourseFees from "./pages/academy/StudentCourseFees";
import SalonSalary from "./pages/SalonSalary";
import AcademySalary from "./pages/academy/AcademySalary"; 
import Gallery from "./pages/Gallery";
import ContactInquiries from "./pages/ContactInquiries";
import Reviews from "./pages/Reviews";

function DefaultRedirect() {
  const { user } = useAuth();

  if (user?.role === ROLES.STAFF) {
    return <Navigate to="/admin/services" replace />;
  }
  if (user?.role === ROLES.TRAINER) {
    return <Navigate to="/admin/academy/students" replace />;  
  }
  return <Navigate to="/admin/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<Login />} />

          <Route path="/admin" element={<Layout />}>
            <Route index element={<DefaultRedirect />} />

            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="users" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <Users />
              </ProtectedRoute>
            } />

            <Route path="customers" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="customers/new" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <CustomerForm />
              </ProtectedRoute>
            } />
            <Route path="customers/:id" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <CustomerDetail />
              </ProtectedRoute>
            } />

            <Route path="services" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]}>
                <Services />
              </ProtectedRoute>
            } />
            <Route path="services/new" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <ServiceForm />
              </ProtectedRoute>
            } />
            <Route path="services/:id/edit" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <ServiceForm />
              </ProtectedRoute>
            } />
            <Route path="services/categories" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <ServiceCategories />
              </ProtectedRoute>
            } />

            <Route path="staff" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Staff />
              </ProtectedRoute>
            } />
            <Route path="staff/new" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <StaffForm />
              </ProtectedRoute>
            } />
            <Route path="staff/:id" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <StaffDetail />
              </ProtectedRoute>
            } />
            <Route path="staff/:id/edit" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <StaffForm />
              </ProtectedRoute>
            } />

            <Route path="packages" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Packages />
              </ProtectedRoute>
            } />
            <Route path="packages/new" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <PackageForm mode="create" />
              </ProtectedRoute>
            } />
            <Route path="packages/:id/edit" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <PackageForm mode="edit" />
              </ProtectedRoute>
            } />

            <Route path="appointments" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]}>
                <Appointments />
              </ProtectedRoute>
            } />
            <Route path="appointments/:id" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <AppointmentForm />
              </ProtectedRoute>
            } />
            <Route path="appointments/new" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <AppointmentForm />
              </ProtectedRoute>
            } />

            <Route path="payments" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <Payments />
              </ProtectedRoute>
            } />

            <Route path="salary" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <SalonSalary />
            </ProtectedRoute>
          } />

          <Route path="academy/salary" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AcademySalary />
            </ProtectedRoute>
          } />

            
            <Route path="reports/revenue" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <Reports />
              </ProtectedRoute>
            } />

            <Route path="contact-inquiries" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <ContactInquiries />
              </ProtectedRoute>
            } />
            <Route path="reviews" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Reviews />
              </ProtectedRoute>
            } />
            <Route path="gallery" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Gallery />
              </ProtectedRoute>
            } />

            {/* Academy Routes */}
            <Route path="academy/applications" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Applications />
              </ProtectedRoute>
            } />
            <Route path="academy/applications/:id" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <ApplicationDetail />
              </ProtectedRoute>
            } />

            <Route path="academy/students" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <Students />
              </ProtectedRoute>
            } />
            <Route path="academy/students/:id" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <StudentDetail />
              </ProtectedRoute>
            } />
            <Route path="academy/students/:id/edit" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <StudentForm />
              </ProtectedRoute>
            } />

            <Route path="academy/trainers" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <Trainers />
              </ProtectedRoute>
            } />
            <Route path="academy/trainers/new" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <TrainerForm />
              </ProtectedRoute>
            } />
            <Route path="academy/trainers/:id" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <TrainerDetail />
              </ProtectedRoute>
            } />
            <Route path="academy/trainers/:id/edit" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <TrainerForm />
              </ProtectedRoute>
            } />

            <Route path="academy/batches" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <Batches />
              </ProtectedRoute>
            } />
            <Route path="academy/batches/new" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <BatchForm />
              </ProtectedRoute>
            } />
            <Route path="academy/batches/:id" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <BatchDetail />
              </ProtectedRoute>
            } />
            <Route path="academy/batches/:id/edit" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <BatchForm />
              </ProtectedRoute>
            } />
            <Route path="academy/batches/:batchId/sessions" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <AttendanceSessions />
              </ProtectedRoute>
            } />

            <Route path="academy/batches/:batchId/students/:studentId/progress" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <StudentProgress />
              </ProtectedRoute>
            } />

            <Route path="academy/courses" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <Courses />
              </ProtectedRoute>
            } />
            <Route path="academy/courses/new" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <CourseForm />
              </ProtectedRoute>
            } />
            <Route path="academy/courses/:id" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <CourseDetail />
              </ProtectedRoute>
            } />
            <Route path="academy/courses/:id/edit" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <CourseForm />
              </ProtectedRoute>
            } />

            <Route path="academy/attendance" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <Attendance />
              </ProtectedRoute>
            } />
            <Route path="academy/attendance/:batchId/sessions" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <AttendanceSessions />
              </ProtectedRoute>
            } />
            <Route path="academy/attendance/:batchId/sessions/:sessionId" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <AttendanceMarking />
              </ProtectedRoute>
            } />
            <Route path="academy/attendance/trainers/:trainerId" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <TrainerBatchesAttendance />
              </ProtectedRoute>
            } />
            <Route path="academy/attendance/batches/:batchId/students" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <BatchStudentsAttendance />
              </ProtectedRoute>
            } />
            <Route path="academy/attendance/batches/:batchId/students/:studentId" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <StudentAttendanceDetail />
              </ProtectedRoute>
            } />

            <Route path="academy/payments" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AcademyPayments />
              </ProtectedRoute>
            } />
            <Route path="academy/payments/students/:studentId" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <StudentCourseFees />
              </ProtectedRoute>
            } />

            <Route path="academy/assessments" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <Assessments />
              </ProtectedRoute>
            } />
            <Route path="academy/assessments/new" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <AssessmentForm />
              </ProtectedRoute>
            } />
            <Route path="academy/assessments/:id/edit" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <AssessmentForm />
              </ProtectedRoute>
            } />
            <Route path="academy/assessments/:id/results" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <AssessmentResults />
              </ProtectedRoute>
            } />

            <Route path="academy/practical" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <PracticalSessions />
              </ProtectedRoute>
            } />
            <Route path="academy/practical/new" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <PracticalSessionForm />
              </ProtectedRoute>
            } />
            <Route path="academy/practical/:id/evaluate" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <PracticalEvaluation />
              </ProtectedRoute>
            } />

            <Route path="academy/certificates" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.TRAINER]}>
                <Certificates />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;