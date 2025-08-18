import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { authService } from "@/lib/auth"
import { supabaseServices } from "@/lib/supabase-services"
import { Invoice } from "@/types/invoice"
import { LogOut, FileText, CreditCard, Calendar, ExternalLink, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ClientDashboardProps {
  onLogout: () => void
}

export function ClientDashboard({ onLogout }: ClientDashboardProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadUserAndInvoices()
  }, [])

  const loadUserAndInvoices = async () => {
    setIsLoading(true)
    try {
      const user = await authService.getCurrentUser()
      setCurrentUser(user)
      
      if (user) {
        const clientInvoices = await supabaseServices.getInvoicesByClient(user.id)
        setInvoices(clientInvoices)
      }
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

  const handlePayNow = (invoice: Invoice) => {
    if (invoice.paymentLink) {
      window.open(invoice.paymentLink, '_blank')
      toast({
        title: "Redirecting to payment",
        description: "Opening MyFatoorah payment page",
      })
    } else {
      toast({
        title: "Payment link unavailable",
        description: "Please contact support for assistance",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    authService.logout()
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
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
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, invoice) => sum + invoice.amount, 0)

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
      <header className="bg-gradient-primary shadow-elegant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h1 className="text-2xl font-bold">Welcome back, {currentUser?.name}</h1>
              <p className="text-white/80">Manage your invoices and payments</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
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
                  <Calendar className="h-6 w-6 text-status-pending" />
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
                <div className="p-2 bg-status-overdue/10 rounded-lg">
                  <FileText className="h-6 w-6 text-status-overdue" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-status-overdue">{formatCurrency(overdueAmount, 'USD')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Invoices
            </CardTitle>
            <CardDescription>
              View and manage your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
                <p className="text-muted-foreground">You don't have any invoices yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="border rounded-lg p-6 hover:shadow-card transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                        <p className="text-muted-foreground">{invoice.description}</p>
                      </div>
                      <StatusBadge variant={getStatusColor(invoice.status)}>
                        {invoice.status.toUpperCase()}
                      </StatusBadge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                    </div>

                    {(invoice.status === 'pending' || invoice.status === 'overdue') && invoice.paymentLink && (
                      <div className="pt-4 border-t">
                        <Button 
                          onClick={() => handlePayNow(invoice)}
                          variant={invoice.status === 'overdue' ? 'destructive' : 'success'}
                          className="w-full sm:w-auto"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Pay Now via MyFatoorah
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}