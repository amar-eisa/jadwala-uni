

## تبديل الوضع الفاتح/الداكن — تلقائي + نقل للهيدر

### التغييرات

**1. `src/App.tsx`** — تفعيل الوضع التلقائي حسب النظام:
- تغيير `enableSystem={false}` إلى `enableSystem={true}`
- تغيير `defaultTheme="light"` إلى `defaultTheme="system"`

**2. `src/components/ThemeToggle.tsx`** — تحويل إلى أيقونة فقط:
- تغيير من `Button` بنص كامل إلى زر أيقونة فقط (`size="icon"`)
- دورة بين 3 أوضاع: `system` → `light` → `dark` → `system`
- إظهار أيقونة مناسبة لكل وضع (Sun/Moon/Monitor)
- إزالة النص العربي وجعل الزر مربع صغير مع tooltip

**3. `src/components/Layout.tsx`** — نقل الزر من الشريط الجانبي إلى الهيدر:
- إزالة `<ThemeToggle />` من قسم المستخدم في أسفل الشريط الجانبي (سطر 247)
- إضافة `<ThemeToggle />` بجانب `<NotificationBell />` في الهيدر (سطر 284-286)

