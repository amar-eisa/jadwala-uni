
# خطة إرسال تنبيه واتساب عند تسجيل مستخدم جديد

## نظرة عامة

سيتم إنشاء Edge Function جديدة ترسل رسالة واتساب عبر Twilio عند كل عملية تسجيل ناجحة للتنبيه على الرقم المحدد (+96599679479).

## المتطلبات

### 1. حساب Twilio
ستحتاج إلى:
- **Account SID**: معرف حسابك في Twilio
- **Auth Token**: رمز المصادقة
- **WhatsApp Sender Number**: رقم واتساب المرسل (عادة بصيغة `whatsapp:+14155238886`)

يمكنك الحصول على هذه البيانات من:
1. اذهب إلى https://console.twilio.com
2. Account SID و Auth Token موجودان في الصفحة الرئيسية
3. لتفعيل WhatsApp، اذهب إلى Messaging > Try it out > Send a WhatsApp message

---

## خطوات التنفيذ

### الخطوة 1: إضافة Secrets لـ Twilio

سنضيف 3 secrets في المشروع:

| Secret | الوصف |
|--------|-------|
| `TWILIO_ACCOUNT_SID` | معرف حساب Twilio |
| `TWILIO_AUTH_TOKEN` | رمز المصادقة |
| `TWILIO_WHATSAPP_FROM` | رقم المرسل (مثال: `whatsapp:+14155238886`) |

### الخطوة 2: إنشاء Edge Function

سننشئ ملف `supabase/functions/notify-new-user/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, fullName } = await req.json();
    
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM');
    const toNumber = 'whatsapp:+96599679479';

    // إرسال رسالة عبر Twilio WhatsApp API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: toNumber,
          Body: `🔔 طلب تسجيل جديد في جدولة!\n\n👤 الاسم: ${fullName}\n📧 البريد: ${email}\n\nيرجى مراجعة الطلب في لوحة الإدارة.`,
        }),
      }
    );

    const data = await response.json();
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### الخطوة 3: تحديث AuthContext.tsx

بعد نجاح التسجيل، نستدعي Edge Function:

```typescript
// في دالة signUp بعد نجاح التسجيل
const { error } = await supabase.auth.signUp({...});

if (!error) {
  // إرسال تنبيه واتساب (بدون انتظار النتيجة)
  supabase.functions.invoke('notify-new-user', {
    body: { email, fullName }
  }).catch(console.error);
}
```

---

## ملخص الملفات

| الملف | التغيير |
|-------|---------|
| `supabase/functions/notify-new-user/index.ts` | إنشاء جديد - Edge Function لإرسال الواتساب |
| `src/contexts/AuthContext.tsx` | تعديل - استدعاء Edge Function بعد التسجيل |

---

## محتوى رسالة الواتساب

```
🔔 طلب تسجيل جديد في جدولة!

👤 الاسم: [اسم المستخدم]
📧 البريد: [البريد الإلكتروني]

يرجى مراجعة الطلب في لوحة الإدارة.
```

---

## ملاحظات مهمة

1. **Twilio Sandbox**: إذا كنت تستخدم Twilio Sandbox للتجربة، يجب أن يكون الرقم المستلم (+96599679479) قد انضم للـ sandbox أولاً عبر إرسال كلمة "join" لرقم Twilio
2. **الإنتاج**: للإنتاج، ستحتاج لتسجيل رقم WhatsApp Business مع Twilio
3. **التكلفة**: Twilio يتقاضى رسوماً لكل رسالة واتساب مرسلة
