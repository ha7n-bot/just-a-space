# دليل إدارة الموقع • Owner handover

## البدء

تُفتح لوحة الإدارة من ‎/admin‎ على عنوان الموقع الخاص. اختر العربية أو English. تُنشأ عضوية المالك لأول مرة من الطرفية على نفس قاعدة بيانات الموقع وفق DEPLOYMENT_GUIDE.md. احتفظ بحساب النطاق والاستضافة والنسخ الاحتياطية باسم المنشأة. لا يوجد حساب إداري أو كلمة مرور مرفقة مع المشروع.

| Role | Normal use |
| --- | --- |
| OWNER | Approve and publish reviewed records, manage business settings, accounts and audit access |
| CONTENT_MANAGER | Prepare bilingual content and submit for review. Withdraw products when necessary |
| VIEWER | Inspect permitted records without changing them |

## نشر المنيو

1. افتح «التصنيفات» وأنشئ تصنيفًا باسم عربي وإنجليزي ومفتاح رابط ثابت بحروف لاتينية صغيرة وشرطات. أدخل رابط مرجع مؤيد وتاريخ التحقق. احفظ المسودة ثم أرسلها للمراجعة واعتمدها بحساب المالك.
2. افتح «المنتجات» وأنشئ الصنف واربطه بمفتاح التصنيف المنشور. أدخل الاسم والوصف باللغتين، والسعر الفعلي للفرع بالريال. عند غياب السعر، اتركه فارغًا واحفظ مسودة. الصفر يعني سعرًا فعليًا قدره صفر. تحقّق من السعر المعروض وقناة البيع قبل اعتماد أي قيمة.
3. أضف الحجم والبدائل إذا كانت موثقة. اسم البديل له قيمتان ar وen وسعر رقمي. راجع MENU_DATA_SCHEMA.md لمعنى سعر الحجم وسعر الإضافة. لا تذكر مكوّنات أو مسببات حساسية دون مرجع معتمد.
4. أضف الصورة المرخّصة ووصفًا بديلًا باللغتين. سجّل المصدر وتاريخ التحقق ثم احفظ وأرسل للمراجعة. راجع المسودة والنسخة المنشورة داخل السجل. بعد اعتماد المالك، افتح ‎/ar/menu‎ و‎/en/menu‎ وتحقّق من السعر وصفحة الصنف.
5. لسحب صنف فورًا، استخدم الأرشفة. تبقى النسخة محفوظة للإدارة ويختفي الصنف من القراءة العامة. عند عودته استعده كمسودة ثم أعد اعتماده. تغيير المسودة وحده يُبقي النسخة المنشورة السابقة. تأكد من حالة التوفر بعد إعادة النشر.

## الموقع والساعات والصور

- سجل النشاط الأساسي يستخدم المفتاح business ضمن إعدادات المنشأة. أدخل وسائل التواصل التي تمتلكها المنشأة فقط. تحفظ إدارة وسائل التواصل الاجتماعية كل وجهة كعنوان HTTPS. افتح كل رابط وتأكد من الحساب الصحيح قبل نشره.
- سجل الساعات يستخدم المفتاح schedule. الأيام من 0 للأحد إلى 6 للسبت. تُكتب الفترات بتوقيت الرياض بصيغة 24 ساعة. نهاية تسبق البداية تعني أن الإغلاق في اليوم التالي. استخدم قائمة فارغة ليوم إغلاق مؤكد، واترك اليوم المجهول دون مفتاح. الساعات الاستثنائية بمفتاح التاريخ الميلادي مثل 2027-01-01. اختبار الساعات موثق في QA_RESULTS.md.
- لتحميل صورة من الإدارة استخدم PNG بنظام RGB أو RGBA، بعمق 8 بت ومن دون تداخل. أقصى حجم 3,000,000 بايت، وأقصى عرض أو ارتفاع 4096 بكسل، ومجموع البكسلات لا يتجاوز 4 ملايين. انسخ مسار الملف المعروض في حقل الصورة. للمعرض يلزم الوصف البديل باللغتين واسم صاحب الحقوق ووصف الإذن والأبعاد. احتفظ بنسخة من تصريح الاستخدام.
- من «الصفحات» و«إعدادات البحث» اختر مفتاح الصفحة، وعدّل النص السعودي والإنجليزي، ثم راجع النسختين. صور التصميم التوضيحية ليست صورًا للفرع. اعتمد الصور الأصلية والحقوق ونصوص النشر قبل فتح الموقع للعامة.
- تظل رسائل التواصل غير مفعّلة إلى حين إعداد قناة واستكمال إشعار الخصوصية المناسب. يستخدم زائر الموقع فقط القنوات المنشورة بعد التحقق. بيانات الطلب والدفع ليست ضمن هذا الإصدار.

## Routine operations

| Task | Procedure |
| --- | --- |
| Review uncertain details | In DATA_VERIFICATION.md and RESEARCH_SOURCES.md identify each outstanding check. Gather an owner-approved source and permission before publication |
| Resolve a stale edit | Reopen the latest revision after a conflict, reconcile changes and resubmit |
| Revoke staff access | In Users select the named account and disable it. Review Activity Log and change credentials as needed |
| Recover removed content | Restore the archived item to draft, inspect it and submit for approval |
| Recover the service | Restore a tested SQLite snapshot to a fresh path and switch the service after inspecting it, using DEPLOYMENT_GUIDE.md |
| Handover launch authority | Confirm the owner controls the repository, host, registrar, DNS and recovery accounts. Review FINAL_AUDIT.md with the owner before requesting public release |

After every price, hour or link update, check the visitor experience in Arabic and English from a private browser session. Record the date of the next verification, especially during Ramadan and holidays. Written owner approval for the menu should distinguish dine-in prices from delivery-platform prices.
