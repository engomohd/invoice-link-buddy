export interface Invoice {
  id: string
  clientId: string
  clientName: string
  clientEmail: string
  invoiceNumber: string
  description: string
  amount: number
  currency: string
  status: 'draft' | 'pending' | 'paid' | 'overdue'
  dueDate: string
  createdAt: string
  paymentLink?: string
  myfatoorahInvoiceId?: string
}

export interface Client {
  id: string
  username: string
  password: string
  name: string
  email: string
  phone?: string
  company?: string
  createdAt: string
}

export interface PaymentLinkRequest {
  amount: number
  currency: string
  customerName: string
  customerEmail: string
  customerMobile?: string
  description: string
  callbackUrl?: string
  errorUrl?: string
  language?: 'en' | 'ar'
  displayCurrencyIso?: string
}

export interface PaymentLinkResponse {
  invoiceId: number
  invoiceURL: string
  paymentURL: string
}