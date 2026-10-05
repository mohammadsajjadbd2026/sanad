import type { Metadata } from "next";
import { BookOpen, Fingerprint, Scale, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "المنهج والمصادر" };

export default function AboutPage() {
  return (
    <div className="container about-page">
      <span className="eyebrow">عن سَنَد</span><h1>المعرفة أمانة.<br /><span>ومصدرها جزء منها.</span></h1><p className="page-lead">سَنَد منصة قيد التطوير لمساندة المعرّفين بالإسلام، من الاستعداد للحوار إلى مراجعة المحتوى ومشاركته. القاعدة التي تجمع محطاتها: النموذج يقترح، والمصدر وحده يحكم.</p>
      <div className="about-grid">
        <section className="about-panel"><ShieldCheck aria-hidden="true" /><h2>كيف نتحقّق؟</h2><p>تُطابق النصوص مع المصادر المحلية. يُنقل حكم المحدّث بلفظه، وتُحسب حالة النتيجة برمجيًا وفق القواعد وخريطة الأحكام، دون أن يختارها نموذج لغوي.</p><p>عند اختلاف تصنيفات الأحكام نعرضها جميعًا دون ترجيح آلي. عدم العثور على نص لا يعني أنه موضوع.</p></section>
        <section className="about-panel"><Scale aria-hidden="true" /><h2>ما حدود المنصة؟</h2><p>ليست المنصة مفتيًا ولا محدّثًا. الأسئلة التي تتطلب فتوى شخصية تُحال إلى مختص. يظل التحقّق محدودًا بالمصادر المدرجة وجودة المطابقة.</p><p>هذه النسخة تعرض واجهة الرحلة فقط. لم يُفعّل المدقّق، ولم تُنشر نتائج دقة. اعتماد حالات الاختبار من المراجع شرط لإجراء القياس.</p></section>
        <section className="about-panel"><BookOpen aria-hidden="true" /><h2>المصادر</h2><ul className="source-list"><li>القرآن الكريم: <a href="https://quranenc.com" target="_blank" rel="noreferrer">موسوعة القرآن الكريم</a> و<a href="https://tanzil.net" target="_blank" rel="noreferrer">موقع تنزيل</a>، وفق بيانات الإسناد المحلية.</li><li>الأحاديث: الفهرس المحلي وروابطه إلى <a href="https://dorar.net/hadith" target="_blank" rel="noreferrer">الدرر السنية</a>، مع أحكام المحدّثين المنقولة.</li><li>الحوار والميدان: كتاب «بيّنات: أسئلة وأجوبة عن الإسلام». يلزم توثيق إذن الاستخدام قبل نشر نصوصه.</li><li>المصطلحات وملفات الجمهور: ملفات المشروع المراجعة، مع مراعاة حالة اعتماد كل مادة.</li></ul></section>
        <section className="about-panel"><Fingerprint aria-hidden="true" /><h2>الخصوصية والشفافية</h2><p>لا تحتاج إلى حساب. لا تُحفظ نصوص المستخدم على خادم التطبيق. عند تفعيل الذكاء الاصطناعي، سيُرسل النص اللازم للمعالجة إلى مزوّد الخدمة مع إيضاح ذلك قبل الإرسال.</p><p>يختار المستخدم الجمهور بنفسه. تُوسم الصياغات والتعليقات التي يولّدها الذكاء الاصطناعي بكلمة «مولّد». البطاقات المحفوظة ستكون على الجهاز فقط.</p></section>
      </div>
      <section className="translation-note"><h2>ترجمة المعاني</h2><p>ترجمات القرآن تُعرض بوصفها ترجمة للمعاني، مع اسم المترجم: Saheeh International للإنجليزية، ود. أبو بكر محمد زكريا للبنغالية، ومحمد جوناكري للأردية. تُحفظ تفاصيل الإسناد والترخيص في ملف مصادر القرآن بالمشروع.</p></section>
    </div>
  );
}
