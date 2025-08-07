import { Client } from "@/types/invoice"

// Mock authentication - replace with your backend integration
export const authService = {
  // Get current logged in user
  getCurrentUser: (): Client | null => {
    const user = localStorage.getItem('currentUser')
    return user ? JSON.parse(user) : null
  },

  // Admin login
  loginAdmin: (username: string, password: string): boolean => {
    // Mock admin credentials - replace with your backend
    if (username === 'admin' && password === 'admin123') {
      const admin = {
        id: 'admin',
        username: 'admin',
        password: '',
        name: 'Administrator',
        email: 'admin@invoices.com',
        createdAt: new Date().toISOString()
      }
      localStorage.setItem('currentUser', JSON.stringify(admin))
      localStorage.setItem('userRole', 'admin')
      return true
    }
    return false
  },

  // Client login
  loginClient: (username: string, password: string): Client | null => {
    // Get clients from localStorage - replace with your backend
    const clients = JSON.parse(localStorage.getItem('clients') || '[]')
    const client = clients.find((c: Client) => c.username === username && c.password === password)
    
    if (client) {
      localStorage.setItem('currentUser', JSON.stringify(client))
      localStorage.setItem('userRole', 'client')
      return client
    }
    return null
  },

  // Logout
  logout: () => {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userRole')
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    return localStorage.getItem('userRole') === 'admin'
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return localStorage.getItem('currentUser') !== null
  }
}