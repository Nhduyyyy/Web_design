import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import AppLanding from './AppLanding'
import Login from './components/Auth/Login'
import SimpleLogin from './components/Auth/SimpleLogin'
import Register from './components/Auth/Register'
import './styles/index.css'

console.log('🚀 main.jsx is loading...')

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
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

console.log('✅ React app rendered')



