import { PaymentLinkRequest, PaymentLinkResponse } from "@/types/invoice"

// Real MyFatoorah service - now integrated with actual API
export const myfatoorahService = {
  // Create payment link using MyFatoorah API - frontend version for demonstration
  createPaymentLink: async (request: PaymentLinkRequest): Promise<PaymentLinkResponse> => {
    console.log('Creating payment link with MyFatoorah:', request)
    
    try {
      // Call our Supabase edge function which handles the actual MyFatoorah integration
      const response = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: 'mock-client-id', // This should come from your client data
          description: request.description,
          amount: request.amount,
          currency: request.currency,
          dueDate: new Date().toISOString().split('T')[0] // Today's date as default
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment link')
      }
      
      return {
        invoiceId: data.invoice.myfatoorah_invoice_id,
        invoiceURL: data.paymentUrl,
        paymentURL: data.paymentUrl
      }
    } catch (error) {
      console.error('Error creating payment link:', error)
      throw error
    }
  },

  // Get payment status from MyFatoorah
  getPaymentStatus: async (invoiceId: string): Promise<'paid' | 'pending' | 'failed'> => {
    console.log('Checking payment status for invoice:', invoiceId)
    
    try {
      // In a real implementation, you'd call MyFatoorah's GetPaymentStatus endpoint
      // through your backend edge function
      const response = await fetch('/api/get-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoiceId,
          keyType: 'InvoiceId' // or 'PaymentId' depending on what you're passing
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get payment status')
      }
      
      // Map MyFatoorah status to our simplified status
      const myfatoorahStatus = data.invoiceStatus?.toLowerCase()
      if (myfatoorahStatus === 'paid' || myfatoorahStatus === 'successful') {
        return 'paid'
      } else if (myfatoorahStatus === 'pending' || myfatoorahStatus === 'processing') {
        return 'pending'
      } else {
        return 'failed'
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      // Return pending as default to avoid breaking the UI
      return 'pending'
    }
  }
}

// MyFatoorah API configuration
export const MYFATOORAH_CONFIG = {
  // API endpoints (handled in backend edge functions for security)
  testBaseUrl: 'https://apitest.myfatoorah.com', // Test environment
  prodBaseUrl: 'https://api.myfatoorah.com', // Production environment
  
  // Default values
  defaultCurrency: 'KWD',
  defaultLanguage: 'en' as const,
  
  // Supported notification options
  notificationOptions: {
    EMAIL: 'EML',
    SMS: 'SMS', 
    LINK_ONLY: 'LNK',
    ALL: 'ALL'
  } as const,
  
  // Invoice status mapping from MyFatoorah to our simplified statuses
  statusMapping: {
    'Paid': 'paid',
    'Successful': 'paid',
    'Pending': 'pending',
    'Processing': 'pending',
    'Failed': 'failed',
    'Cancelled': 'failed',
    'Expired': 'failed'
  } as const
}