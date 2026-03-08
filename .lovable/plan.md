

## اصلاح التريقرز المفقودة على auth.users

### المشكلة
الدوال (functions) موجودة في قاعدة البيانات لكن التريقرز (triggers) غير مربوطة بجدول `auth.users`، مما يعني ان المستخدمين الجدد لا يحصلون تلقائيا على profile او role او subscription.

### الحل
انشاء 3 triggers على جدول `auth.users` عند حدث `AFTER INSERT`:

1. **`on_auth_user_created_profile`** → ينفذ `handle_new_user()` لانشاء سجل في `profiles`
2. **`on_auth_user_created_role`** → ينفذ `handle_new_user_role()` لاعطاء المستخدم دوره (admin للاول، user للباقين)
3. **`on_auth_user_created_subscription`** → ينفذ `handle_new_user_subscription()` لانشاء اشتراك (active للاول، pending للباقين)

### التفاصيل التقنية
- Migration واحد يحتوي على 3 اوامر `CREATE TRIGGER`
- كل trigger يعمل `AFTER INSERT` على `auth.users`
- يتم استخدام `FOR EACH ROW` لتنفيذ الدالة لكل مستخدم جديد
- لا حاجة لتعديل اي ملفات كود

