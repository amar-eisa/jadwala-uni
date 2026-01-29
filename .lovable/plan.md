
# خطة إصلاح عرض شعار الجامعة في الشاشة الرئيسية

## المشكلة
شعار الجامعة الذي يرفعه المستخدم من صفحة الإعدادات لا يظهر في أي مكان في الشاشة الرئيسية. حالياً يتم عرض اسم الجامعة فقط، بينما يبقى شعار النظام (`jadwala-logo.png`) ثابتاً.

---

## الحل المقترح
إضافة عرض شعار الجامعة المخصص في الشريط الجانبي بجانب شعار النظام أو أسفله.

---

## التغييرات المطلوبة

### تعديل ملف `src/components/Layout.tsx`

**التصميم المقترح للشريط الجانبي:**

```text
قبل:
┌─────────────────────────────┐
│  [شعار جدولة]  جدولة       │
│              اسم الجامعة    │
└─────────────────────────────┘

بعد:
┌─────────────────────────────┐
│  [شعار جدولة]  جدولة       │
│  [شعار الجامعة]  اسم الجامعة│  ← جديد
└─────────────────────────────┘
```

**التغييرات:**
1. إذا كان `userSettings?.university_logo_url` موجوداً، يتم عرض شعار الجامعة
2. يُعرض الشعار بجانب اسم الجامعة في قسم منفصل أسفل شعار النظام
3. إضافة تصميم جذاب لقسم الجامعة

---

## الكود المقترح

```tsx
{/* Logo Header */}
<div className="...">
  {/* شعار النظام */}
  <div className="flex items-center gap-3">
    <img src={jadwalaLogo} alt="جدولة" className="h-10 w-auto" />
    <h1 className="text-lg font-bold">جدولة</h1>
  </div>
  
  {/* شعار الجامعة المخصص - جديد */}
  {(userSettings?.university_name || userSettings?.university_logo_url) && (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-sidebar-border/50">
      {userSettings?.university_logo_url && (
        <img 
          src={userSettings.university_logo_url} 
          alt="شعار الجامعة" 
          className="h-8 w-8 object-contain rounded"
        />
      )}
      {userSettings?.university_name && (
        <span className="text-xs text-sidebar-foreground/70">
          {userSettings.university_name}
        </span>
      )}
    </div>
  )}
</div>
```

---

## ملاحظة إضافية
سيتم أيضاً إضافة cache-busting للصورة لضمان تحديثها فوراً عند الرفع:

```tsx
src={`${userSettings.university_logo_url}?t=${new Date().getTime()}`}
```

---

## الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| `src/components/Layout.tsx` | تعديل - إضافة عرض شعار الجامعة المخصص |

