import { supabase } from "@/integrations/supabase/client"
import { supabaseServices } from "@/lib/supabase-services"
import { Client } from "@/types/invoice"

export const authService = {
  // Get current logged in user
  getCurrentUser: async (): Promise<Client | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    // Check if user is admin
    if (user.email === 'admin@invoices.com') {
      return {
        id: user.id,
        username: 'admin',
        password: '',
        name: 'Administrator',
        email: user.email!,
        createdAt: user.created_at
      }
    }
    
    // Get client data from database
    try {
      const clients = await supabaseServices.getClients()
      return clients.find(c => c.email === user.email) || null
    } catch (error) {
      console.error('Error fetching client:', error)
      return null
    }
  },

  // Admin login
  loginAdmin: async (username: string, password: string): Promise<boolean> => {
    if (username === 'admin' && password === 'admin123') {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'admin@invoices.com',
        password: 'admin123'
      })
      return !error
    }
    return false
  },

  // Client login
  loginClient: async (username: string, password: string): Promise<Client | null> => {
    try {
      // First find the client in our database
      const client = await supabaseServices.getClientByCredentials(username, password)
      if (client) {
        // Sign in with Supabase Auth using client's email
        const { error } = await supabase.auth.signInWithPassword({
          email: client.email,
          password: 'client123' // Default password for all clients
        })
        
        if (!error) {
          return client
        } else {
          console.error('Supabase auth error:', error)
        }
      }
    } catch (error) {
      console.error('Client login error:', error)
    }
    return null
  },

  // Logout
  logout: async () => {
    await supabase.auth.signOut()
  },

  // Check if user is admin
  isAdmin: async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.email === 'admin@invoices.com'
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  },

  // Initialize admin user
  initializeAdmin: async () => {
    const { error } = await supabase.auth.signUp({
      email: 'admin@invoices.com',
      password: 'admin123'
    })
    if (error && !error.message.includes('already registered')) {
      console.error('Error creating admin user:', error)
    }
  }
}