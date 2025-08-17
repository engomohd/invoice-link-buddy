import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  description: string;
  dueDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    const resend = new Resend(resendApiKey);
    
    const {
      clientEmail,
      clientName,
      invoiceNumber,
      amount,
      currency,
      paymentUrl,
      description,
      dueDate
    }: EmailRequest = await req.json();

    console.log('Sending payment email to:', clientEmail);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Invoice - ${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
            .pay-button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; text-align: center; }
            .pay-button:hover { background: linear-gradient(135deg, #059669, #047857); }
            .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Invoice</h1>
            <p>Invoice #${invoiceNumber}</p>
          </div>
          
          <div class="content">
            <h2>Dear ${clientName},</h2>
            <p>We hope this email finds you well. You have a new payment invoice ready for processing.</p>
            
            <div class="invoice-details">
              <h3>Invoice Details:</h3>
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Description:</strong> ${description}</p>
              <p><strong>Amount:</strong> ${amount} ${currency}</p>
              <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${paymentUrl}" class="pay-button">PAY NOW</a>
            </div>
            
            <p>You can click the "PAY NOW" button above to securely complete your payment through MyFatoorah.</p>
            
            <p>If you have any questions or concerns about this invoice, please don't hesitate to contact us.</p>
            
            <p>Thank you for your business!</p>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© 2025 Masdar Online Payment System</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: 'Masdar Payment <noreply@resend.dev>',
      to: [clientEmail],
      subject: `Payment Invoice ${invoiceNumber} - Amount: ${amount} ${currency}`,
      html: emailHtml
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.data?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
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