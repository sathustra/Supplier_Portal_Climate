import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import Toast from '@/components/Toast'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminRoute from '@/components/AdminRoute'

import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import WizardLayout from '@/pages/wizard/WizardLayout'
import Step1_PCF from '@/pages/wizard/Step1_PCF'
import Step2_Targets from '@/pages/wizard/Step2_Targets'
import Step3_Measures from '@/pages/wizard/Step3_Measures'
import StepReview from '@/pages/wizard/StepReview'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminDetail from '@/pages/admin/AdminDetail'
import AdminExport from '@/pages/admin/AdminExport'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Toast />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Wizard */}
              <Route path="/submissions/:id" element={<WizardLayout />}>
                <Route index element={<Navigate to="pcf" replace />} />
                <Route path="pcf" element={<Step1_PCF />} />
                <Route path="targets" element={<Step2_Targets />} />
                <Route path="measures" element={<Step3_Measures />} />
                <Route path="review" element={<StepReview />} />
              </Route>

              {/* Admin */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/export"
                element={
                  <AdminRoute>
                    <AdminExport />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/:id"
                element={
                  <AdminRoute>
                    <AdminDetail />
                  </AdminRoute>
                }
              />
            </Route>

            {/* Default */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
