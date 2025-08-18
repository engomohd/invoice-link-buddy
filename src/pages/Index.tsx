import { useState, useEffect } from "react"
import { LoginForm } from "@/components/LoginForm"
import { ClientDashboard } from "@/components/ClientDashboard"
import { AdminDashboard } from "@/components/AdminDashboard"
import { authService } from "@/lib/auth"
import { initializeSampleData } from "@/lib/invoice-storage"

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // Initialize sample data and admin
      initializeSampleData()
      await authService.initializeAdmin()
      
      // Check if user is already logged in
      const authenticated = await authService.isAuthenticated()
      const adminStatus = authenticated ? await authService.isAdmin() : false
      
      setIsAuthenticated(authenticated)
      setIsAdmin(adminStatus)
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])

  const handleLogin = async () => {
    setIsAuthenticated(true)
    setIsAdmin(await authService.isAdmin())
  }

  const handleLogout = async () => {
    await authService.logout()
    setIsAuthenticated(false)
    setIsAdmin(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />
  }

  if (isAdmin) {
    return <AdminDashboard onLogout={handleLogout} />
  }

  return <ClientDashboard onLogout={handleLogout} />
};

export default Index;
