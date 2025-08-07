import { Invoice, Client } from "@/types/invoice"

// Mock data storage - replace with your MySQL backend integration
export const invoiceStorage = {
  // Get all invoices for admin
  getAllInvoices: (): Invoice[] => {
    return JSON.parse(localStorage.getItem('invoices') || '[]')
  },

  // Get invoices for specific client
  getClientInvoices: (clientId: string): Invoice[] => {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]')
    return invoices.filter((invoice: Invoice) => invoice.clientId === clientId)
  },

  // Create new invoice
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>): Invoice => {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]')
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    invoices.push(newInvoice)
    localStorage.setItem('invoices', JSON.stringify(invoices))
    return newInvoice
  },

  // Update invoice
  updateInvoice: (id: string, updates: Partial<Invoice>): Invoice | null => {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]')
    const index = invoices.findIndex((inv: Invoice) => inv.id === id)
    
    if (index === -1) return null
    
    invoices[index] = { ...invoices[index], ...updates }
    localStorage.setItem('invoices', JSON.stringify(invoices))
    return invoices[index]
  },

  // Delete invoice
  deleteInvoice: (id: string): boolean => {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]')
    const filteredInvoices = invoices.filter((inv: Invoice) => inv.id !== id)
    
    if (filteredInvoices.length === invoices.length) return false
    
    localStorage.setItem('invoices', JSON.stringify(filteredInvoices))
    return true
  }
}

export const clientStorage = {
  // Get all clients
  getAllClients: (): Client[] => {
    return JSON.parse(localStorage.getItem('clients') || '[]')
  },

  // Create new client
  createClient: (client: Omit<Client, 'id' | 'createdAt'>): Client => {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]')
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    clients.push(newClient)
    localStorage.setItem('clients', JSON.stringify(clients))
    return newClient
  },

  // Update client
  updateClient: (id: string, updates: Partial<Client>): Client | null => {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]')
    const index = clients.findIndex((client: Client) => client.id === id)
    
    if (index === -1) return null
    
    clients[index] = { ...clients[index], ...updates }
    localStorage.setItem('clients', JSON.stringify(clients))
    return clients[index]
  },

  // Delete client
  deleteClient: (id: string): boolean => {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]')
    const filteredClients = clients.filter((client: Client) => client.id !== id)
    
    if (filteredClients.length === clients.length) return false
    
    localStorage.setItem('clients', JSON.stringify(filteredClients))
    return true
  }
}

// Initialize with sample data if empty
export const initializeSampleData = () => {
  if (!localStorage.getItem('clients')) {
    const sampleClients: Client[] = [
      {
        id: '1',
        username: 'john_doe',
        password: 'password123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'ABC Corp',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        username: 'jane_smith',
        password: 'password123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        company: 'XYZ Ltd',
        createdAt: new Date().toISOString()
      }
    ]
    localStorage.setItem('clients', JSON.stringify(sampleClients))
  }

  if (!localStorage.getItem('invoices')) {
    const sampleInvoices: Invoice[] = [
      {
        id: '1',
        clientId: '1',
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        invoiceNumber: 'INV-001',
        description: 'Web Development Services',
        amount: 1500,
        currency: 'USD',
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        paymentLink: 'https://portal.myfatoorah.com/ar/invoices/sample1/pay'
      },
      {
        id: '2',
        clientId: '2',
        clientName: 'Jane Smith',
        clientEmail: 'jane@example.com',
        invoiceNumber: 'INV-002',
        description: 'Mobile App Design',
        amount: 2500,
        currency: 'USD',
        status: 'paid',
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        paymentLink: 'https://portal.myfatoorah.com/ar/invoices/sample2/pay'
      },
      {
        id: '3',
        clientId: '1',
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        invoiceNumber: 'INV-003',
        description: 'SEO Optimization',
        amount: 800,
        currency: 'USD',
        status: 'overdue',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        paymentLink: 'https://portal.myfatoorah.com/ar/invoices/sample3/pay'
      }
    ]
    localStorage.setItem('invoices', JSON.stringify(sampleInvoices))
  }
}