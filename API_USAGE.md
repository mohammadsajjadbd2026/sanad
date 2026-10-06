# واجهات API في سَنَد — دليل التسليم

## 1. Google Gemini API

يستخدم الخادم حزمة @google/genai. لا يصل المفتاح إلى المتصفح. النموذج المحدد في إعدادات نسخة التسليم هو gemini-3.1-flash-lite، ويمكن ضبط اسمه بمتغير البيئة؛ هذه تسمية إعداد وليست وعدًا بتوفره مستقبلًا.

المهام: تقييم وضوح ولطف الإجابة التدريبية بمخرجات منظمة، ترشيح معرّفات أسئلة بيّنات الموجودة، واختيار قالب وصف محايد بالعربية أو الإنجليزية. لا يولّد أحكام حديث أو نصوصًا دينية؛ المدقّق والبطاقات المرجعية والبحث في المكتبة لا يحتاجون Gemini.

### إعداد مالك المشروع

ضع القيم محليًا في .env.local، وعلى Vercel في متغيرات بيئة Production، ثم أعد النشر عند تغييرها:

```dotenv
GEMINI_API_KEY=ضع_مفتاحك_هنا_ولا_تنشره
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_FREE_TIER_CONFIRMED=true
GEMINI_RUNTIME_ENABLED=true
```

لا تضبط تأكيد المجانية على true إلا إذا تحققت بنفسك أن مشروع المفتاح Free tier دون حساب فوترة مرتبط. هذا المتغير إقرار من المالك، وليس استعلامًا عن فوترة Google ولا سقف إنفاق. لا تعتمد على اشتراك تطبيق Gemini Pro لتغطية API. الحصص متغيرة؛ عند نفادها يتوقف الطلب الاختياري دون التبديل التلقائي إلى مشروع أو نموذج مدفوع. لتعطيل Gemini اجعل GEMINI_RUNTIME_ENABLED=false.

قد تستخدم Google بيانات الخدمات المجانية لتحسين منتجاتها؛ لذلك توجد موافقة وتنبيه بعدم إدخال المعلومات الشخصية. راجع سياسة Google الحالية قبل إرسال أي بيانات حساسة:
https://ai.google.dev/gemini-api/docs/billing

### استعمال الزائر

- «استعدّ»: يختار السؤال، ويكتب إجابته، ويختار التقييم بمساعدة Gemini.
- «مارِس»: يفعّل الموافقة الاختيارية لترشيح سؤال موجود، ثم يختاره لعرض الجواب الحرفي.
- «أنتِج»: يختار المصدر والجمهور، ويطلب الوصف الاختياري المتاح.
- لا يحتاج الزائر إدخال مفتاحه؛ الحصة مشتركة من إعداد مالك الموقع، ولا يُضمن توفرها لكل طلب.

## 2. خزانة المعارف — MCP

الاتصال على الخادم بـ https://mcp.khizanat-almaarif.com/mcp عبر Streamable HTTP. لا مفتاح مطلوب في الاختبار الحالي. ينفذ الموصل تهيئة MCP وإشعار initialized ثم يستدعي أداتَي search_text وread_pages فقط. لا يستدعي أدوات الكتابة أو إرسال البلاغات.

في «المكتبة»: وافق على البحث الخارجي، وأدخل عبارة عربية، ثم افتح سياق النتيجة. تُرسل عبارة البحث للخزانة، وتُعرض المقتطفات والعزو دون حكم اعتماد آلي. للتعطيل: KHIZANA_ENABLED=false. راجع https://khizanat-almaarif.com/ للحصص وسياسة التوسع؛ المجانية لا تضمن استخدامًا غير محدود لمنصة عامة.

## 3. IslamHouse API v3

التوثيق: https://api.islamhouse.com/

المسار المستخدم:

```text
https://api3.islamhouse.com/v3/{key}/main/{type}/{interfaceLanguage}/{sourceLanguage}/{page}/50/json
```

