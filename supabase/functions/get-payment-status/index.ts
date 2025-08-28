import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentStatusRequest {
  invoiceId: string;
  keyType: 'InvoiceId' | 'PaymentId';
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

    const { invoiceId, keyType }: PaymentStatusRequest = await req.json();

    // Get MyFatoorah API key
    const myfatoorahApiKey = Deno.env.get('MYFATOORAH_API_KEY');
    if (!myfatoorahApiKey) {
      throw new Error('MyFatoorah API key not configured');
    }

    const myfatoorahPayload = {
      Key: invoiceId,
      KeyType: keyType
    };

    console.log('Checking payment status with MyFatoorah:', myfatoorahPayload);

    const myfatoorahResponse = await fetch('https://apitest.myfatoorah.com/v2/GetPaymentStatus', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${myfatoorahApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(myfatoorahPayload)
    });

    const myfatoorahData = await myfatoorahResponse.json();
    console.log('MyFatoorah payment status response:', myfatoorahData);

    if (!myfatoorahResponse.ok || !myfatoorahData.IsSuccess) {
      throw new Error(`MyFatoorah error: ${myfatoorahData.Message}`);
    }

    // Update invoice status in database if payment is successful
    const invoiceStatus = myfatoorahData.Data.InvoiceStatus;
    if (invoiceStatus === 'Paid' || invoiceStatus === 'Successful') {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('myfatoorah_invoice_id', invoiceId);
    } else if (invoiceStatus === 'Failed' || invoiceStatus === 'Cancelled' || invoiceStatus === 'Expired') {
      await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('myfatoorah_invoice_id', invoiceId);
    }

    return new Response(JSON.stringify({
      success: true,
      invoiceStatus: myfatoorahData.Data.InvoiceStatus,
      invoiceData: myfatoorahData.Data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error checking payment status:', error);
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