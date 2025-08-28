import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get('Id');
    const error = url.searchParams.get('error');
    
    console.log('Payment error callback received:', { invoiceId, error });

    // In a real implementation, you might want to update the invoice status to failed
    // and send notification emails to the client

    // For now, just return a simple error page or redirect
    const errorPageHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1 class="error">Payment Failed</h1>
        <p>We're sorry, but your payment could not be processed.</p>
        <p>Invoice ID: ${invoiceId || 'Unknown'}</p>
        <p>Error: ${error || 'Unknown error occurred'}</p>
        <p>Please try again or contact support for assistance.</p>
        <a href="/">Return to Home</a>
      </body>
      </html>
    `;

    return new Response(errorPageHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html'
      },
      status: 200
    });

  } catch (error: any) {
    console.error('Error in payment error callback:', error);
    
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