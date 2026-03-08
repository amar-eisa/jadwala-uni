

## خطة: إشعار عبر n8n عند تسجيل مستخدم جديد ينتظر الاعتماد

### الفكرة
عند تسجيل مستخدم جديد (حالة `pending`)، يتم إرسال طلب HTTP إلى webhook في n8n، مما يتيح لك بناء أي سيناريو إشعار (واتساب، إيميل، تلقرام، إلخ) من داخل n8n.

### التنفيذ

**1. إضافة سر webhook URL**
- استخدام أداة `add_secret` لطلب رابط الـ webhook من المستخدم وتخزينه كسر باسم `N8N_WEBHOOK_URL`

**2. تعديل Edge Function `notify-new-user`**
- إضافة استدعاء webhook الـ n8n بجانب إشعار Twilio الموجود
- إرسال بيانات المستخدم (الاسم، البريد، الهاتف) كـ JSON POST إلى الـ webhook
- إذا لم يكن Twilio مُعداً، يُرسل فقط عبر n8n والعكس صحيح

**3. البيانات المرسلة للـ webhook**
```json
{
  "event": "new_user_registration",
  "email": "user@example.com",
  "fullName": "اسم المستخدم",
  "timestamp": "2026-03-08T..."
}
```

### الملفات المتأثرة

| ملف | تعديل |
|-----|-------|
| `supabase/functions/notify-new-user/index.ts` | إضافة استدعاء n8n webhook |

### الخطوات
1. أطلب منك رابط الـ webhook وأخزنه كسر آمن
2. أعدّل الـ edge function لإرسال البيانات للـ webhook
3. أعيد نشر الدالة وأختبرها

