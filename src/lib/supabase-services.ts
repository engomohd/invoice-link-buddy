import { supabase } from "@/integrations/supabase/client";
import { Client, Invoice } from "@/types/invoice";

export const supabaseServices = {
  // Client services
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(client => ({
      ...client,
      createdAt: client.created_at
    }));
  },

  async createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const { data, error } = await supabase.functions.invoke('create-client', {
      body: {
        username: client.username,
        password: client.password,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company
      }
    });
    
    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Failed to create client');
    
    return {
      ...data.client,
      createdAt: data.client.created_at
    };
  },

  async getClientByCredentials(username: string, password: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    
    if (error) return null;
    return data ? {
      ...data,
      createdAt: data.created_at
    } : null;
  },

  // Invoice services
  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients!inner (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(invoice => ({
      id: invoice.id,
      clientId: invoice.client_id,
      clientName: invoice.clients.name,
      clientEmail: invoice.clients.email,
      invoiceNumber: invoice.invoice_number,
      description: invoice.description,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      status: invoice.status as 'draft' | 'pending' | 'paid' | 'overdue',
      dueDate: invoice.due_date,
      createdAt: invoice.created_at,
      paymentLink: invoice.payment_link,
      myfatoorahInvoiceId: invoice.myfatoorah_invoice_id
    }));
  },

  async getInvoicesByClient(clientId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients!inner (
          name,
          email
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(invoice => ({
      id: invoice.id,
      clientId: invoice.client_id,
      clientName: invoice.clients.name,
      clientEmail: invoice.clients.email,
      invoiceNumber: invoice.invoice_number,
      description: invoice.description,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      status: invoice.status as 'draft' | 'pending' | 'paid' | 'overdue',
      dueDate: invoice.due_date,
      createdAt: invoice.created_at,
      paymentLink: invoice.payment_link,
      myfatoorahInvoiceId: invoice.myfatoorah_invoice_id
    }));
  },

  async createPaymentLink(invoiceData: {
    clientId: string;
    description: string;
    amount: number;
    currency: string;
    dueDate: string;
  }): Promise<{ success: boolean; invoice?: Invoice; paymentUrl?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: invoiceData
      });

      if (error) throw error;
      
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};