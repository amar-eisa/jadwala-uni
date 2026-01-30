
# خطة إصلاح تصدير PDF مع دعم اللغة العربية

## المشكلة الحالية

استخدام `jsPDF` مباشرة لا يدعم الحروف العربية بشكل صحيح لأنه يستخدم خطوط لاتينية فقط.

---

## الحل

إنشاء مستند HTML كامل يحتوي على الجدول مع الترويسة والتذييل، ثم تحويله إلى صورة باستخدام `html2canvas` وإضافتها للـ PDF. هذا يضمن ظهور النص العربي بشكل صحيح.

---

## التغييرات المطلوبة

### ملف `src/hooks/usePdfExport.ts`

| الجزء | التغيير |
|-------|---------|
| إنشاء wrapper HTML | إنشاء عنصر HTML يحتوي على الترويسة + الجدول + التذييل |
| الترويسة | عنوان "جدول المحاضرات لدفعة: [اسم الدفعة]" + التاريخ |
| التذييل | شعار Connect + "جميع الحقوق محفوظة" + بيانات التواصل الجديدة |
| html2canvas | تحويل العنصر الكامل لصورة |
| تصدير PDF | إضافة الصورة للـ PDF بمقاس A4 عرضي |

---

## هيكل الملف المُصدَّر

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                    جدول المحاضرات لدفعة: [اسم الدفعة]                      │
│                           [التاريخ بالتقويم العربي]                         │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│                                                                           │
│                           [جدول المحاضرات]                                │
│                                                                           │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│  [شعار Connect]     جميع الحقوق محفوظة                                    │
│                     للتواصل: amareisa.info@gmail.com - +294 128150105     │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## الكود الجديد

### 1. إنشاء عنصر HTML للتصدير

بدلاً من إضافة النص مباشرة للـ PDF (الذي لا يدعم العربية)، سننشئ عنصر HTML مؤقت:

```typescript
// إنشاء wrapper يحتوي على كل شيء
const wrapper = document.createElement('div');
wrapper.style.cssText = `
  width: 1123px; /* A4 landscape in pixels at 96 DPI */
  background: white;
  padding: 30px;
  direction: rtl;
  font-family: 'Noto Sans Arabic', 'Cairo', sans-serif;
`;

// الترويسة
const header = document.createElement('div');
header.innerHTML = `
  <h1 style="text-align: center; font-size: 24px; margin-bottom: 10px;">
    جدول المحاضرات لدفعة: ${groupName}
  </h1>
  <p style="text-align: center; color: #666; font-size: 14px;">
    ${date}
  </p>
`;

// نسخ الجدول
const tableClone = element.cloneNode(true);

// التذييل
const footer = document.createElement('div');
footer.innerHTML = `
  <div style="display: flex; align-items: center; gap: 15px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
    <img src="${connectLogoUrl}" width="50" height="40" />
    <div>
      <p style="margin: 0;">جميع الحقوق محفوظة</p>
      <p style="margin: 0; font-size: 12px;">
        للتواصل: amareisa.info@gmail.com - +294 128150105
      </p>
    </div>
  </div>
`;
```

### 2. تحويل HTML إلى صورة ثم PDF

```typescript
// إضافة العناصر للـ wrapper
wrapper.appendChild(header);
wrapper.appendChild(tableClone);
wrapper.appendChild(footer);

// إضافة للصفحة مؤقتاً
document.body.appendChild(wrapper);

// تحويل لصورة
const canvas = await html2canvas(wrapper, {
  scale: 2,
  useCORS: true,
  backgroundColor: '#ffffff',
});

// إزالة العنصر المؤقت
document.body.removeChild(wrapper);

// إنشاء PDF
const pdf = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: 'a4',
});

const imgData = canvas.toDataURL('image/png');
pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
pdf.save(filename + '.pdf');
```

---

## تحديث بيانات التواصل

| القديم | الجديد |
|--------|--------|
| jadwala.app@gmail.com | amareisa.info@gmail.com |
| +294 128150105 | +294 128150105 (نفس الرقم) |

---

## الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| `src/hooks/usePdfExport.ts` | إعادة كتابة الدالة لاستخدام HTML wrapper |

---

## النتيجة المتوقعة

- الحروف العربية تظهر بشكل صحيح
- الترويسة تحتوي على اسم الدفعة والتاريخ
- التذييل يحتوي على شعار Connect وبيانات التواصل الجديدة
- PDF بمقاس A4 عرضي (landscape)
