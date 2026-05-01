import { consultation, courses } from '../data/content.js'
import { isGulfCountry } from '../data/assessment.js'

export function getPriority(score) {
  if (score < 40) return { label: 'حرج', tone: { background: '#fee2e2', color: '#b91c1c', border: '#fecaca' } }
  if (score < 70) return { label: 'متوسط', tone: { background: '#fef3c7', color: '#b45309', border: '#fde68a' } }
  return { label: 'جيد', tone: { background: '#dcfce7', color: '#15803d', border: '#bbf7d0' } }
}

export function buildDiagnosis(scores) {
  const labels = { marketing: 'التسويق', operations: 'التشغيل', finance: 'المال', team: 'الفريق', patient: 'تجربة المريض' }
  const explanations = {
    marketing: 'عدم وجود نظام واضح لجذب المرضى أو قياس العائد يجعل النمو غير مستقر.',
    operations: 'المشكلة التشغيلية تؤثر مباشرة على المواعيد والكفاءة واستغلال الطاقة الحالية.',
    finance: 'الضعف المالي ينعكس على الربحية والاستقرار والتوسع المستقبلي.',
    team: 'بدون فريق واضح وقيادة فعالة، يصعب الحفاظ على مستوى أداء ثابت داخل العيادة.',
    patient: 'تجربة المريض الضعيفة تقلل الولاء وتؤثر على العودة والإحالات بشكل مباشر.',
  }
  const ordered = Object.entries(scores).filter(([key]) => key !== 'overall').sort((a, b) => a[1] - b[1])
  const weakestKey = ordered[0][0]
  return { weakestKey, weakestLabel: labels[weakestKey], explanation: explanations[weakestKey], ordered }
}

function getScoreBand(score) {
  if (score < 40) return 'critical'
  if (score < 60) return 'weak'
  if (score < 80) return 'developing'
  return 'strong'
}

export function recommendCourses(diagnosisKey, scores) {
  const band = getScoreBand(scores[diagnosisKey])
  const map = {
    marketing: { critical: [2, 1, 7], weak: [2, 7], developing: [2, 3], strong: [7] },
    operations: { critical: [4, 7], weak: [4, 5], developing: [4, 7], strong: [7] },
    finance: { critical: [6, 7], weak: [6, 1], developing: [6, 7], strong: [7] },
    team: { critical: [5, 7], weak: [5, 1], developing: [5, 7], strong: [7] },
    patient: { critical: [3, 4, 7], weak: [3, 7], developing: [3, 2], strong: [7] },
  }
  const ids = map[diagnosisKey]?.[band] || [7]
  return courses.filter((course) => ids.includes(course.id))
}

export function getImpactMessage(key) {
  const map = {
    marketing: 'العيادة قد تخسر نسبة كبيرة من المرضى المحتملين بسبب غياب نظام جذب وتحويل واضح.',
    operations: 'ضعف التشغيل يؤدي إلى إهدار في المواعيد والطاقة الحالية ويؤثر مباشرة على الإيراد.',
    finance: 'القرارات المالية غير الواضحة قد تخفي ضعف الربحية الحقيقي حتى مع وجود حركة داخل العيادة.',
    team: 'ضعف الفريق أو القيادة يستهلك وقت الإدارة ويؤثر على ثبات الأداء اليومي.',
    patient: 'تجربة المريض الضعيفة تقلل العودة والإحالات وتؤثر على قبول الحالات الجديدة.',
  }
  return map[key] || 'هذه النقطة تحتاج إلى تدخل واضح حتى لا تعطل نمو العيادة.'
}

export function getUrgencyMessage(key) {
  const map = {
    marketing: 'إذا لم يتم تحسين هذا الجانب قريبًا، سيظل تدفق المرضى غير مستقر حتى مع زيادة الإنفاق.',
    operations: 'أي تأخير في تحسين هذا الجانب سيبقي العشوائية التشغيلية ويمنع العيادة من الاستفادة الكاملة من مواردها.',
    finance: 'التأخير في ضبط هذا الجانب قد يؤدي إلى استمرار تسعير غير دقيق أو ضعف في السيطرة على الربحية.',
    team: 'ترك هذا الجانب دون تطوير يزيد الضغط على الإدارة ويؤخر بناء فريق يمكن الاعتماد عليه.',
    patient: 'كل فترة تمر دون تحسين هذا الجانب تعني فرصًا ضائعة في الاحتفاظ بالمرضى ورفع القبول.',
  }
  return map[key] || 'هذا الجانب يحتاج إلى تحرك قريب حتى لا يتحول إلى عائق أكبر.'
}

