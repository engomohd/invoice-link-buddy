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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

    // Create MyFatoorah payment link
    const myfatoorahApiKey = Deno.env.get('MYFATOORAH_API_KEY');
    if (!myfatoorahApiKey) {
      throw new Error('MyFatoorah API key not configured');
    }

    const myfatoorahPayload = {
      CustomerName: client.name,
      CustomerEmail: client.email,
      CustomerMobile: client.phone || '',
      InvoiceValue: amount,
      CurrencyIso: currency,
      DisplayCurrencyIso: currency,
      MobileCountryCode: '965',
      CallBackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-callback`,
      ErrorUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-error`,
      Language: 'en',
      NotificationOption: 'LNK'
    };

    console.log('Creating MyFatoorah payment link:', myfatoorahPayload);

    const myfatoorahResponse = await fetch('https://apitest.myfatoorah.com/v2/SendPayment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${myfatoorahApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(myfatoorahPayload)
    });

    const myfatoorahData = await myfatoorahResponse.json();
    console.log('MyFatoorah response:', myfatoorahData);

    if (!myfatoorahResponse.ok || !myfatoorahData.IsSuccess) {
      throw new Error(`MyFatoorah error: ${myfatoorahData.Message}`);
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

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
        payment_link: myfatoorahData.Data.InvoiceURL,
        myfatoorah_invoice_id: myfatoorahData.Data.InvoiceId.toString(),
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
        paymentUrl: myfatoorahData.Data.InvoiceURL,
        description,
        dueDate
      }
    });

    console.log('Payment link created successfully:', invoice);

    return new Response(JSON.stringify({
      success: true,
      invoice,
      paymentUrl: myfatoorahData.Data.InvoiceURL
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