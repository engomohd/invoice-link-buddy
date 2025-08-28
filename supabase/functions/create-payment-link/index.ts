import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentLinkRequest {
  clientId: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { clientId, description, amount, currency, dueDate }: PaymentLinkRequest = await req.json();

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found');
    }

    // First authenticate to get token
    const username = 'apiaccount@myfatoorah.com';
    const password = 'api12345*';
    
    console.log('Authenticating with MyFatoorah...');
    
    const tokenResponse = await fetch('https://apidemo.myfatoorah.com/Token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response:', tokenData);

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(`Authentication failed: ${tokenData.error_description || 'Unknown error'}`);
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice with MyFatoorah ISO API
    const invoicePayload = {
      InvoiceValue: amount,
      CustomerName: client.name,
      CustomerEmail: client.email,
      CustomerMobile: client.phone || '12345678',
      CustomerReference: client.id,
      DisplayCurrencyIsoAlpha: currency,
      CountryCodeId: 1, // Kuwait
      SendInvoiceOption: 4, // All options (SMS, Email, Link)
      InvoiceItemsCreate: [
        {
          ProductId: null,
          ProductName: description,
          Quantity: 1,
          UnitPrice: amount
        }
      ],
      CallBackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-callback`,
      ErrorUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-error`,
      Language: 2, // English
      ExpireDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      ApiCustomFileds: `Invoice: ${invoiceNumber}`
    };

    console.log('Creating invoice with MyFatoorah ISO API:', { ...invoicePayload, CustomerMobile: 'XXX' });

    const myfatoorahResponse = await fetch('https://apidemo.myfatoorah.com/ApiInvoices/CreateInvoiceIso', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoicePayload)
    });

    const myfatoorahData = await myfatoorahResponse.json();
    console.log('MyFatoorah ISO response:', myfatoorahData);

    if (!myfatoorahResponse.ok || !myfatoorahData.IsSuccess) {
      throw new Error(`MyFatoorah error: ${myfatoorahData.Message || 'Unknown error'}`);
    }

    // Create invoice in database
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        client_id: clientId,
        invoice_number: invoiceNumber,
        description,
        amount,
        currency,
        due_date: dueDate,
        payment_link: myfatoorahData.RedirectUrl,
        myfatoorah_invoice_id: myfatoorahData.Id.toString(),
        status: 'pending'
      })
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Database error: ${invoiceError.message}`);
    }

    // Send email notification
    await supabase.functions.invoke('send-payment-email', {
      body: {
        clientEmail: client.email,
        clientName: client.name,
        invoiceNumber,
        amount,
        currency,
        paymentUrl: myfatoorahData.RedirectUrl,
        description,
        dueDate
      }
    });

    console.log('Payment link created successfully:', invoice);

    return new Response(JSON.stringify({
      success: true,
      invoice,
      paymentUrl: myfatoorahData.RedirectUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error creating payment link:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

serve(handler);