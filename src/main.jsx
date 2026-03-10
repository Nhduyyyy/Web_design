import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import TheaterRoute from './components/Theater/TheaterRoute'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import AppLanding from './AppLanding'
import Login from './components/Auth/Login'
import SimpleLogin from './components/Auth/SimpleLogin'
import Register from './components/Auth/Register'
import AdminDashboard from './components/Admin/AdminDashboard'
import TheaterDashboard from './components/Theater/TheaterDashboard'
import TheaterSchedules from './components/Theater/TheaterSchedules'
import TheaterShows from './components/Theater/TheaterShows'
import VenueDetailSimple from './components/Theater/VenueDetailSimple'
import SeatLayoutEditor from './components/Theater/SeatLayoutEditor'
import OrganizationRegistration from './components/Organization/OrganizationRegistration'
import RegistrationSuccess from './components/Organization/RegistrationSuccess'
import OrganizationManagement from './components/Admin/OrganizationManagement'
import LivestreamList from './components/Livestream/LivestreamList'
import LivestreamWatch from './components/Livestream/LivestreamWatch'
import LivestreamBroadcast from './components/Theater/LivestreamBroadcast'
import TheaterLivestreams from './components/Theater/TheaterLivestreams'
import TheaterLivestreamCreate from './components/Theater/TheaterLivestreamCreate'
import WhackAMoleGame from './components/WhackAMoleGame'
import WhackAMaskIntro from './components/WhackAMaskIntro'
import './styles/index.css'

// Import admin utilities for development
import './utils/setAdminRole'
import './utils/setTheaterRole'
import './utils/quickCheckRole'
import './utils/debugSeatLayout'

console.log('🚀 main.jsx is loading...')
console.log('💡 Debug commands available: window.debugSeatLayout.debugSeatLayoutTables()')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AppLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/simple-login" element={<SimpleLogin />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/app" 
              element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/organizations" 
              element={
                <AdminRoute>
                  <OrganizationManagement />
                </AdminRoute>
              } 
            />
            <Route 
              path="/theater" 
              element={
                <TheaterRoute>
                  <TheaterDashboard />
                </TheaterRoute>
              } 
            />
            <Route 
              path="/theater/livestreams" 
              element={
                <TheaterRoute>
                  <TheaterLivestreams />
                </TheaterRoute>
              } 
            />
            <Route 
              path="/theater/schedules" 
              element={
                <TheaterRoute>
                  <TheaterSchedules />
                </TheaterRoute>
              } 
            />
            <Route 
              path="/theater/shows" 
              element={
                <TheaterRoute>
                  <TheaterShows />
                </TheaterRoute>
              } 
            />
            <Route 
              path="/theater/halls/:hallId" 
              element={
                <TheaterRoute>
                  <VenueDetailSimple />
                </TheaterRoute>
              } 
            />
            <Route 
              path="/theater/halls/:hallId/seat-editor" 
              element={
                <TheaterRoute>
                  <SeatLayoutEditor />
                </TheaterRoute>
              } 
            />
            <Route 
              path="/organization/register" 
              element={
                <ProtectedRoute>
                  <OrganizationRegistration />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organization/registration-success" 
              element={
                <ProtectedRoute>
                  <RegistrationSuccess />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/livestreams" 
              element={
                <ProtectedRoute>
                  <LivestreamList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/livestreams/:id" 
              element={
                <ProtectedRoute>
                  <LivestreamWatch />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/theater/livestreams/:id/broadcast" 
              element={
                <TheaterRoute>
                  <LivestreamBroadcast />
                </TheaterRoute>
              } 
            />
            <Route 
              path="/theater/livestreams/create" 
              element={
                <TheaterRoute>
                  <TheaterLivestreamCreate />
                </TheaterRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

console.log('✅ React app rendered')



