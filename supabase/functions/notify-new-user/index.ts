import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, fullName, phone } = await req.json();
    
    console.log(`Processing new user notification for: ${email}`);

    const results: { twilio?: boolean; n8n?: boolean } = {};

    // --- n8n Webhook ---
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (n8nWebhookUrl) {
      try {
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'new_user_registration',
            email,
            fullName: fullName || 'غير محدد',
            phone: phone || '',
            timestamp: new Date().toISOString(),
          }),
        });
        results.n8n = n8nResponse.ok;
        console.log(`n8n webhook response: ${n8nResponse.status}`);
      } catch (err) {
        console.error('n8n webhook error:', err);
        results.n8n = false;
      }
    } else {
      console.log('N8N_WEBHOOK_URL not configured - skipping n8n notification');
    }

    // --- Twilio WhatsApp ---
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    let fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM') || '';
    
    fromNumber = fromNumber.replace(/[\s\(\)\-]/g, '');
    if (!fromNumber.startsWith('whatsapp:')) {
      fromNumber = `whatsapp:${fromNumber}`;
    }
    
    const toNumber = 'whatsapp:+96599679479';

    if (!accountSid || !authToken || !fromNumber || fromNumber === 'whatsapp:') {
      console.log('Twilio credentials not configured - skipping WhatsApp notification');
    } else {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      
      const messageBody = `🔔 طلب تسجيل جديد في جدولة!

👤 الاسم: ${fullName || 'غير محدد'}
📧 البريد: ${email}
📱 الهاتف: ${phone || 'غير محدد'}

يرجى مراجعة الطلب في لوحة الإدارة.`;

      try {
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: fromNumber,
            To: toNumber,
            Body: messageBody,
          }),
        });

        const data = await response.json();
        results.twilio = response.ok;
        if (!response.ok) {
          console.error('Twilio API error:', data);
        } else {
          console.log('WhatsApp notification sent:', data.sid);
        }
      } catch (err) {
        console.error('Twilio error:', err);
        results.twilio = false;
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