يستخدم الموصل المفتاح العام المنشور في أمثلة التوثيق، ولا يلزم الزائر إدخال مفتاح. يمكن للمالك توفير ISLAMHOUSE_API_KEY خاص به على الخادم إن حصل عليه، أو تعطيل المصدر بـ ISLAMHOUSE_ENABLED=false.

في المكتبة: فعّل المصادر الخارجية، اختر لغة ونوع المادة. امسح العبارة لتصفح صفحة المواد، أو اكتب عبارة لتصفية عناوينها وأوصافها. زر «الصفحة التالية» يجلب صفحة أخرى. اللغة والنوع ورقم الصفحة تُرسل للمزود؛ التصفية النصية تتم داخل سَنَد. لا يدّعي هذا المسار البحث داخل نصوص جميع الكتب. تُحفظ نسبة العنوان والوصف وأسماء المعدّين إلى المصدر، ويُفتح الأصل عبر رابطه.

سياسة الدمج: https://github.com/IslamHouse-API/multilingual-quran-hadith-islamic-content-database-api-hub

## 4. واجهات سَنَد الداخلية

هذه واجهات التطبيق نفسه، وليست خدمة API عامة ذات اتفاقية توافر. جميع المسارات التالية POST بنوع application/json. طلبات المتصفح يجب أن تأتي من أصل الموقع نفسه؛ لا تدعم مشاركة Origin عشوائيًا. لا تُرسل GEMINI_API_KEY ضمن جسم أي طلب.

| المسار | الجسم الأساسي | الملاحظة |
| --- | --- | --- |
| /api/verify | text | من 1 إلى 12000 حرف؛ التحقق محلي |
| /api/catalog | query | من 2 إلى 120 حرفًا؛ مصادر صالحة للبطاقات |
| /api/export | kind, ref, language | يعيد بيانات البطاقة JSON، وليس ملف PNG؛ الصورة تُرسم في المتصفح |
| /api/localize | kind, ref, language, audienceId, allowGemini:true | وصف اختياري بالعربية أو الإنجليزية |
| /api/dialogue | questionId, answer, allowGemini | answer حتى 3000 حرف؛ audienceId وtone اختياريان |
| /api/practice | question, allowGemini, selectedId اختياري | السؤال من 3 إلى 500 حرف؛ الجواب مرجعي |
| /api/library | query, external, language, type, page | query حتى 200 حرف؛ external افتراضيًا false |
| /api/library/page | bookId, pageId, external:true | يقرأ صفحة واحدة من الخزانة |

### مثال بحث محلي من PowerShell — لا يحتاج مفتاحًا

```powershell
$sanadBody = @{ query = "الرحمة"; external = $false } | ConvertTo-Json
Invoke-RestMethod -Uri "https://sanad-lovat-gamma.vercel.app/api/library" `
  -Method Post -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($sanadBody))
```

### مثال طلب بحث خارجي

تشغيل المثال يرسل عبارة البحث العامة إلى الخزانة، ومعايير الفهرس إلى IslamHouse؛ لا تضع بيانات شخصية.

```powershell
$sanadBody = @{
  query = "آداب الدعوة"
  external = $true
  language = "ar"
  type = "books"
  page = 1
} | ConvertTo-Json
Invoke-RestMethod -Uri "https://sanad-lovat-gamma.vercel.app/api/library" `
  -Method Post -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($sanadBody))
```

الاستجابة groups؛ لكل مصدر items وnote وقد يوجد error أو nextPage. قد تنجح الاستجابة HTTP مع تعطل أحد المزودين؛ افحص error لكل مجموعة. عدم وجود نتائج لا يثبت غياب النص. لا تستخدم الحلقات لمسح المكتبات أو تجاوز حصصها.

الحماية الحالية: تحقق Zod، حدود أحجام، مهلة للمزود الخارجي، وحد 20 طلبًا/دقيقة لكل زائر في نسخة الخادم الواحدة. ليس حدًا موزعًا؛ التوسع العام يحتاج بوابة حصص مناسبة. لا تحفظ شيفرة التطبيق النصوص على الخادم، لكن خدمات الاستضافة والمزودين لها سياساتها المستقلة.
