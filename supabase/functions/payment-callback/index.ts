import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const paymentId = url.searchParams.get('paymentId');
    const invoiceId = url.searchParams.get('Id');
    
    console.log('Payment callback received:', { paymentId, invoiceId });

    if (!invoiceId) {
      throw new Error('Invoice ID not provided in callback');
    }

    // Get MyFatoorah API key
    const myfatoorahApiKey = Deno.env.get('MYFATOORAH_API_KEY');
    if (!myfatoorahApiKey) {
      throw new Error('MyFatoorah API key not configured');
    }

    // Check payment status with MyFatoorah
    const myfatoorahPayload = {
      Key: invoiceId,
      KeyType: 'InvoiceId'
    };

    const myfatoorahResponse = await fetch('https://apitest.myfatoorah.com/v2/GetPaymentStatus', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${myfatoorahApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(myfatoorahPayload)
    });

    const myfatoorahData = await myfatoorahResponse.json();
    console.log('MyFatoorah payment status in callback:', myfatoorahData);

    if (!myfatoorahResponse.ok || !myfatoorahData.IsSuccess) {
      throw new Error(`MyFatoorah error: ${myfatoorahData.Message}`);
    }

    // Update invoice status in database
    const invoiceStatus = myfatoorahData.Data.InvoiceStatus;
    let status = 'pending';
    
    if (invoiceStatus === 'Paid' || invoiceStatus === 'Successful') {
      status = 'paid';
    } else if (invoiceStatus === 'Failed' || invoiceStatus === 'Cancelled' || invoiceStatus === 'Expired') {
      status = 'overdue';
    }

    const { data: invoice, error: updateError } = await supabase
      .from('invoices')
      .update({ status })
      .eq('myfatoorah_invoice_id', invoiceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating invoice status:', updateError);
    } else {
      console.log('Invoice status updated successfully:', invoice);
    }

    // Redirect to a success or failure page based on payment status
    const redirectUrl = status === 'paid' 
      ? `${Deno.env.get('SUPABASE_URL')}/payment-success?invoiceId=${invoiceId}`
      : `${Deno.env.get('SUPABASE_URL')}/payment-failed?invoiceId=${invoiceId}`;

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl
      }
    });

  } catch (error: any) {
    console.error('Error in payment callback:', error);
    
    // Redirect to error page
    const errorUrl = `${Deno.env.get('SUPABASE_URL')}/payment-error?error=${encodeURIComponent(error.message)}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': errorUrl
      }
    });
  }
};

serve(handler);