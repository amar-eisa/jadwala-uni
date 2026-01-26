
# خطة إصلاح مشكلة النقر على البطاقات

## المشكلة
بطاقات الإحصائيات في لوحة التحكم (القاعات، الدكاترة، المجموعات، إلخ) لا تنتقل للصفحة المعنية عند الضغط عليها. السبب أن البطاقة نفسها ليست قابلة للنقر - فقط أيقونة السهم الصغيرة التي تظهر عند التحويم.

---

## الحل
تحويل البطاقة بأكملها إلى عنصر قابل للنقر باستخدام `Link` من react-router-dom.

---

## التغييرات المطلوبة

### تعديل ملف `src/pages/Dashboard.tsx`

**التغيير الرئيسي:**
تغليف الـ `Card` بـ `Link` بدلاً من وضع الـ `Link` فقط على أيقونة السهم.

**الكود الحالي (سطور 124-152):**
```tsx
<Card 
  key={stat.name} 
  className="stat-card group border-0 shadow-card hover:shadow-card-hover"
  style={{ animationDelay: `${index * 100}ms` }}
>
  <CardContent className="p-6">
    ...
    <Link 
      to={stat.href}
      className="opacity-0 group-hover:opacity-100 ..."
    >
      <ArrowLeft ... />
    </Link>
    ...
  </CardContent>
</Card>
```

**الكود الجديد:**
```tsx
<Link to={stat.href} key={stat.name}>
  <Card 
    className="stat-card group border-0 shadow-card hover:shadow-card-hover cursor-pointer"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <CardContent className="p-6">
      ...
      <div className="opacity-0 group-hover:opacity-100 ...">
        <ArrowLeft ... />
      </div>
      ...
    </CardContent>
  </Card>
</Link>
```

---

## التحسينات الإضافية

1. **إضافة `cursor-pointer`** للبطاقة لتوضيح أنها قابلة للنقر
2. **تحسين تأثير hover** ليشمل تغيير لون الخلفية
3. **إزالة الـ `Link` الداخلي** واستبداله بـ `div` لأن البطاقة كلها أصبحت رابط

---

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/pages/Dashboard.tsx` | تغليف بطاقات الإحصائيات بـ Link |

---

## النتيجة المتوقعة
- الضغط على أي جزء من بطاقة الإحصائيات سينقلك للصفحة المعنية
- مؤشر الفأرة سيتغير إلى pointer عند التحويم على البطاقة
- تجربة مستخدم أفضل وأكثر بديهية
