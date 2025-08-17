import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth"
import { supabaseServices } from "@/lib/supabase-services"
import { Invoice, Client } from "@/types/invoice"
import { LogOut, Plus, FileText, Users, DollarSign, CreditCard, Edit, Trash2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminDashboardProps {
  onLogout: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [showCreateClient, setShowCreateClient] = useState(false)
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState(false)
  const { toast } = useToast()

  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    description: '',
    amount: '',
    currency: 'USD',
    dueDate: ''
  })

  const [newClient, setNewClient] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    company: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [allInvoices, allClients] = await Promise.all([
        supabaseServices.getInvoices(),
        supabaseServices.getClients()
      ])
      setInvoices(allInvoices)
      setClients(allClients)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newInvoice.clientId || !newInvoice.description || !newInvoice.amount || !newInvoice.dueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsCreatingPaymentLink(true)

    try {
      const result = await supabaseServices.createPaymentLink({
        clientId: newInvoice.clientId,
        description: newInvoice.description,
        amount: parseFloat(newInvoice.amount),
        currency: newInvoice.currency,
        dueDate: newInvoice.dueDate
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment link')
      }

      // Refresh data
      await loadData()
      
      setShowCreateInvoice(false)
      setNewInvoice({
        clientId: '',
        description: '',
        amount: '',
        currency: 'KWD',
        dueDate: ''
      })

      toast({
        title: "Invoice created successfully",
        description: "Invoice created with payment link! Email sent to client.",
      })
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice and payment link",
        variant: "destructive",
      })
    } finally {
      setIsCreatingPaymentLink(false)
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newClient.username || !newClient.password || !newClient.name || !newClient.email) {
      toast({
        title: "Validation Error", 
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check if username already exists
    if (clients.some(c => c.username === newClient.username)) {
      toast({
        title: "Error",
        description: "Username already exists",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const client = await supabaseServices.createClient(newClient)
      setClients(prev => [...prev, client])
      setShowCreateClient(false)
      setNewClient({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        company: ''
      })

      toast({
        title: "Client created successfully",
        description: `Client ${client.name} has been added`,
      })
    } catch (error) {
      console.error('Error creating client:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create client",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    authService.logout()
    toast({
      title: "Logged out",
      description: "Admin session ended",
    })
    onLogout()
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'paid'
      case 'pending': return 'pending'
      case 'overdue': return 'overdue'
      case 'draft': return 'draft'
      default: return 'draft'
    }
  }

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0)
  const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, invoice) => sum + invoice.amount, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero shadow-elegant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-white/80">Manage clients, invoices, and payments</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="text-white border-white hover:bg-white hover:text-primary">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAmount, 'USD')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-status-paid/10 rounded-lg">
                  <CreditCard className="h-6 w-6 text-status-paid" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-status-paid">{formatCurrency(paidAmount, 'USD')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-status-pending/10 rounded-lg">
                  <FileText className="h-6 w-6 text-status-pending" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-status-pending">{formatCurrency(pendingAmount, 'USD')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">{clients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Invoices Management
                    </CardTitle>
                    <CardDescription>
                      Create and manage client invoices with MyFatoorah integration
                    </CardDescription>
                  </div>
                  <Dialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
                    <DialogTrigger asChild>
                      <Button variant="hero">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Invoice</DialogTitle>
                        <DialogDescription>
                          Create an invoice with automatic MyFatoorah payment link generation
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateInvoice} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="client">Client</Label>
                          <Select value={newInvoice.clientId} onValueChange={(value) => setNewInvoice(prev => ({ ...prev, clientId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name} ({client.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Service description..."
                            value={newInvoice.description}
                            onChange={(e) => setNewInvoice(prev => ({ ...prev, description: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={newInvoice.amount}
                              onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={newInvoice.currency} onValueChange={(value) => setNewInvoice(prev => ({ ...prev, currency: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="KWD">KWD</SelectItem>
                                <SelectItem value="SAR">SAR</SelectItem>
                                <SelectItem value="AED">AED</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={newInvoice.dueDate}
                            onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isCreatingPaymentLink}>
                          {isCreatingPaymentLink ? "Creating Payment Link..." : "Create Invoice"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
                    <p className="text-muted-foreground">Create your first invoice to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="border rounded-lg p-6 hover:shadow-card transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                            <p className="text-muted-foreground">{invoice.description}</p>
                            <p className="text-sm text-muted-foreground">Client: {invoice.clientName}</p>
                          </div>
                          <StatusBadge variant={getStatusColor(invoice.status)}>
                            {invoice.status.toUpperCase()}
                          </StatusBadge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-semibold">{formatCurrency(invoice.amount, invoice.currency)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Due Date</p>
                            <p className="font-semibold">{formatDate(invoice.dueDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="font-semibold">{formatDate(invoice.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">MyFatoorah ID</p>
                            <p className="font-semibold">{invoice.myfatoorahInvoiceId || 'N/A'}</p>
                          </div>
                        </div>

                        {invoice.paymentLink && (
                          <div className="pt-4 border-t">
                            <Button 
                              variant="outline"
                              onClick={() => window.open(invoice.paymentLink, '_blank')}
                              className="w-full sm:w-auto"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Payment Link
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Client Management
                    </CardTitle>
                    <CardDescription>
                      Add and manage client accounts
                    </CardDescription>
                  </div>
                  <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
                    <DialogTrigger asChild>
                      <Button variant="success">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Client
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
                        <DialogDescription>
                          Create a new client account with login credentials
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateClient} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              type="text"
                              placeholder="username"
                              value={newClient.username}
                              onChange={(e) => setNewClient(prev => ({ ...prev, username: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="password"
                              value={newClient.password}
                              onChange={(e) => setNewClient(prev => ({ ...prev, password: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={newClient.name}
                            onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={newClient.email}
                            onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1234567890"
                            value={newClient.phone}
                            onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company (Optional)</Label>
                          <Input
                            id="company"
                            type="text"
                            placeholder="Company Name"
                            value={newClient.company}
                            onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Add Client
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No clients found</h3>
                    <p className="text-muted-foreground">Add your first client to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map((client) => (
                      <Card key={client.id} className="shadow-card">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{client.name}</h3>
                              <p className="text-sm text-muted-foreground">@{client.username}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="text-sm">{client.email}</p>
                            </div>
                            {client.phone && (
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="text-sm">{client.phone}</p>
                              </div>
                            )}
                            {client.company && (
                              <div>
                                <p className="text-sm text-muted-foreground">Company</p>
                                <p className="text-sm">{client.company}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm text-muted-foreground">Joined</p>
                              <p className="text-sm">{formatDate(client.createdAt)}</p>
                            </div>
                          </div>

                          <div className="text-center">
                            <p className="text-sm font-medium">
                              {invoices.filter(inv => inv.clientId === client.id).length} invoices
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}