

# خطة إضافة شعار الجامعة المخصص في ترويسة PDF

## الهدف

إضافة شعار الجامعة الذي رفعه المستخدم في إعدادات المؤسسة إلى ترويسة ملف PDF المُصدَّر.

---

## التغييرات المطلوبة

### 1. تحديث `usePdfExport.ts`

| الجزء | التغيير |
|-------|---------|
| الـ interface | إضافة خاصية `universityLogoUrl` و `universityName` للـ `ExportOptions` |
| الترويسة | إضافة شعار الجامعة بجانب العنوان الرئيسي |

**الترويسة الجديدة:**
```text
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  [شعار الجامعة]      جدول المحاضرات لدفعة: [اسم الدفعة]    [اسم الجامعة] │
│                           [التاريخ بالتقويم العربي]                        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 2. تحديث `TimetablePage.tsx`

| الجزء | التغيير |
|-------|---------|
| imports | إضافة `useUserSettings` |
| استدعاء الـ hook | جلب بيانات المستخدم `university_logo_url` و `university_name` |
| دالة `handleExportPdf` | تمرير شعار واسم الجامعة للـ `exportToPdf` |

---

## تصميم الترويسة الجديد

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌────────┐                                              ┌────────┐        │
│  │ شعار   │      جدول المحاضرات لدفعة: الحاسب 2024      │ شعار   │        │
│  │ الجامعة │              الأحد، 1 فبراير 2026           │ Connect │       │
│  └────────┘                                              └────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ملاحظة:** إذا لم يكن هناك شعار مخصص، ستظهر الترويسة بدون الشعار.

---

## الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| `src/hooks/usePdfExport.ts` | إضافة دعم شعار الجامعة في الترويسة |
| `src/pages/TimetablePage.tsx` | تمرير بيانات الجامعة للتصدير |

---

## التفاصيل التقنية

### تعديل ExportOptions

```typescript
interface ExportOptions {
  filename?: string;
  title?: string;
  groupName?: string;
  orientation?: 'portrait' | 'landscape';
  universityLogoUrl?: string | null;  // جديد
  universityName?: string | null;     // جديد
}
```

### تعديل الترويسة في usePdfExport

```typescript
// Create header with university logo
const header = document.createElement('div');
header.style.cssText = `
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e5e7eb;
`;

// University logo (if available)
const universityLogoHtml = universityLogoUrl 
  ? `<img src="${universityLogoUrl}" width="70" height="70" style="object-fit: contain;" />`
  : '';

// University name (if available)
const universityNameHtml = universityName
  ? `<p style="font-size: 12px; color: #6b7280; margin-top: 4px;">${universityName}</p>`
  : '';

header.innerHTML = `
  <div style="width: 80px; text-align: right;">
    ${universityLogoHtml}
  </div>
  <div style="flex: 1; text-align: center;">
    <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">
      ${title}
    </h1>
    <p style="font-size: 14px; color: #6b7280; margin: 0;">
      ${date}
    </p>
    ${universityNameHtml}
  </div>
  <div style="width: 80px;"></div>
`;
```

### تحديث TimetablePage

```typescript
// Add import
import { useUserSettings } from '@/hooks/useUserSettings';

// Inside component
const { data: userSettings } = useUserSettings();

// Update handleExportPdf
const handleExportPdf = async () => {
  await exportToPdf('timetable-grid', { 
    filename,
    groupName,
    orientation: 'landscape',
    universityLogoUrl: userSettings?.university_logo_url,
    universityName: userSettings?.university_name
  });
};
```

---

## النتيجة المتوقعة

- إذا رفع المستخدم شعار جامعته من صفحة الإعدادات، سيظهر في الترويسة
- إذا أضاف اسم الجامعة، سيظهر تحت العنوان
- إذا لم تكن هناك إعدادات، الترويسة تبقى كما هي (العنوان + التاريخ فقط)

