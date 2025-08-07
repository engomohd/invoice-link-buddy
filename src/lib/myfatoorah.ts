import { PaymentLinkRequest, PaymentLinkResponse } from "@/types/invoice"

// Mock MyFatoorah service - replace with your backend integration
export const myfatoorahService = {
  // Create payment link using MyFatoorah API
  createPaymentLink: async (request: PaymentLinkRequest): Promise<PaymentLinkResponse> => {
    // This is a mock implementation
    // In your actual backend, you'll call MyFatoorah's SendPayment endpoint
    // with your API key and proper authentication
    
    console.log('Creating payment link with MyFatoorah:', request)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock response - replace with actual MyFatoorah integration
    const mockResponse: PaymentLinkResponse = {
      invoiceId: Math.floor(Math.random() * 1000000),
      invoiceURL: `https://portal.myfatoorah.com/ar/invoices/${Math.random().toString(36).substr(2, 9)}`,
      paymentURL: `https://portal.myfatoorah.com/ar/invoices/${Math.random().toString(36).substr(2, 9)}/pay`
    }
    
    return mockResponse
  },

  // Get payment status from MyFatoorah
  getPaymentStatus: async (invoiceId: string): Promise<'paid' | 'pending' | 'failed'> => {
    // Mock implementation - replace with actual MyFatoorah API call
    console.log('Checking payment status for invoice:', invoiceId)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock random status for demo
    const statuses = ['paid', 'pending', 'failed'] as const
    return statuses[Math.floor(Math.random() * statuses.length)]
  }
}

// MyFatoorah API configuration
export const MYFATOORAH_CONFIG = {
  // These should be stored securely in your backend
  // baseUrl: 'https://apitest.myfatoorah.com', // Test environment
  // baseUrl: 'https://api.myfatoorah.com', // Production environment
  // apiKey: 'YOUR_MYFATOORAH_API_KEY', // Store this in your backend
  
  // Default values
  defaultCurrency: 'KWD',
  defaultLanguage: 'en' as const,
  
  // Supported notification options
  notificationOptions: {
    EMAIL: 'EML',
    SMS: 'SMS', 
    LINK_ONLY: 'LNK',
    ALL: 'ALL'
  } as const
}