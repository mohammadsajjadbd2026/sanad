import type { Metadata } from "next";
import { BookOpen, Fingerprint, Scale, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "المنهج والمصادر" };

export default function AboutPage() {
  return (
    <div className="container about-page">
      <span className="eyebrow">عن سَنَد</span><h1>المعرفة أمانة.<br /><span>ومصدرها جزء منها.</span></h1><p className="page-lead">سَنَد منصة لمساندة المعرّفين بالإسلام، من الاستعداد للحوار إلى مراجعة المحتوى ومشاركته. القاعدة التي تجمع محطاتها: النموذج يقترح، والمصدر وحده يحكم.</p>
      <div className="about-grid">
        <section className="about-panel"><ShieldCheck aria-hidden="true" /><h2>كيف نتحقّق؟</h2><p>تُطابق النصوص مع المصادر المحلية. يُنقل حكم المحدّث بلفظه، وتُحسب حالة النتيجة برمجيًا وفق القواعد وخريطة الأحكام، دون أن يختارها نموذج لغوي.</p><p>عند اختلاف تصنيفات الأحكام نعرضها جميعًا دون ترجيح آلي. عدم العثور على نص لا يعني أنه موضوع.</p></section>
        <section className="about-panel"><Scale aria-hidden="true" /><h2>ما حدود المنصة؟</h2><p>ليست المنصة مفتيًا ولا محدّثًا. الأسئلة التي تتطلب فتوى شخصية تُحال إلى مختص. يظل التحقّق محدودًا بالمصادر المدرجة وجودة المطابقة.</p><p>المدقّق يعمل بالمطابقة المحافظة؛ النص القريب قد يُرفض. حالات القياس غير معتمدة بشريًا، لذا لم تُنشر نسبة دقة. البحث الدلالي والتخصيص التوليدي ليسا جزءًا من المسارات الحية الحالية.</p></section>
        <section className="about-panel"><BookOpen aria-hidden="true" /><h2>المصادر</h2><ul className="source-list"><li>القرآن الكريم: <a href="https://quranenc.com" target="_blank" rel="noreferrer">موسوعة القرآن الكريم</a> و<a href="https://tanzil.net" target="_blank" rel="noreferrer">موقع تنزيل</a>، وفق بيانات الإسناد المحلية.</li><li>الأحاديث: الفهرس المحلي وروابطه إلى <a href="https://dorar.net/hadith" target="_blank" rel="noreferrer">الدرر السنية</a>، مع أحكام المحدّثين المنقولة.</li><li>الحوار والميدان: كتاب «بيّنات: أسئلة وأجوبة عن الإسلام». أكد صاحب المشروع امتلاكه إذن نشر نصوصه؛ يلزم إرفاق وثيقة الإذن عند التقديم إذا طلبتها الجهة.</li><li>المصطلحات وملفات الجمهور: ملفات المشروع المراجعة، مع مراعاة حالة اعتماد كل مادة.</li></ul></section>
        <section className="about-panel"><Fingerprint aria-hidden="true" /><h2>الخصوصية والشفافية</h2><p>لا تحتاج إلى حساب. لا تُحفظ نصوص المستخدم على خادم التطبيق في المسارات الحالية؛ يرسل نص التحقّق إلى خادم سَنَد للمعالجة المحلية دون تمريره إلى Google. ملفات DOCX تُقرأ في المتصفح.</p><p>يختار المستخدم الجمهور بنفسه. البطاقات المحفوظة تبقى على الجهاز فقط. البحث الدلالي والتخصيص الآلي مؤجلان حتى توفير فهرس كامل وحد إنفاق تشغيلي موثوق.</p></section>
      </div>
      <section className="translation-note"><h2>ترجمة المعاني</h2><p>ترجمات القرآن تُعرض بوصفها ترجمة للمعاني، مع اسم المترجم: Saheeh International للإنجليزية، ود. أبو بكر محمد زكريا للبنغالية، ومحمد جوناكري للأردية. تُحفظ تفاصيل الإسناد والترخيص في ملف مصادر القرآن بالمشروع.</p></section>
    </div>
  );
}
