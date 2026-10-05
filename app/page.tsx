import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, BookOpen, Check, CircleCheck, Languages, LockKeyhole, Quote, ShieldCheck } from "lucide-react";
import { StationIcon } from "@/components/icons";
import { stations } from "@/lib/journey";

export default function Home() {
  return (
    <div className="container">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow"><span className="small-line" /> رفيق المعرّف بالإسلام</span>
          <h1 id="hero-title">لكلّ كلمة أثر.<br />ولكلّ نقلٍ <span className="hero-emphasis">سَنَد.</span></h1>
          <p className="hero-description">من أول سؤال إلى آخر مشاركة.<br />رحلة تجمع الاستعداد، والتحقّق، وصناعة المحتوى،<br className="desktop-break" /> لتصل رسالتك واضحةً، ويظلّ مصدرها حاضرًا.</p>
          <div className="hero-actions"><Link href="/draft" className="button button-primary">افتح المدقّق <ArrowLeft size={18} aria-hidden="true" /></Link><a href="#journey" className="button button-text">اكتشف الرحلة <ArrowLeft size={17} aria-hidden="true" /></a></div>
          <div className="hero-note"><ShieldCheck size={17} aria-hidden="true" /><span>النموذج يقترح، والمصدر وحده يحكم.</span></div>
        </div>
        <div className="hero-art" aria-label="رسم يوضح انتقال النص إلى المصدر ثم إلى تقرير التحقق">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="floating-label"><span className="dot" /> المصدر في قلب الرحلة</div>
          <div className="source-document">
            <div className="document-header"><span className="document-symbol"><BookOpen size={24} aria-hidden="true" /></span><span>وراء كلّ نصّ<span>مصدر يمكنك الرجوع إليه</span></span><span className="document-dots">···</span></div>
            <div className="document-quote"><Quote size={20} aria-hidden="true" /><p>تبدأ الثقة حين تعرف<br />من أين جاء الكلام.</p><span>مبدأ سَنَد</span></div>
            <div className="document-steps"><span><Check size={13} aria-hidden="true" /> نصّ المصدر</span><span><Check size={13} aria-hidden="true" /> المرجع</span><span><Check size={13} aria-hidden="true" /> سياق الحكم</span></div>
            <div className="source-footer"><ShieldCheck size={18} aria-hidden="true" /><span>التحقّق يسبق المشاركة</span><ArrowUpLeft size={18} aria-hidden="true" /></div>
          </div>
          <div className="floating-note"><span><CircleCheck size={24} aria-hidden="true" /></span><div>وضوح في النتيجة<small>حتى حين لا نجد النصّ</small></div></div>
          <span className="art-caption">تصوّر للمنهج · ليس نتيجة تحقّق فعلية</span>
        </div>
      </section>

      <section className="principles-strip" aria-label="مبادئ المنصة">
        <div><BookOpen size={21} aria-hidden="true" /><span><strong>المصدر أولًا</strong><small>النصّ والحكم بلفظهما</small></span></div>
        <div><Languages size={22} aria-hidden="true" /><span><strong>أربع لغات</strong><small>العربية · English · বাংলা · اردو</small></span></div>
        <div><LockKeyhole size={20} aria-hidden="true" /><span><strong>خصوصيتك محفوظة</strong><small>بلا حسابات أو حفظ للنصوص على الخادم</small></span></div>
      </section>

      <section id="journey" className="journey-section" aria-labelledby="journey-title">
        <div className="section-heading"><div><span className="eyebrow">رحلتك مع سَنَد</span><h2 id="journey-title">خمس محطات. وغاية واحدة.</h2></div><p>اختر ما تحتاجه الآن، وأكمل رحلتك على مهل.</p></div>
        <div className="station-grid">{stations.map(station => (
          <Link key={station.slug} href={`/${station.slug}`} className={`station-card accent-${station.accent}`}>
            <div className="station-top"><span className="station-icon"><StationIcon name={station.icon} /></span><span className="station-number">{station.number}</span></div>
            <h3>{station.name}</h3><p>{station.description}</p><span className="station-bottom"><span>{station.deliverable}</span><ArrowLeft size={17} aria-hidden="true" /></span>
          </Link>
        ))}</div>
        <p className="stage-note"><span className="dot" /> المطابقة المحلية والبطاقات والميدان متاحة. التقييم المعتمد والتخصيص التوليدي يحتاجان مراجعة البيانات وضبط الخدمة.</p>
      </section>

      <section className="method-banner" aria-labelledby="method-title"><div className="method-icon"><ShieldCheck size={32} strokeWidth={1.4} aria-hidden="true" /></div><div><h2 id="method-title">الثقة تبدأ بمعرفة الحدود.</h2><p>لا نستقلّ بفتوى، ولا نحكم على حديث من عندنا. ننقل من المصادر، ونصرّح بما لم نعثر عليه.</p></div><Link href="/about">كيف يعمل سَنَد؟ <ArrowLeft size={17} aria-hidden="true" /></Link></section>
    </div>
  );
}
