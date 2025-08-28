import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateClientRequest {
  username: string;
  password: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
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

    const { username, password, name, email, phone, company }: CreateClientRequest = await req.json();

    // Check if username already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('username')
      .eq('username', username)
      .single();

    if (existingClient) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Username already exists'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Create client in our database first
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        username,
        password,
        name,
        email,
        phone,
        company
      })
      .select()
      .single();

    if (clientError) {
      throw new Error(`Database error: ${clientError.message}`);
    }

    // Save customer data in MyFatoorah using InitiatePayment to register the customer
    const myfatoorahApiKey = Deno.env.get('MYFATOORAH_API_KEY');
    if (myfatoorahApiKey) {
      try {
        // Parse phone number for MyFatoorah format
        let mobileCountryCode = '965'; // Default Kuwait
        let customerMobile = phone || '';
        
        if (phone) {
          // Basic phone parsing - adjust as needed
          if (phone.startsWith('+965')) {
            customerMobile = phone.replace('+965', '').trim();
          } else if (phone.startsWith('965')) {
            customerMobile = phone.replace('965', '').trim();
          }
        }

        // Use InitiatePayment with minimal amount to register customer in MyFatoorah
        const myfatoorahPayload = {
          CustomerName: name,
          CustomerEmail: email,
          CustomerMobile: customerMobile,
          MobileCountryCode: mobileCountryCode,
          InvoiceValue: 0.001, // Minimal amount just to register customer
          CurrencyIso: 'KWD',
          DisplayCurrencyIso: 'KWD',
          Language: 'en',
          UserDefinedField: `Client Registration: ${username}`,
          CustomerReference: client.id, // Link to our client ID
        };

        console.log('Registering customer in MyFatoorah:', { ...myfatoorahPayload, CustomerMobile: 'XXX' });

        const myfatoorahResponse = await fetch('https://apitest.myfatoorah.com/v2/InitiatePayment', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${myfatoorahApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(myfatoorahPayload)
        });

        const myfatoorahData = await myfatoorahResponse.json();
        console.log('MyFatoorah customer registration response:', myfatoorahData);

        if (!myfatoorahResponse.ok || !myfatoorahData.IsSuccess) {
          console.warn(`MyFatoorah registration warning: ${myfatoorahData.Message}`);
          // Don't fail the client creation if MyFatoorah registration fails
        } else {
          console.log('Customer successfully registered in MyFatoorah');
        }
      } catch (myfatoorahError: any) {
        console.error('Error registering customer in MyFatoorah:', myfatoorahError);
        // Don't fail the client creation if MyFatoorah registration fails
      }
    } else {
      console.warn('MyFatoorah API key not configured - skipping customer registration');
    }

    console.log('Client created successfully:', client);

    return new Response(JSON.stringify({
      success: true,
      client
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error creating client:', error);
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