export const disclaimer = "أداة مدعومة بالذكاء الاصطناعي، وليست مفتيًا ولا محدّثًا";

export const stations = [
  {
    slug: "prepare", number: "01", name: "استعدّ", title: "ادخل الحوار على بصيرة",
    description: "تدرّب على الأسئلة الشائعة، واستعن بأجوبة موثّقة قبل أن تبدأ حوارك.",
    detail: "ستختار جمهور الحوار وسؤاله، ثم تقارن إجابتك بالنص المرجعي من كتاب بيّنات. تُوسم ملاحظات التدريب المولّدة بوضوح.",
    icon: "messages", accent: "olive", deliverable: "تدريب على الحوار",
  },
  {
    slug: "draft", number: "02", name: "أعِدّ", title: "اطمئنّ إلى ما تنقل",
    description: "راجع الآيات والأحاديث في نصّك، وارجع إلى المصدر قبل أن تنشر.",
    detail: "ستتمكن من لصق نص أو رفع ملف، ومشاهدة مطابقته بالمصادر مع نص الحديث وحكم المحدّث بلفظه ورابطه. ما لا نجده في المصادر نصرّح بعدم العثور عليه.",
    icon: "shield", accent: "green", deliverable: "تقرير التحقّق",
  },
  {
    slug: "produce", number: "03", name: "أنتِج", title: "قرّب المعنى إلى جمهورك",
    description: "حوّل المحتوى المتحقّق منه إلى بطاقة واضحة، بلغة تناسب من تخاطبه.",
    detail: "ستختار نصًا من المصادر وجمهورًا تحدده بنفسك. يبقى النص الشرعي من المصدر، ويظهر الوصف المولّد منفصلًا عنه مع مراعاة القاموس المعتمد.",
    icon: "pen", accent: "sand", deliverable: "بطاقة دعوية",
  },
  {
    slug: "publish", number: "04", name: "انشر", title: "ليصل المحتوى ومعه سنده",
    description: "صدّر بطاقتك وشاركها، مع بقاء المصدر ظاهرًا لمن يقرؤها.",
    detail: "ستتمكن من تنزيل بطاقة PNG ونسخ وصفها ومشاركتها. تبقى البطاقات المحفوظة على جهازك، ويظهر إسناد المصدر في التصدير.",
    icon: "send", accent: "blue", deliverable: "مشاركة موثّقة",
  },
  {
    slug: "practice", number: "05", name: "مارِس", title: "مرجعك في الميدان",
    description: "ابحث عن السؤال الذي تواجهه، واعرض جواب بيّنات بنصّه ومرجعه.",
    detail: "ستسترجع أقرب سؤال وجواب من كتاب بيّنات، مع رقم الصفحة والنصوص المرتبطة به. هذه المحطة تسترجع النصوص المرجعية دون توليد إجابات دينية.",
    icon: "compass", accent: "rose", deliverable: "جواب من المصدر",
  },
] as const;

export type Station = (typeof stations)[number];
export const supportedLanguages = ["ar", "en", "bn", "ur"] as const;

export function getStation(slug: string) {
  return stations.find((station) => station.slug === slug);
}