export function getReportDate() {
  return new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function getFreeActionPlan(key) {
  const map = {
    marketing: [
      'حدد عرضًا واضحًا للعيادة ورسالة مختصرة تشرح لماذا يختارك المريض.',
      'اختر قناتين فقط للتسويق خلال الشهر القادم وابدأ بقياس النتائج أسبوعيًا.',
      'اطلب من كل مريض راضٍ تقييمًا أو إحالة بشكل منظم.',
    ],
    operations: [
      'أنشئ قائمة متابعة يومية للحجوزات والتأكيد قبل الموعد بيوم.',
      'حدد 3 إجراءات تشغيلية أساسية واكتبها بشكل مبسط للفريق.',
      'راجع حالات عدم الحضور أسبوعيًا لمعرفة السبب الأكثر تكرارًا.',
    ],
    finance: [
      'راجع أسعار أكثر 5 خدمات تقدمها وقارنها بتكلفتها الفعلية.',
      'تابع المصروفات الثابتة والمتغيرة أسبوعيًا بدل الاكتفاء بالمراجعة الشهرية.',
      'ابدأ بقياس الإيراد لكل كرسي أو لكل يوم عمل لمعرفة الأداء الحقيقي.',
    ],
    team: [
      'حدد مسؤولية واضحة لكل فرد في الفريق حتى لا تتداخل المهام.',
      'اعقد اجتماعًا قصيرًا أسبوعيًا لمراجعة الأولويات والمشكلات.',
      'ابدأ بتقديم feedback بسيط ومنتظم بدل الانتظار حتى تتراكم الأخطاء.',
    ],
    patient: [
      'اطلب feedback سريعًا من المرضى بعد الزيارة بشكل ثابت.',
      'جهز طريقة أوضح لشرح الخطة العلاجية والتكلفة والخطوات التالية.',
      'أنشئ قائمة متابعة للمرضى غير العائدين أو للحالات غير المكتملة.',
    ],
  }

  return map[key] || [
    'ابدأ بتحديد المشكلة الأهم داخل العيادة وركز عليها لمدة 30 يومًا.',
    'ضع قياسًا بسيطًا لمتابعة التحسن أسبوعيًا.',
    'اختر خطوة تنفيذية واحدة فقط وابدأ بها فورًا.',
  ]
}

export function matchBestOffer(scores) {
  const entries = Object.entries(scores).filter(([key]) => key !== 'overall').sort((a, b) => a[1] - b[1])
  const weakestKey = entries[0][0]
  if (weakestKey === 'marketing') return courses.find((course) => course.id === 2)
  if (weakestKey === 'operations') return courses.find((course) => course.id === 4)
  if (weakestKey === 'finance') return courses.find((course) => course.id === 6)
  if (weakestKey === 'team') return courses.find((course) => course.id === 5)
  if (weakestKey === 'patient') return courses.find((course) => course.id === 3)
  return courses.find((course) => course.id === 7)
}

export function getPrimaryCourse(diagnosisKey, scores) {
  return recommendCourses(diagnosisKey, scores)[0] || matchBestOffer(scores)
}

export function getBundleOffer() {
  return courses.find((course) => course.id === 7)
}

export function getRecommendedSolutionSet(diagnosis, scores) {
  const course = getPrimaryCourse(diagnosis.weakestKey, scores)
  const bundle = getBundleOffer()
  const overall = scores.overall

  const courseBenefitMap = {
    marketing: 'سيساعدك على بناء قناة جذب أوضح ورفع جودة الاستفسارات وتحويلها إلى حجوزات فعلية بشكل أسرع.',
    operations: 'سيساعدك على تقليل الهدر في المواعيد وبناء نظام تشغيلي يومي أكثر ثباتًا وسهولة في المتابعة.',
    finance: 'سيساعدك على تحسين التسعير والربحية وفهم الأرقام التي تؤثر مباشرة على القرار المالي داخل العيادة.',
    team: 'سيساعدك على تنظيم الفريق وتوضيح المسؤوليات وتقليل الضغط اليومي على الإدارة أو المالك.',
    patient: 'سيساعدك على رفع قبول الحالات وتحسين تجربة المريض بما يزيد العودة والإحالات.',
  }

  const bundleBenefit = overall < 45
    ? 'أنسب عندما تكون التحديات متداخلة في أكثر من محور وتحتاج لمسار شامل بدل علاج نقطة واحدة فقط.'
    : 'أنسب إذا كنت تريد تسريع التطوير في أكثر من محور معًا بدل الاكتفاء بحل جزئي محدود.'

  const consultationBenefit = overall >= 65
    ? 'أنسب إذا كنت قريبًا من مستوى جيد وتحتاج قرارًا سريعًا وخطة تنفيذ مخصصة بدل الدخول في برنامج طويل.'
    : 'أنسب إذا كنت تريد تشخيصًا مباشرًا وترتيب أولويات التنفيذ داخل عيادتك وفق ظروفها الفعلية.'

  return {
    course: {
      ...course,
      label: 'الكورس الأكثر ترشيحًا لك الآن',
      benefit: courseBenefitMap[diagnosis.weakestKey] || 'سيساعدك على معالجة الفجوة الأوضح في التقرير بخطوات عملية قابلة للتنفيذ.',
    },
    bundle: {
      ...bundle,
      label: 'البرنامج الكامل (Bundle)',
      benefit: bundleBenefit,
    },
    consultation: {
      ...consultation,
      label: 'الاستشارة المباشرة',
      benefit: consultationBenefit,
    },
  }
}

export function buildClinicContext(answers) {
  const notes = []

  if (isGulfCountry(answers.country)) {
    notes.push('العيادة تعمل داخل سوق خليجي، لذلك التسعير، التأمين، والتقسيط تؤثر مباشرة على التحويل والربحية.')
  }

  if (answers.clinic_years === 'أكثر من 7 سنوات' && answers.monthly_revenue === 'أقل من المتوقع بوضوح') {
    notes.push('عمر العيادة كبير نسبيًا لكن الإيراد أقل من المتوقع، وهذا يشير عادةً إلى مشكلة أعمق من مجرد مرحلة تأسيس.')
  } else if (answers.clinic_years === 'أقل من سنة' && answers.monthly_revenue === 'أقل من المتوقع بوضوح') {
    notes.push('العيادة ما زالت في مرحلة تأسيس، لذلك ضعف الإيراد الحالي ليس إشارة سلبية بنفس قوة العيادات الأقدم.')
  }

  if (answers.chairs === '7+' && ['لا يوجد فريق واضح', '1–5 أفراد', '1–3 أفراد', '1–2 فرد'].includes(answers.team_size)) {
    notes.push('هناك اتساع تشغيلي واضح مقارنة بحجم الفريق الحالي، ما يخلق ضغطًا يوميًا ويخفض جودة المتابعة.')
  }

  if (answers.installments === 'لا') {
    notes.push('غياب حلول الدفع المرن قد يقلل قبول الحالات المتوسطة والكبيرة.')
  }

  if (answers.insurance_model === 'نعم بشكل أساسي' && answers.gulf_pricing_mix !== 'نعم وواضح') {
    notes.push('الاعتماد على التأمين دون تسعير واضح بين القنوات قد يضعف الهوامش ويشوّش القرار المالي.')
  }

  return notes
}

export function getExecutionPlan(key) {
  const plans = {
    marketing: [
      'خلال 30 يومًا: حدد عرض القيمة، نوع المرضى المستهدفين، وأهم قناتين جذب فقط.',
      'خلال 60 يومًا: فعّل تتبع المصدر، كلفة المريض المحتمل، ونسبة التحويل من الاستفسار إلى حجز.',
      'خلال 90 يومًا: اضبط الرسائل التسويقية والميزانية بناءً على النتائج الفعلية وليس الانطباع.',
    ],
    operations: [
      'خلال 30 يومًا: راجع مسار المريض من الاتصال حتى إتمام الزيارة وحدد نقاط التعطل.',
      'خلال 60 يومًا: طبّق نظام تأكيد ومتابعة وعدم حضور مع SOPs واضحة للفريق.',
      'خلال 90 يومًا: اربط كل كرسي أو غرفة بمؤشرات أداء أسبوعية ومسؤول مباشر.',
    ],
    finance: [
      'خلال 30 يومًا: اجمع صورة واضحة للإيراد، الخصومات، التسعير، والمصروفات الأساسية.',
      'خلال 60 يومًا: أعد هيكلة التسعير، سياسات الدفع، وخيارات التقسيط أو التأمين عند الحاجة.',
      'خلال 90 يومًا: ابدأ مراجعة شهرية للربحية حسب الخدمة والطبيب والقناة البيعية.',
    ],
    team: [
      'خلال 30 يومًا: وضّح الهيكل، الأدوار، والمسؤوليات اليومية لكل فرد في الفريق.',
      'خلال 60 يومًا: أنشئ طبقة متابعة أو إشراف إن كان حجم التشغيل أكبر من تحكم المالك وحده.',
      'خلال 90 يومًا: اربط تقييم الأداء بمؤشرات واضحة واجتماعات مراجعة ثابتة.',
    ],
    patient: [
      'خلال 30 يومًا: حسّن تجربة ما قبل الزيارة وما بعدها ونقاط المتابعة الأساسية.',
      'خلال 60 يومًا: طبّق نظام feedback واسترجاع للحالات غير المكتملة والمرضى غير العائدين.',
      'خلال 90 يومًا: ابنِ رحلة ولاء وإحالات تجعل تجربة المريض مصدر نمو مستمر.',
    ],
  }

  return plans[key] || []
}

export function getSupportRecommendation(scores) {
  if (scores.overall < 45) {
    return {
      title: 'الدعم الأنسب الآن: البرنامج الكامل',
      body: 'لأن التحديات متداخلة في أكثر من محور، فالباندل الكامل هو المسار الأنسب لبناء نظام متكامل بدل علاج نقطة واحدة فقط.',
    }
  }

  if (scores.overall < 65) {
    return {
      title: 'الدعم الأنسب الآن: كورس متخصص + متابعة تنفيذ',
      body: 'الأنسب هو البدء بالكورس المتعلق بأضعف محور، ثم استخدام الاستشارة لتسريع التطبيق داخل عيادتك حسب ظروفها الفعلية.',
    }
  }

  return {
    title: 'الدعم الأنسب الآن: استشارة مركزة أو كورس محدد',
    body: 'العيادة ليست بعيدة عن الأداء الجيد، لذلك قد تكفي استشارة عملية مركزة أو كورس محدد لسد الفجوة الحالية بسرعة.',
  }
}

export { consultation }
