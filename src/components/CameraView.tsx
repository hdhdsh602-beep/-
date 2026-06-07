import { useRef, useEffect, useState, useCallback } from 'react';
import { VOCABULARY_MAP, VocabularyMeta } from '../data/vocabulary';
import { saveWord } from '../lib/firebaseService';
import { 
  Volume2, 
  Bookmark, 
  BookmarkCheck, 
  CameraOff, 
  Loader2, 
  HelpCircle, 
  Sparkles, 
  Eye, 
  RotateCcw,
  Zap,
  FileText,
  Scan,
  CheckCircle,
  Languages,
  AlertCircle,
  WifiOff,
  Database,
  Search,
  Award,
  DownloadCloud,
  Wifi,
  Check,
  BookOpen,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface OCRPreset {
  id: string;
  title: string;
  english: string;
  arabic: string;
  category: string;
  phonetics: string;
  exampleEn: string;
  exampleAr: string;
  grammarTip?: string;
  vocabulary?: Array<{
    word: string;
    type: string;
    meaning: string;
    phonetic: string;
    explanation: string;
  }>;
}


const SMART_FRAME_INTERVAL_MS = 180;
const LIVE_OCR_INTERVAL_MS = 2600;
const TEXT_CONFIDENCE_THRESHOLD = 52;
const CENTER_SCAN_RATIO = 0.58;
const CENTER_POINT_HIT_RADIUS_PX = 34;
const CENTER_FOCUS_LOCK_MS = 520;
const FOCUS_PROGRESS_STEP_MS = 52;

const BODYPIX_PART_LABELS: Record<number, 'face' | 'arm' | 'hand' | 'leg' | 'foot'> = {
  0: 'face',
  1: 'face',
  2: 'arm',
  3: 'arm',
  4: 'arm',
  5: 'arm',
  6: 'hand',
  7: 'hand',
  8: 'arm',
  9: 'arm',
  10: 'arm',
  11: 'arm',
  12: 'hand',
  13: 'hand',
  14: 'leg',
  15: 'leg',
  16: 'leg',
  17: 'leg',
  18: 'foot',
  19: 'foot',
  20: 'leg',
  21: 'leg',
  22: 'leg',
  23: 'leg'
};

const BODY_PART_PRIORITY: Record<string, number> = {
  hand: 5,
  face: 4,
  foot: 3,
  leg: 2,
  arm: 1
};

const loadExternalScriptOnce = (src: string) => new Promise<void>((resolve, reject) => {
  const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === 'true') resolve();
    else {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', reject, { once: true });
    }
    return;
  }
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.onload = () => {
    script.dataset.loaded = 'true';
    resolve();
  };
  script.onerror = reject;
  document.head.appendChild(script);
});

const OCR_PRESETS: OCRPreset[] = [
  {
    id: 'traffic_sign',
    title: 'لافتة مرورية تحذيرية بالشارع',
    english: 'CAUTION: PEDESTRIAN CROSSING NEXT 50 METERS. REDUCE SPEED IMMEDIATELY.',
    arabic: 'تنبيه: ممر مشاة أمامك على بعد 50 متراً. يرجى خفض السرعة فوراً.',
    category: 'لافتات الشارع وهياكلها',
    phonetics: '[kɔːʃn: pɪˈdɛstrɪən ˈkrɒsɪŋ nɛkst ˈfɪfti ˈmiːtəz. rɪˈdjuːs spiːd ɪˈmiːdiətli]',
    exampleEn: 'The warning sign reminds drivers to reduce speed immediately near crosswalks.',
    exampleAr: 'تُذكّر لافتة التحذير السائقين بخفض السرعة فوراً بالقرب من ممرات المشاة.'
  },
  {
    id: 'restaurant_menu',
    title: 'قائمة وجبات مطعم محلي ذكي',
    english: 'DAILY SPECIAL: CHEF COOKED BEEF STEAK SERVED WITH CREAMY MUSHROOM SAUCE AND BAKED POTATOES.',
    arabic: 'الطبق اليومي المميّز: شريحة لحم بقر مطهوة بأسلوب الشيف تُقدم مع صلصة الفطر الكريمة والبطاطس المشوية.',
    category: 'قوائم مأكولات وحياتيات',
    phonetics: '[ˈdeɪli ˈspɛʃəl: ʃɛf kʊkt biːf steɪk sɜːvd wɪð ˈkriːmi ˈmʌʃrʊm sɔːs ænd beɪkt pəˈteɪtəʊz]',
    exampleEn: 'I scanned the daily special from the restaurant menu with my smart glasses.',
    exampleAr: 'قمت بمسح الطبق اليومي المميز من قائمة طعام المطعم عبر نظارتي الذكية.'
  },
  {
    id: 'airport_screen',
    title: 'شاشة المغادرة بالمطار الدولي',
    english: 'ATTENTION ALL PASSENGERS: FLIGHT BA-456 TO NEW YORK JFK HAS BEEN DELAYED BY TWO HOURS DUE TO WEATHER CONDITIONS.',
    arabic: 'تنبيه عاجل لجميع المسافرين: تم تأجيل الرحلة BA-456 المتوجهة إلى مطار نيويورك JFK لمدة ساعتين بسبب الأحوال الجوية.',
    category: 'تنقل وسياحة',
    phonetics: '[əˈtɛnʃn ɔːl ˈpæsɪnʤəz: flaɪt biː-eɪ fɔː fɪv sɪks tuː njuː jɔːk ʤeɪ-ɛf-keɪ hæz biːn dɪˈleɪd baɪ tuː ˈaʊəz]',
    exampleEn: 'The terminal screen broadcast a warning that the flight was delayed by two hours.',
    exampleAr: 'بثت شاشة المطار تنبيهاً يفيد بتأجيل موعد إقلاع الرحلة الجوية لمدّة ساعتين.'
  },
  {
    id: 'safety_guide',
    title: 'ملصق تعليمات جهاز منزلي',
    english: 'DANGER: DISCONNECT POWER SUPPLY BEFORE CLEANING OR SERVICING. DO NOT EXPOSE UNIT TO DIRECT WATER.',
    arabic: 'خطر: افصل مأخذ التيار الكهربائي تماماً قبل التنظيف أو الصيانة. لا تُعرّض الجهاز للماء المباشر.',
    category: 'أجهزة وأدلة أمان',
    phonetics: '[ˈdeɪnʤə: ˌdɪskəˈnɛkt ˈpaʊə səˈplaɪ bɪˈfɔː ˈkliːnɪŋ ɔː ˈsɜːvɪsɪŋ. duː nɒt ɪksˈpəʊz ˈjuːnɪt tuː dɪˈrɛkt ˈwɔːtə]',
    exampleEn: 'Always make sure you follow the danger label instructions on electrical items.',
    exampleAr: 'تأكد دائماً من اتباع إرشادات ملصق الخطر الموجود على الأجهزة الكهربائية.'
  },
  {
    id: 'wise_quote',
    title: 'صفحة كتاب ثقافة وتطوير ذات',
    english: 'WISDOM STARTS WITH CURIOSITY. ALWAYS KEEP ASKING QUESTIONS AND EXCEL AT LEARNING DAILY.',
    arabic: 'تبدأ الحكمة والفطنة بالفضول والشغف. واظب دائماً على طرح الأسئلة والتفوق والتميز اللغوي اليومي.',
    category: 'كتب وتطوير مهارات',
    phonetics: '[ˈwɪzdəm stɑːts wɪð ˌkjuərɪˈɒsɪti. ˈɔːlweɪz kiːp ˈɑːskɪŋ ˈkwɛsʧənz ænd ɪkˈsɛl æt ˈlɜːnɪŋ ˈdeɪli]',
    exampleEn: 'Reading this wise sentence on a book page encouraged me to continue practicing English speech.',
    exampleAr: 'شجعتني قراءة هذه الجملة الحكيمة في صفحة الكتاب على مواصلة ممارسة التحدث بالإنكليزية.'
  }
];

const LOCAL_TRANSLATIONS: Record<string, string> = {
  "hello": "مرحباً / أهلاً بك",
  "world": "العالم",
  "chair": "كرسي مريح",
  "laptop": "لابتوب / حاسوب محمول",
  "cup": "كوب شاي أو قهوة",
  "book": "كتاب تعليمي",
  "apple": "تفاحة طازجة",
  "cat": "قطة أليفة",
  "dog": "كلب حراسة",
  "banana": "موزة مغذية",
  "orange": "برتقال غني بالفيتامين",
  "good morning": "صباح الخير واليمن والبركات",
  "good evening": "مساء الخير والمسرات",
  "thank you": "شكراً جزيلاً لك على دعمك",
  "how are you": "كيف حالك وكيف تجري أمورك؟",
  "i love learning": "أنا شغوف جداً بالتعلم الدائم",
  "smart glasses": "النظارة الذكية المستقبلية",
  "camera view": "شاشة تصوير الكاميرا المباشرة",
  "the key to success": "المفتاح الفعلي للنجاح والتفوق",
  "where is the school": "أين تقع المدرسة التعليمية؟",
  "i want to eat": "أرغب في تناول وجبة طعام شهية",
  "please help me": "الرجاء واللطف بمساعدتي فوراً",
  "welcome to lingolens": "مرحباً بك في تطبيق لينجو لينز الذكي",
  "have a nice day": "أتمنى لك قضاء يوم رائع وسعيد",
  "knowledge is power": "العلم والمعرفة هما القوة الحقيقية",
  "time is money": "النشاط والوقت كالسبيكة الذهبية",
  "never give up": "لا تستسلم لليأس أو الإحباط أبداً"
};

export interface OfflineWord {
  id: string;
  english: string;
  arabic: string;
  phonetics: string;
  category: string;
  exampleEn: string;
  exampleAr: string;
}

export const OFFLINE_WORDS: OfflineWord[] = [
  { id: '1', english: 'Chair', arabic: 'كرسي مريح', phonetics: '[tʃeər]', category: 'أغراض يومية', exampleEn: 'Please sit on the comfortable chair.', exampleAr: 'تفضل بالجلوس على الكرسي المريح.' },
  { id: '2', english: 'Laptop', arabic: 'حاسوب محمول', phonetics: '[ˈlæptɒp]', category: 'أجهزة وتقنيات', exampleEn: 'I use my laptop for software development.', exampleAr: 'أستخدم حاسوبي المحمول لتطوير البرامج.' },
  { id: '3', english: 'Cup', arabic: 'كوب شرب', phonetics: '[kʌp]', category: 'أغراض يومية', exampleEn: 'She filled the cup with hot tea.', exampleAr: 'ملأت الكوب بالشاي الساخن.' },
  { id: '4', english: 'Book', arabic: 'كتاب مفيد', phonetics: '[bʊk]', category: 'تعليم ومطالعة', exampleEn: 'This book contains valuable lessons.', exampleAr: 'يحتوي هذا الكتاب على دروس قيمة.' },
  { id: '5', english: 'Apple', arabic: 'تفاحة طازجة', phonetics: '[ˈæpl]', category: 'مأكولات وأغذية', exampleEn: 'An apple a day keeps the doctor away.', exampleAr: 'تناول تفاحة يومياً يغنيك عن الطبيب.' },
  { id: '6', english: 'Cat', arabic: 'قطة أليفة', phonetics: '[kæt]', category: 'حيوانات وطبيعة', exampleEn: 'The small white cat is sleeping.', exampleAr: 'القطة البيضاء الصغيرة نائمة.' },
  { id: '7', english: 'Dog', arabic: 'كلب حراسة', phonetics: '[dɒɡ]', category: 'حيوانات وطبيعة', exampleEn: 'The loyal dog guards the house.', exampleAr: 'الكلب الوفي يحرس المنزل.' },
  { id: '8', english: 'Banana', arabic: 'موزة مغذية', phonetics: '[bəˈnɑːnə]', category: 'مأكولات وأغذية', exampleEn: 'He ate a yellow banana after working out.', exampleAr: 'أكل موزة صفراء بعد التمرين.' },
  { id: '9', english: 'Orange', arabic: 'برتقالة طازجة', phonetics: '[ˈɒrɪndʒ]', category: 'مأكولات وأغذية', exampleEn: 'Orange is rich in Vitamin C.', exampleAr: 'البرتقال غني بفيتامين سي.' },
  { id: '10', english: 'Phone', arabic: 'هاتف ذكي', phonetics: '[fəʊn]', category: 'أجهزة وتقنيات', exampleEn: 'I received a call on my smart phone.', exampleAr: 'تلقيت مكالمة على هاتفي الذكي.' },
  { id: '11', english: 'Key', arabic: 'مفتاح الغرفة', phonetics: '[kiː]', category: 'أغراض يومية', exampleEn: 'The key is on the wooden table.', exampleAr: 'المفتاح موجود على الطاولة الخشبية.' },
  { id: '12', english: 'Bottle', arabic: 'زجاجة ماء', phonetics: '[ˈbɒtl]', category: 'أغراض يومية', exampleEn: 'Keep a bottle of clean water nearby.', exampleAr: 'احتفظ بزجاجة مياه نظيفة في الجوار.' },
  { id: '13', english: 'Car', arabic: 'سيارة حديثة', phonetics: '[kɑːr]', category: 'السفر والطريق', exampleEn: 'They drove a fast electric car.', exampleAr: 'قادوا سيارة كهربائية سريعة.' },
  { id: '14', english: 'Person', arabic: 'إنسان / شخص', phonetics: '[ˈpɜːsn]', category: 'عام وعائلي', exampleEn: 'Every person has a unique voice.', exampleAr: 'لكل شخص نبرة صوت فريدة.' },
  { id: '15', english: 'Table', arabic: 'طاولة مكتب', phonetics: '[ˈteɪbl]', category: 'أغراض يومية', exampleEn: 'The books are on the study table.', exampleAr: 'الكتب موجودة على طاولة الدراسة.' },
  { id: '16', english: 'Bicycle', arabic: 'دراجة هوائية', phonetics: '[ˈbaɪsɪkl]', category: 'السفر والطريق', exampleEn: 'Riding a bicycle is good exercise.', exampleAr: 'ركوب الدراجة الهوائية تمرين جيد.' },
  { id: '17', english: 'Backpack', arabic: 'حقيبة ظهر', phonetics: '[ˈbækpæk]', category: 'السفر والطريق', exampleEn: 'My backpack is filled with science books.', exampleAr: 'ملأت حقيبتي المدرسية بكتب العلوم.' },
  { id: '18', english: 'Clock', arabic: 'ساعة حائط', phonetics: '[klɒk]', category: 'أغراض يومية', exampleEn: 'The clock is hanging on the wall.', exampleAr: 'الساعة معلقة على الجدار.' },
  { id: '19', english: 'Pen', arabic: 'قلم كتابة', phonetics: '[pɛn]', category: 'تعليم ومطالعة', exampleEn: 'Write your notes with a blue pen.', exampleAr: 'اكتب ملاحظاتك بقلم أزرق.' },
  { id: '20', english: 'Window', arabic: 'نافذة زجاجية', phonetics: '[ˈwɪndəʊ]', category: 'أغراض يومية', exampleEn: 'Open the window to let fresh air in.', exampleAr: 'افتح النافذة ليدخل الهواء النقي.' },
  { id: '21', english: 'Spoon', arabic: 'ملعقة طعام', phonetics: '[spuːn]', category: 'أغراض يومية', exampleEn: 'Eat your soup with a metal spoon.', exampleAr: 'تناول الحساء بملعقة معدنية.' },
  { id: '22', english: 'Coffee', arabic: 'قهوة ساخنة', phonetics: '[ˈkɒfi]', category: 'مأكولات وأغذية', exampleEn: 'I drink hot coffee in the morning.', exampleAr: 'أشرب القهوة الساخنة في الصباح.' },
  { id: '23', english: 'Milk', arabic: 'حليب طازج', phonetics: '[mɪlk]', category: 'مأكولات وأغذية', exampleEn: 'Milk builds strong bones and teeth.', exampleAr: 'الحليب يقوي العظام والأسنان.' },
  { id: '24', english: 'Water', arabic: 'ماء نقي', phonetics: '[ˈwɔːtər]', category: 'مأكولات وأغذية', exampleEn: 'Drink plenty of water every day.', exampleAr: 'اشرب الكثير من الماء يومياً.' },
  { id: '25', english: 'Bread', arabic: 'خبز طازج', phonetics: '[brɛd]', category: 'مأكولات وأغذية', exampleEn: 'We bought freshly baked bread.', exampleAr: 'اشترينا خبزاً طازجاً وساخناً.' },
  { id: '26', english: 'House', arabic: 'منزل عائلي', phonetics: '[haʊs]', category: 'أغراض يومية', exampleEn: 'Our family lives in a beautiful house.', exampleAr: 'تعيش عائلتنا في منزل جميل.' },
  { id: '27', english: 'School', arabic: 'مدرسة تعليمية', phonetics: '[skuːl]', category: 'تعليم ومطالعة', exampleEn: 'Students go to school to learn language.', exampleAr: 'يذهب الطلاب إلى المدرسة لتعلم اللغة.' },
  { id: '28', english: 'Teacher', arabic: 'معلم لغة', phonetics: '[ˈtiːtʃər]', category: 'تعليم ومطالعة', exampleEn: 'The teacher explains the lessons clearly.', exampleAr: 'يشرح المعلم الدروس بوضوح.' },
  { id: '29', english: 'Student', arabic: 'طالب علم', phonetics: '[ˈstjuːdnt]', category: 'تعليم ومطالعة', exampleEn: 'The smart student studies hard.', exampleAr: 'يدرس الطالب الذكي بجد واجتهاد.' },
  { id: '30', english: 'Hospital', arabic: 'مستشفى علاجي', phonetics: '[ˈhɒspɪtl]', category: 'السفر والطريق', exampleEn: 'The hospital provides good healthcare.', exampleAr: 'يوفر المستشفى رعاية صحية جيدة.' },
  { id: '31', english: 'Shoes', arabic: 'حذاء مريح', phonetics: '[ʃuːz]', category: 'أغراض يومية', exampleEn: 'Wear comfortable shoes for walking.', exampleAr: 'ارتدِ حذاءً مريحاً للمشي.' },
  { id: '32', english: 'Shirt', arabic: 'قميص أنيق', phonetics: '[ʃɜːt]', category: 'أغراض يومية', exampleEn: 'He wore a clean white shirt.', exampleAr: 'ارتدى قميصاً أبيض ناصعاً.' },
  { id: '33', english: 'Tree', arabic: 'شجرة خضراء', phonetics: '[triː]', category: 'حيوانات وطبيعة', exampleEn: 'The birds are singing on the tree.', exampleAr: 'تغرد العصافير على الغصن الأخضر.' },
  { id: '35', english: 'Moon', arabic: 'قمر الليل', phonetics: '[muːn]', category: 'حيوانات وطبيعة', exampleEn: 'The moon looks beautiful tonight.', exampleAr: 'يبدو القمر جميلاً للغاية الليلة.' },
  { id: '36', english: 'Star', arabic: 'نجمة مضيئة', phonetics: '[stɑːr]', category: 'حيوانات وطبيعة', exampleEn: 'I saw a falling star in the sky.', exampleAr: 'رأيت نجماً متساقطاً في السماء.' },
  { id: '37', english: 'Flower', arabic: 'زهرة عطرة', phonetics: '[ˈflaʊər]', category: 'حيوانات وطبيعة', exampleEn: 'She picked a sweet red flower.', exampleAr: 'قطفت زهرة حمراء زكية الرائحة.' },
  { id: '34', english: 'Sun', arabic: 'شمس ساطعة', phonetics: '[sʌn]', category: 'حيوانات وطبيعة', exampleEn: 'The sun shines brightly in summer.', exampleAr: 'تسطع الشمس بوهج رائع في الصيف.' },
  { id: '38', english: 'City', arabic: 'مدينة كبرى', phonetics: '[ˈsɪti]', category: 'السفر والطريق', exampleEn: 'This city is famous for its history.', exampleAr: 'تتميز هذه المدينة بتاريخها العريق.' },
  { id: '39', english: 'Airport', arabic: 'مطار دولي', phonetics: '[ˈeəpɔːt]', category: 'السفر والطريق', exampleEn: 'We arrived at the international airport.', exampleAr: 'وصلنا إلى المطار الدولي للرحلات.' },
  { id: '40', english: 'Plane', arabic: 'طائرة ركاب', phonetics: '[pleɪn]', category: 'السفر والطريق', exampleEn: 'The passenger plane is taking off.', exampleAr: 'طائرة الركاب تحلق الآن في الجو.' },
  { id: '41', english: 'Money', arabic: 'نقود / مال', phonetics: '[ˈmʌni]', category: 'أغراض يومية', exampleEn: 'Save money for your future needs.', exampleAr: 'ادخر المال لتلبية احتياجاتك المستقبلية.' },
  { id: '42', english: 'Happy', arabic: 'سعيد / بهيج', phonetics: '[ˈhæpi]', category: 'صفات هامة', exampleEn: 'Learning a new language makes me happy.', exampleAr: 'تعلم لغة جديدة يسعدني جداً.' },
  { id: '43', english: 'Beautiful', arabic: 'جميل / رائع', phonetics: '[ˈbjuːtɪfl]', category: 'صفات هامة', exampleEn: 'She drew a beautiful piece of art.', exampleAr: 'رسمت لوحة فنية جميلة للغاية.' },
  { id: '44', english: 'Smart', arabic: 'ذكي / فطن', phonetics: '[smɑːt]', category: 'صفات هامة', exampleEn: 'Wearing smart glasses is very helpful.', exampleAr: 'ارتداء النظارات الذكية مفيد للغاية.' },
  { id: '45', english: 'Fast', arabic: 'سريع للغاية', phonetics: '[fɑːst]', category: 'صفات هامة', exampleEn: 'The green train is extremely fast.', exampleAr: 'القطار الأخضر سريع للغاية.' },
  { id: '46', english: 'Slow', arabic: 'بطيء الحركة', phonetics: '[sləʊ]', category: 'صفات هامة', exampleEn: 'The turtle has a slow speed.', exampleAr: 'تتحرك السلحفاة بسرعة بطيئة.' },
  { id: '47', english: 'Hot', arabic: 'ساخن / حار', phonetics: '[hɒt]', category: 'صفات هامة', exampleEn: 'Be careful, the coffee is very hot.', exampleAr: 'احذر فالقهوة ساخنة جداً.' },
  { id: '48', english: 'Cold', arabic: 'بارد / صقيع', phonetics: '[kəʊld]', category: 'صفات هامة', exampleEn: 'I love eating cold ice cream in summer.', exampleAr: 'أحب تناول الآيس كريم البارد صيفاً.' },
  { id: '49', english: 'Easy', arabic: 'سهل للغاية', phonetics: '[ˈiːzi]', category: 'صفات هامة', exampleEn: 'Pronouncing these terms is very easy.', exampleAr: 'نطق هذه المصطلحات سهل للغاية.' },
  { id: '50', english: 'Success', arabic: 'نجاح باهر', phonetics: '[səkˈsɛs]', category: 'صفات هامة', exampleEn: 'Hard work is the key to deep success.', exampleAr: 'العمل الجاد هو المفتاح الفعلي للنجاح الباهر.' }
];

interface SimSceneItem {
  id: string;
  labelAr: string;
  labelEn: string;
  topPct: number;
  leftPct: number;
  commentAr: string;
}

interface SimScene {
  id: string;
  name: string;
  emoji: string;
  imgUrl: string;
  items: SimSceneItem[];
}

const SIMULATED_SCENES: SimScene[] = [
  {
    id: 'home',
    name: 'المنزل وغرفة المعيشة',
    emoji: '🏠',
    imgUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800&h=500',
    items: [
      { id: 'chair', labelAr: 'كرسي مريح', labelEn: 'Chair', topPct: 65, leftPct: 20, commentAr: 'جلسة مريحة تزيد من إنتاجية العمل: Sitting in a comfortable chair makes you productive.' },
      { id: 'couch', labelAr: 'أريكة الجلوس', labelEn: 'Couch', topPct: 55, leftPct: 70, commentAr: 'الاسترخاء في الصالة العائلية: Relaxing on the cozy living room couch.' },
      { id: 'laptop', labelAr: 'حاسوب لابتوب', labelEn: 'Laptop', topPct: 42, leftPct: 40, commentAr: 'إنجاز مشاريع وتطوير برمجيات: Writing and testing code on my personal laptop.' },
      { id: 'potted plant', labelAr: 'نبات زينة', labelEn: 'Potted plant', topPct: 35, leftPct: 85, commentAr: 'تزيين زوايا الغرف بالنباتات: Caring for the green potted plant daily.' },
      { id: 'clock', labelAr: 'ساعة الحائط', labelEn: 'Clock', topPct: 15, leftPct: 50, commentAr: 'إدارة الوقت بدقة ممتازة: Checking the wall clock to manage our daily schedule.' },
      { id: 'book', labelAr: 'كتب دراسية', labelEn: 'Book', topPct: 45, leftPct: 30, commentAr: 'الدراسة والمطالعة المستمرة: Reading an interesting English novel to improve vocabulary.' },
    ]
  },
  {
    id: 'street',
    name: 'الشارع العام والمحيط',
    emoji: '🛣️',
    imgUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800&h=500',
    items: [
      { id: 'traffic light', labelAr: 'إشارة مرور', labelEn: 'Traffic light', topPct: 28, leftPct: 75, commentAr: 'تنظيم حركة السير في التقاطعات: Wait for the traffic light to turn green before crossing.' },
      { id: 'car', labelAr: 'سيارة حديثة', labelEn: 'Car', topPct: 65, leftPct: 38, commentAr: 'وسيلة نقل يومية سريعة: Pointing my smart glasses to recognize passing cars.' },
      { id: 'bicycle', labelAr: 'دراجة هوائية', labelEn: 'Bicycle', topPct: 72, leftPct: 16, commentAr: 'رياضة ممتعة وحماية البيئة: Riding a bicycle to stay active and healthy.' },
      { id: 'bench', labelAr: 'مقعد عام', labelEn: 'Bench', topPct: 73, leftPct: 82, commentAr: 'استراحة قصيرة تحت الظلال: Sitting on a wooden park bench to rest.' },
      { id: 'backpack', labelAr: 'حقيبة ظهر', labelEn: 'Backpack', topPct: 52, leftPct: 60, commentAr: 'حمل المستلزمات إلى الجامعة: Keeping textbooks inside my heavy backpack.' },
      { id: 'dog', labelAr: 'كلب المنزل', labelEn: 'Dog', topPct: 80, leftPct: 48, commentAr: 'حيوان وفي ومحبوب: The cute dog is walking happily down the street.' },
    ]
  },
  {
    id: 'supermarket',
    name: 'السوبرماركت والمأكولات',
    emoji: '🛒',
    imgUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800&h=500',
    items: [
      { id: 'apple', labelAr: 'تفاحة حمراء', labelEn: 'Apple', topPct: 50, leftPct: 22, commentAr: 'الغذاء الصحي الغني بالفيتامينات: An apple a day keeps the doctor away.' },
      { id: 'orange', labelAr: 'برتقال ناضج', labelEn: 'Orange', topPct: 52, leftPct: 48, commentAr: 'الحمضيات مفيدة للمناعة: Buying fresh oranges to prepare some juice.' },
      { id: 'banana', labelAr: 'موز أصفر', labelEn: 'Banana', topPct: 46, leftPct: 72, commentAr: 'فاكهة طاقة ممتازة: Peeling a ripe yellow banana for breakfast.' },
      { id: 'bottle', labelAr: 'زجاجة ماء', labelEn: 'Bottle', topPct: 28, leftPct: 15, commentAr: 'الحفاظ على رطوبة الجسم: Drinking cold water from a plastic bottle.' },
      { id: 'backpack', labelAr: 'حقيبة المشتريات', labelEn: 'Backpack', topPct: 75, leftPct: 85, commentAr: 'وضع الأغراض المحفوظة بالحقيبة: Putting all purchased food inside the backpack.' },
    ]
  },
  {
    id: 'cafe',
    name: 'المقهى ومطعم الوجبات',
    emoji: '☕',
    imgUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800&h=500',
    items: [
      { id: 'cup', labelAr: 'كوب القهوة', labelEn: 'Cup', topPct: 58, leftPct: 55, commentAr: 'كوب اللاتيه الصباحي المفضل: Drinking warm Arabica coffee from a ceramic cup.' },
      { id: 'cake', labelAr: 'قطعة حلوى', labelEn: 'Cake', topPct: 62, leftPct: 32, commentAr: 'تذوق المعجنات الشهية بالمقهى: Ordering a piece of cake with chocolate sprinkles.' },
      { id: 'laptop', labelAr: 'لابتوب العمل', labelEn: 'Laptop', topPct: 45, leftPct: 68, commentAr: 'العمل عن بعد بكل مكان: Using my laptop to finish tasks inside the busy cafe.' },
      { id: 'book', labelAr: 'كتاب القراءة', labelEn: 'Book', topPct: 70, leftPct: 15, commentAr: 'المطالعة وتوسيع المدارك: Reading an educational book under the quiet lamp.' },
    ]
  }
];

interface CameraViewProps {
  userId: string;
  onWordIdentified: (word: string) => void;
  ttsVoice: string;
  ttsPitch: number;
  ttsRate: number;
  autoSpeak: boolean;
  initialMode?: 'objects' | 'ocr' | 'offline';
}

interface PredictionBox {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export default function CameraView({ 
  userId, 
  onWordIdentified,
  ttsVoice,
  ttsPitch,
  ttsRate,
  autoSpeak,
  initialMode = 'objects'
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handposeModelRef = useRef<any>(null);
  const bodyPixModelRef = useRef<any>(null);
  const tesseractReadyRef = useRef<boolean>(false);
  
  // Model state
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [visionBoostReady, setVisionBoostReady] = useState<boolean>(false);
  const [liveOcrReady, setLiveOcrReady] = useState<boolean>(false);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStartNonce, setCameraStartNonce] = useState<number>(0);
  
  // Detection tracking State
  const [predictions, setPredictions] = useState<PredictionBox[]>([]);
  const [focusedObject, setFocusedObject] = useState<string | null>(null);
  const [focusProgress, setFocusProgress] = useState<number>(0); // 0 to 100
  const [lockedObject, setLockedObject] = useState<VocabularyMeta | null>(null);
  const [lockedClassId, setLockedClassId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savingDoc, setSavingDoc] = useState<boolean>(false);

  // Camera error display state (no simulate mode anymore)
  const [cameraFailed, setCameraFailed] = useState<boolean>(false);

  // Detection settings panel toggle
  const [showDetectionSettings, setShowDetectionSettings] = useState<boolean>(false);

  // Futuristic Smart Glasses Clutter Mitigation configuration
  const [glassesFilterMode, setGlassesFilterMode] = useState<'gaze' | 'radar'>('gaze');
  const [audioPlayOnce, setAudioPlayOnce] = useState<boolean>(true);
  const [autoFocusEnabled, setAutoFocusEnabled] = useState<boolean>(true);
  const [spokenCount, setSpokenCount] = useState<number>(0);

  // Precision Calibration & Fallback Advisor states (to handle user requests on hand/person inaccuracy)
  const [accuracyThreshold, setAccuracyThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('lingolens_accuracy_threshold');
    return saved ? parseFloat(saved) : 0.50;
  });
  const [lowConfidenceWarning, setLowConfidenceWarning] = useState<boolean>(false);
  const [notAbleToIdentify, setNotAbleToIdentify] = useState<boolean>(false);

  // Camera Active Mode Selector: 'objects' (Live Object Stream) OR 'ocr' (Document Scan & Translate) OR 'offline' (Essential terms & offline models config)
  const [activeViewMode, setActiveViewMode] = useState<'objects' | 'ocr' | 'offline'>(initialMode);

  useEffect(() => {
    setActiveViewMode(initialMode);
  }, [initialMode]);

  // Offline Mode States
  const [isOfflineModeActive, setIsOfflineModeActive] = useState<boolean>(() => {
    return localStorage.getItem('lingolens_offline_active') === 'true';
  });
  const [wordsCached, setWordsCached] = useState<boolean>(() => {
    return localStorage.getItem('lingolens_words_cached') === 'true';
  });
  const [modelCached, setModelCached] = useState<boolean>(() => {
    return localStorage.getItem('lingolens_model_cached') === 'true';
  });
  const [cachingProgress, setCachingProgress] = useState<number>(0);
  const [isCaching, setIsCaching] = useState<boolean>(false);
  
  // Offline quiz states
  const [quizWord, setQuizWord] = useState<OfflineWord | null>(null);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizAnswered, setQuizAnswered] = useState<string | null>(null); // 'correct' | 'wrong' | null
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState<number>(() => {
    const saved = localStorage.getItem('lingolens_quiz_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [quizTotal, setQuizTotal] = useState<number>(() => {
    const saved = localStorage.getItem('lingolens_quiz_total');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [searchTerm, setSearchTerm] = useState<string>('');

  // OCR Document Translator state
  const [ocrCustomText, setOcrCustomText] = useState<string>('');
  const [ocrScanning, setOcrScanning] = useState<boolean>(false);
  const [ocrScanStage, setOcrScanStage] = useState<number>(0); // 0: inactive, 1: focus, 2: capturing, 3: translating, 4: complete
  const [ocrResult, setOcrResult] = useState<OCRPreset | null>(null);
  const [ocrSaved, setOcrSaved] = useState<boolean>(false);
  const [savingOcrDoc, setSavingOcrDoc] = useState<boolean>(false);
  
  // Track individually saved words from the AI-extracted vocabulary lesson cards
  const [savedVocabWords, setSavedVocabWords] = useState<Record<string, boolean>>({});
  const liveOcrBusyRef = useRef<boolean>(false);
  const lastLiveOcrFrameRef = useRef<number>(0);
  const lastLiveOcrTextRef = useRef<string>('');

  // Synchronously cache words
  const handleCacheWords = () => {
    setIsCaching(true);
    setCachingProgress(5);
    const interval = setInterval(() => {
      setCachingProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsCaching(false);
          setWordsCached(true);
          localStorage.setItem('lingolens_words_cached', 'true');
          return 100;
        }
        return p + 15;
      });
    }, 150);
  };

  // Synchronously cache tensorflow models
  const handleCacheModels = () => {
    setModelCached(true);
    localStorage.setItem('lingolens_model_cached', 'true');
  };

  // Toggle offline mode
  const handleToggleOfflineMode = (active: boolean) => {
    setIsOfflineModeActive(active);
    localStorage.setItem('lingolens_offline_active', active ? 'true' : 'false');
  };

  // Generate offline quiz
  const handleGenerateQuiz = () => {
    if (OFFLINE_WORDS.length === 0) return;
    const randomIndex = Math.floor(Math.random() * OFFLINE_WORDS.length);
    const word = OFFLINE_WORDS[randomIndex];
    
    // Choose 2 other wrong options
    const distractors: string[] = [];
    while (distractors.length < 2) {
      const idx = Math.floor(Math.random() * OFFLINE_WORDS.length);
      const d = OFFLINE_WORDS[idx].english;
      if (d !== word.english && !distractors.includes(d)) {
        distractors.push(d);
      }
    }
    
    // Shuffle options
    const options = [word.english, ...distractors].sort(() => Math.random() - 0.5);
    
    setQuizWord(word);
    setQuizOptions(options);
    setQuizAnswered(null);
    setQuizSelectedOption(null);
  };

  // Quiz Answer Submit
  const handleQuizAnswerSubmit = (option: string) => {
    if (quizAnswered || !quizWord) return;
    setQuizSelectedOption(option);
    
    const isCorrect = option.toLowerCase() === quizWord.english.toLowerCase();
    const newAnswered = isCorrect ? 'correct' : 'wrong';
    setQuizAnswered(newAnswered);
    
    const newScore = quizScore + (isCorrect ? 1 : 0);
    const newTotal = quizTotal + 1;
    
    setQuizScore(newScore);
    setQuizTotal(newTotal);
    localStorage.setItem('lingolens_quiz_score', newScore.toString());
    localStorage.setItem('lingolens_quiz_total', newTotal.toString());

    // Auto voice response
    if (isCorrect) {
      speakWord("Excellent!");
    } else {
      speakWord("Try again!");
    }
  };

  const handleResetQuizScore = () => {
    setQuizScore(0);
    setQuizTotal(0);
    localStorage.setItem('lingolens_quiz_score', '0');
    localStorage.setItem('lingolens_quiz_total', '0');
  };

  // Auto trigger first quiz on view load
  useEffect(() => {
    if (activeViewMode === 'offline' && !quizWord) {
      handleGenerateQuiz();
    }
  }, [activeViewMode]);

  const handleSaveIndividualVocab = async (word: string, meaning: string, phonetic: string, type: string) => {
    try {
      await saveWord(userId, {
        id: 'vocab_' + word.toLowerCase().replace(/[^a-z]/g, '') + '_' + Date.now(),
        english: word,
        arabic: `${meaning} (${type})`,
        phonetics: phonetic || '[مستخلص]',
        category: 'مفردات العدسة المترجمة',
        exampleEn: `Learned from line scan: "${ocrCustomText}"`,
        exampleAr: `مفردة مستخلصة من مسح العبارة وتدقيقها.`
      });
      setSavedVocabWords(prev => ({ ...prev, [word]: true }));
      onWordIdentified(word);
    } catch (err) {
      console.error("Failed to save individual vocabulary word:", err);
    }
  };

  // Monitor mode selection to completely reset any trailing object focus/pointing/speech to avoid mixups
  useEffect(() => {
    setFocusedObject(null);
    setLockedObject(null);
    setLockedClassId(null);
    setFocusProgress(0);
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (speechResetTimeoutRef.current) clearTimeout(speechResetTimeoutRef.current);
    lastFrameTimeRef.current = 0;
    isDetectingRef.current = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [activeViewMode]);

  // Speak Arabic word / translation sentences
  const speakArabic = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;
    window.speechSynthesis.speak(utterance);
  };

  // Automated smart client translation mapper
  const handleTranslateCustomText = (text: string): OCRPreset => {
    const normalized = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    
    // Load local custom dictionary trained during audio sessions
    const savedDictRaw = localStorage.getItem('lingolens_custom_dict');
    let customTranslations: Record<string, string> = {};
    if (savedDictRaw) {
      try {
        const parsed = JSON.parse(savedDictRaw);
        Object.entries(parsed).forEach(([enKey, valObj]: [string, any]) => {
          if (valObj && valObj.arabic) {
            customTranslations[enKey.trim().toLowerCase()] = valObj.arabic;
          }
        });
      } catch (e) {}
    }

    if (customTranslations[normalized]) {
      return {
        id: 'custom_' + Date.now(),
        title: 'من قاموسك التدريبي المحدث 🎓',
        english: text,
        arabic: customTranslations[normalized],
        category: 'القاموس المحدث للتدريب المحرك',
        phonetics: `[${normalized}]`,
        exampleEn: `Scanned Trained Term: "${text}"`,
        exampleAr: `تمت ترجمته من معجمك الصوتي: "${customTranslations[normalized]}"`
      };
    }

    if (LOCAL_TRANSLATIONS[normalized]) {
      return {
        id: 'custom_' + Date.now(),
        title: 'نص مخصص مستخلص',
        english: text,
        arabic: LOCAL_TRANSLATIONS[normalized],
        category: 'ترجمة فورية للنظارة',
        phonetics: `[${normalized}]`,
        exampleEn: `Scanned: "${text}"`,
        exampleAr: `تم المسح بنجاح: "${LOCAL_TRANSLATIONS[normalized]}"`
      };
    }
    
    // Word by word matching helper
    const words = normalized.split(/\s+/).filter(Boolean);
    const matchedWords: string[] = [];
    words.forEach(w => {
      if (customTranslations[w]) {
        matchedWords.push(customTranslations[w]);
      } else if (LOCAL_TRANSLATIONS[w]) {
        matchedWords.push(LOCAL_TRANSLATIONS[w]);
      } else if (VOCABULARY_MAP[w]) {
        matchedWords.push(VOCABULARY_MAP[w].arabic);
      } else {
        matchedWords.push(w); // keep verbatim
      }
    });

    const translationJoined = matchedWords.join(' ');

    return {
      id: 'custom_' + Date.now(),
      title: 'نص مخصص مستخلص',
      english: text,
      arabic: translationJoined || 'لم يتم العثور على كلمات مقابلة في قاموس المحاكاة الفوري للعين الذكية.',
      category: 'ترجمة فورية للنظارة',
      phonetics: `[${words.join('·')}]`,
      exampleEn: `Live audio practice text: "${text}"`,
      exampleAr: `جملة التدريب اللغوي الفوري: "${translationJoined || text}"`
    };
  };

  // OCR Laser Scanning steps player with remote server-side AI fallback
  const triggerOcrScan = useCallback(async () => {
    const textToScan = ocrCustomText.trim();
    if (!textToScan) return;
    setOcrScanning(true);
    setOcrResult(null);
    setOcrSaved(false);
    setSavedVocabWords({});
    setOcrScanStage(1);

    // Dynamic animation sequence for scanning
    setTimeout(() => {
      setOcrScanStage(2);
      setTimeout(async () => {
        setOcrScanStage(3);

        if (isOfflineModeActive) {
          setTimeout(() => {
            const fallbackResult = handleTranslateCustomText(textToScan);
            setOcrScanStage(4);
            setOcrScanning(false);
            setOcrResult({
              ...fallbackResult,
              category: "ترجمة فورية (عمل محلي بوضع عدم الاتصال) 🔌",
              grammarTip: "طريقة الاستخدام: تعمل النظارة الآن في وضع عدم الاتصال بالإنترنت بالكامل (Offline Support). تم استخدام القاموس والـ 50 كلمة المخبأين محلياً لضمان تجربة تعليمية مستمرة ودائمة."
            });
            onWordIdentified(fallbackResult.english);
          }, 600);
          return;
        }

        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textToScan })
          });

          if (!response.ok) {
            throw new Error("Dynamic translation API failed with status: " + response.status);
          }

          const data = await response.json();

          // Guard: API returned an error object instead of a translation
          if (data.error) {
            throw new Error(data.error);
          }

          const result: OCRPreset = {
            id: 'dyn_' + Date.now(),
            title: data.title || "ترجمة ذكية بالعدسة",
            english: data.english || textToScan,
            arabic: data.arabic || 'تعذرت الترجمة، يرجى المحاولة مرة أخرى.',
            category: data.category || "ترجمة فورية",
            phonetics: data.phonetics || "[قيد الرصد]",
            exampleEn: data.exampleEn || `Scanned: "${textToScan}"`,
            exampleAr: data.exampleAr || `الترجمة: "${data.arabic}"`,
            grammarTip: data.grammarTip,
            vocabulary: data.vocabulary
          };

          setOcrScanStage(4);
          setOcrScanning(false);
          setOcrResult(result);
          onWordIdentified(result.english);

        } catch (err) {
          console.warn("Express translation proxy fallback triggered: ", err);
          const fallbackResult = handleTranslateCustomText(textToScan);
          setOcrScanStage(4);
          setOcrScanning(false);
          setOcrResult(fallbackResult);
          onWordIdentified(fallbackResult.english);
        }
      }, 600);
    }, 600);
  }, [ocrCustomText, isOfflineModeActive, onWordIdentified]);

  // Smart text debouncer - manual English text is translated without switching modes
  useEffect(() => {
    if (activeViewMode === 'offline' || !ocrCustomText.trim()) return;
    if (ocrScanning) return;

    const handler = setTimeout(() => {
      triggerOcrScan();
    }, 700);

    return () => clearTimeout(handler);
  }, [ocrCustomText, activeViewMode, ocrScanning, triggerOcrScan]);

  // References to keep track of intervals/animation frames and anti-repetition guards
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<any>(null);
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const spokenHistoryRef = useRef<Set<string>>(new Set<string>());
  const speechResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Throttle: fast smart-glasses sampling without overlapping mobile inference
  const lastFrameTimeRef = useRef<number>(0);
  const FRAME_INTERVAL_MS = SMART_FRAME_INTERVAL_MS;
  // Track if a detection is already in-flight to prevent overlapping async calls
  const isDetectingRef = useRef<boolean>(false);

  // Everyday household items used for fallback simulation
  const SIMULATED_ITEMS = [
    { id: 'chair', labelAr: 'كرسي', labelEn: 'Chair', imgUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'laptop', labelAr: 'حاسوب محمول', labelEn: 'Laptop', imgUrl: 'https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'cup', labelAr: 'كوب', labelEn: 'Cup', imgUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'book', labelAr: 'كتاب', labelEn: 'Book', imgUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'apple', labelAr: 'تفاحة', labelEn: 'Apple', imgUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'cat', labelAr: 'قطة', labelEn: 'Cat', imgUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'clock', labelAr: 'ساعة', labelEn: 'Clock', imgUrl: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: 'banana', labelAr: 'موز', labelEn: 'Banana', imgUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=200&h=200' },
  ];

  // Speak English word
  const speakWord = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Cancel any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsVoice;
    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;
    window.speechSynthesis.speak(utterance);
  };



  const getBodyPartFromSegmentation = (segmentation: any, videoWidth: number, videoHeight: number): PredictionBox | null => {
    if (!segmentation?.data || !segmentation.width || !segmentation.height) return null;

    const sampleHalfWidth = Math.max(3, Math.floor(segmentation.width * 0.10));
    const sampleHalfHeight = Math.max(3, Math.floor(segmentation.height * 0.10));
    const centerX = Math.floor(segmentation.width / 2);
    const centerY = Math.floor(segmentation.height / 2);
    const counts: Record<string, number> = {};

    for (let y = Math.max(0, centerY - sampleHalfHeight); y < Math.min(segmentation.height, centerY + sampleHalfHeight); y += 2) {
      for (let x = Math.max(0, centerX - sampleHalfWidth); x < Math.min(segmentation.width, centerX + sampleHalfWidth); x += 2) {
        const partId = segmentation.data[y * segmentation.width + x];
        const label = BODYPIX_PART_LABELS[partId];
        if (label) counts[label] = (counts[label] || 0) + 1;
      }
    }

    const best = Object.entries(counts)
      .filter(([, count]) => count >= 3)
      .sort((a, b) => (b[1] + (BODY_PART_PRIORITY[b[0]] || 0)) - (a[1] + (BODY_PART_PRIORITY[a[0]] || 0)))[0];

    if (!best) return null;
    const boxSize = Math.min(videoWidth, videoHeight) * 0.36;
    return {
      class: best[0],
      score: Math.min(0.97, 0.74 + best[1] / 180),
      bbox: [videoWidth / 2 - boxSize / 2, videoHeight / 2 - boxSize / 2, boxSize, boxSize]
    };
  };

  const getCenterScanFrame = (video: HTMLVideoElement) => {
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    const scanSize = Math.max(192, Math.floor(Math.min(videoWidth, videoHeight) * CENTER_SCAN_RATIO));
    const sourceX = Math.max(0, Math.floor((videoWidth - scanSize) / 2));
    const sourceY = Math.max(0, Math.floor((videoHeight - scanSize) / 2));
    const canvas = document.createElement('canvas');
    canvas.width = scanSize;
    canvas.height = scanSize;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
      return { source: video, offsetX: 0, offsetY: 0, scanWidth: videoWidth, scanHeight: videoHeight };
    }

    ctx.drawImage(video, sourceX, sourceY, scanSize, scanSize, 0, 0, scanSize, scanSize);
    return { source: canvas, offsetX: sourceX, offsetY: sourceY, scanWidth: scanSize, scanHeight: scanSize };
  };

  const mapCenterScanDetectionToVideo = (prediction: any, offsetX: number, offsetY: number): PredictionBox => {
    const [x, y, w, h] = prediction.bbox;
    return {
      class: String(prediction.class || '').toLowerCase(),
      score: Number(prediction.score || 0),
      bbox: [x + offsetX, y + offsetY, w, h]
    };
  };

  const getOpenSourceBodyDetections = async (video: HTMLVideoElement): Promise<PredictionBox[]> => {
    const detections: PredictionBox[] = [];
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    if (handposeModelRef.current) {
      try {
        const hands = await handposeModelRef.current.estimateHands(video, false);
        hands.forEach((hand: any) => {
          const topLeft = hand?.boundingBox?.topLeft || hand?.topLeft;
          const bottomRight = hand?.boundingBox?.bottomRight || hand?.bottomRight;
          const x1 = Array.isArray(topLeft) ? topLeft[0] : topLeft?.[0];
          const y1 = Array.isArray(topLeft) ? topLeft[1] : topLeft?.[1];
          const x2 = Array.isArray(bottomRight) ? bottomRight[0] : bottomRight?.[0];
          const y2 = Array.isArray(bottomRight) ? bottomRight[1] : bottomRight?.[1];
          if ([x1, y1, x2, y2].every((v) => Number.isFinite(v))) {
            detections.push({ class: 'hand', score: hand.handInViewConfidence || 0.92, bbox: [x1, y1, Math.max(32, x2 - x1), Math.max(32, y2 - y1)] });
          }
        });
      } catch (err) {
        console.warn('Handpose frame skipped:', err);
      }
    }

    if (bodyPixModelRef.current) {
      try {
        const segmentation = await bodyPixModelRef.current.segmentPersonParts(video, {
          flipHorizontal: false,
          internalResolution: 'low',
          segmentationThreshold: 0.55
        });
        const partDetection = getBodyPartFromSegmentation(segmentation, videoWidth, videoHeight);
        if (partDetection) detections.push(partDetection);
      } catch (err) {
        console.warn('BodyPix frame skipped:', err);
      }
    }

    return detections;
  };

  const processLiveTextFrame = async (video: HTMLVideoElement) => {
    if (liveOcrBusyRef.current || !tesseractReadyRef.current) return;
    liveOcrBusyRef.current = true;

    try {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 720 / Math.max(video.videoWidth || 640, video.videoHeight || 480));
      canvas.width = Math.max(320, Math.floor((video.videoWidth || 640) * scale));
      canvas.height = Math.max(240, Math.floor((video.videoHeight || 480) * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.filter = 'contrast(1.25) grayscale(1)';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const Tesseract = (window as any).Tesseract;
      if (!Tesseract?.recognize) return;
      const { data } = await Tesseract.recognize(canvas, 'eng');
      const confidence = Number(data?.confidence || 0);
      const text = String(data?.text || '').replace(/\s+/g, ' ').trim();
      if (confidence < TEXT_CONFIDENCE_THRESHOLD || !/[a-zA-Z]{2,}/.test(text) || text.length < 3) return;
      if (text.toLowerCase() === lastLiveOcrTextRef.current.toLowerCase()) return;

      lastLiveOcrTextRef.current = text;
      const translated = handleTranslateCustomText(text);
      setOcrCustomText(text);
      setOcrResult({
        ...translated,
        title: 'ترجمة شارع فورية من البث',
        category: `قراءة نص حي من الكاميرا (${Math.round(confidence)}%)`
      });
      setOcrScanStage(4);
      onWordIdentified(text);
      if (autoSpeak) speakArabic(translated.arabic);
    } catch (err) {
      console.warn('Live OCR frame skipped:', err);
    } finally {
      liveOcrBusyRef.current = false;
    }
  };

  // 1. Initial Load: TensorFlow.js & COCO-SSD loaded from index.html (with resilience ticks)
  useEffect(() => {
    let active = true;
    async function loadLibrariesAndModel() {
      try {
        if (active) setModelLoading(true);
        
        // Wait shortly for head script tags; then fall back to jsDelivr open-source bundles.
        const waitForGlobals = async (ticks = 0): Promise<any> => {
          const windowAny = window as any;
          if (windowAny.cocoSsd && windowAny.tf) return windowAny.cocoSsd;
          if (ticks > 25) return null;
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (!active) return null;
          return waitForGlobals(ticks + 1);
        };

        let cocoSsd = await waitForGlobals();

        if (!cocoSsd) {
          await loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js');
          await loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');
          cocoSsd = (window as any).cocoSsd;
        }

        if (!active || !cocoSsd) return;

        const loadedModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (active) {
          modelRef.current = loadedModel;
          setModelReady(true);
          console.log("TensorFlow & COCO-SSD initialized successfully");
        }

        Promise.allSettled([
          loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose@0.1.0/dist/handpose.min.js')
            .then(async () => {
              const handpose = (window as any).handpose;
              if (handpose?.load) handposeModelRef.current = await handpose.load();
            }),
          loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.2.0/dist/body-pix.min.js')
            .then(async () => {
              const bodyPix = (window as any).bodyPix;
              if (bodyPix?.load) {
                bodyPixModelRef.current = await bodyPix.load({
                  architecture: 'MobileNetV1',
                  outputStride: 16,
                  multiplier: 0.50,
                  quantBytes: 2
                });
              }
            }),
          loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js')
            .then(() => {
              tesseractReadyRef.current = !!(window as any).Tesseract;
              if (active) setLiveOcrReady(tesseractReadyRef.current);
            })
        ]).then(() => {
          if (active) setVisionBoostReady(!!handposeModelRef.current || !!bodyPixModelRef.current);
        });
      } catch (err: any) {
        console.error("Error loading TF models: ", err);
        if (active) {
          setModelError(err.message || 'فشل تحميل محرك الذكاء الاصطناعي المحلي.');
        }
      } finally {
        if (active) setModelLoading(false);
      }
    }
    loadLibrariesAndModel();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (speechResetTimeoutRef.current) clearTimeout(speechResetTimeoutRef.current);
    };
  }, []);

  const getCameraFailureMessage = (err: any) => {
    if (!window.isSecureContext) {
      return 'الكاميرا تحتاج رابط HTTPS آمن. افتح التطبيق من رابط Vercel الرسمي وليس رابط معاينة غير آمن.';
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return 'المتصفح الحالي لا يدعم تشغيل الكاميرا داخل التطبيق. جرّب Chrome أو Safari محدث.';
    }

    if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
      return 'تم رفض إذن الكاميرا. افتح إعدادات الموقع في المتصفح واسمح بالكاميرا ثم اضغط إعادة المحاولة.';
    }

    if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
      return 'لم يتم العثور على كاميرا متاحة على هذا الجهاز.';
    }

    if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
      return 'الكاميرا مستخدمة في تطبيق آخر أو غير متاحة الآن. أغلق التطبيقات الأخرى ثم اضغط إعادة المحاولة.';
    }

    if (err?.name === 'OverconstrainedError' || err?.name === 'ConstraintNotSatisfiedError') {
      return 'إعدادات الكاميرا الخلفية غير متاحة على جهازك. سنحاول تشغيل أي كاميرا متاحة.';
    }

    return 'لم نتمكن من الوصول للكاميرا. تأكد من منح الإذن للمتصفح ثم اضغط إعادة المحاولة.';
  };

  const bindStreamToVideo = async (mediaStream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;
    if (video.srcObject !== mediaStream) video.srcObject = mediaStream;
    try {
      await video.play();
    } catch (err) {
      console.warn("Video play error:", err);
    }
  };

  // 2. Camera Activation
  useEffect(() => {
    let stream: MediaStream | null = null;
    let active = true;

    async function startCamera() {
      try {
        setCameraError(null);
        setCameraFailed(false);

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('MEDIA_DEVICES_UNSUPPORTED');
        }

        const cameraProfiles: MediaStreamConstraints[] = [
          { video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
          { video: { facingMode: 'environment' }, audio: false },
          { video: true, audio: false }
        ];

        let mediaStream: MediaStream | null = null;
        let lastError: any = null;

        for (const constraints of cameraProfiles) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            break;
          } catch (err: any) {
            lastError = err;
            console.warn('Camera profile failed:', constraints, err);
          }
        }

        if (!mediaStream) throw lastError || new Error('CAMERA_START_FAILED');
        if (!active) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }

        stream = mediaStream;
        streamRef.current = mediaStream;
        setCameraActive(true);
        await bindStreamToVideo(mediaStream);
      } catch (err: any) {
        console.warn("Camera access denied or failed: ", err);
        if (active) {
          setCameraActive(false);
          setCameraError(getCameraFailureMessage(err));
          setCameraFailed(true);
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      stream?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCameraActive(false);
    };
  }, [cameraStartNonce]);

  // Re-bind active stream to video element when the camera view becomes visible or mode changes.
  useEffect(() => {
    if (cameraActive && streamRef.current) {
      bindStreamToVideo(streamRef.current);
    }
  }, [activeViewMode, cameraActive, modelLoading, cameraFailed]);

  // 3. Frame Processing and detection loop
  useEffect(() => {
    if (!cameraActive || !videoRef.current || activeViewMode !== 'objects') {
      setPredictions([]);
      setFocusedObject(null);
      setFocusProgress(0);
      return;
    }

    const detectFrame = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        requestRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      // --- THROTTLE: skip frame if less than FRAME_INTERVAL_MS has elapsed ---
      const now = performance.now();
      if (now - lastFrameTimeRef.current < FRAME_INTERVAL_MS) {
        requestRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      // --- GUARD: skip if a detection is already running (prevent overlapping async calls) ---
      if (isDetectingRef.current) {
        requestRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      lastFrameTimeRef.current = now;
      isDetectingRef.current = true;
      let tfScopeStarted = false;

      try {
        {
          const video = videoRef.current;
          if (!video) { isDetectingRef.current = false; return; }

          if (liveOcrReady && now - lastLiveOcrFrameRef.current > LIVE_OCR_INTERVAL_MS) {
            lastLiveOcrFrameRef.current = now;
            processLiveTextFrame(video);
          }

          const videoWidth = video.videoWidth || 640;
          const videoHeight = video.videoHeight || 480;
          const centerX = videoWidth / 2;
          const centerY = videoHeight / 2;
          const tf = (window as any).tf;
          if (tf?.engine) {
            tf.engine().startScope();
            tfScopeStarted = true;
          }

          // Center-point inference: crop the hot path to the reticle area instead of scanning the full frame.
          // This keeps crowded scenes fast and makes the object under the middle dot the primary result.
          const centerScan = getCenterScanFrame(video);
          const centerResults = modelRef.current
            ? await modelRef.current.detect(centerScan.source)
            : [];
          let results: any[] = centerResults.map((prediction: any) => mapCenterScanDetectionToVideo(prediction, centerScan.offsetX, centerScan.offsetY));

          // Run expensive body/hand helpers only when COCO has no usable center candidate.
          const hasUsableCenterResult = results.some((p: any) => p.score >= accuracyThreshold);
          if (!hasUsableCenterResult) {
            const bodyDetections = await getOpenSourceBodyDetections(video);
            results = [...bodyDetections, ...results];
          }

          // Track and analyze raw classifications for precision warning advice
          const lowConfidenceCandidates = results.filter((p: any) => p.score >= 0.30 && p.score < accuracyThreshold);
          const hasLowConfidence = lowConfidenceCandidates.length > 0;

          // Map and enrich coco prediction results with distance to center-of-vision
          const enrichedDetections = results
            .filter((p: any) => p.score >= accuracyThreshold)
            .map((p: any) => {
              const [x, y, w, h] = p.bbox;
              const predCenterX = x + w / 2;
              const predCenterY = y + h / 2;
              const distFromCenter = Math.sqrt(
                Math.pow(predCenterX - centerX, 2) + Math.pow(predCenterY - centerY, 2)
              );
              const pointHitsBox = centerX >= x - CENTER_POINT_HIT_RADIUS_PX &&
                centerX <= x + w + CENTER_POINT_HIT_RADIUS_PX &&
                centerY >= y - CENTER_POINT_HIT_RADIUS_PX &&
                centerY <= y + h + CENTER_POINT_HIT_RADIUS_PX;

              // SMART FALSE-POSITIVE 'PERSON' GUARD:
              // If the model identifies a 'person' but the bounding box coverage is very small (area < 12%),
              // it means only a hand / fingers / isolated limbs are shown.
              // To prevent the annoying false "person" (شخص) guess when showing a hand, we reject it from top results!
              if (p.class.toLowerCase() === 'person') {
                const areaFraction = (w * h) / (videoWidth * videoHeight);
                if (areaFraction < 0.12) {
                  return null;
                }
              }

              return {
                class: p.class.toLowerCase(),
                score: p.score,
                bbox: p.bbox,
                distFromCenter,
                pointHitsBox
              };
            })
            .filter((d: any) => d !== null); // Cleanly drop false-positives

          // Update warnings based on cleaned predictions to maximize user feedback accuracy
          setLowConfidenceWarning(hasLowConfidence && enrichedDetections.length === 0);
          
          // If no high-quality objects are recognized OR if there are zero raw coco matches, state that we cannot identify it!
          setNotAbleToIdentify(
            (results.length > 0 && enrichedDetections.length === 0) || 
            (results.length === 0 && cameraActive)
          );

          // Sort predictions: exact reticle hits first, then nearest object to the center point.
          enrichedDetections.sort((a: any, b: any) => {
            if (a.pointHitsBox !== b.pointHitsBox) return a.pointHitsBox ? -1 : 1;
            return a.distFromCenter - b.distFromCenter;
          });

          // Apply Smart Glasses Clutter filter rules
          // In 'gaze' focus mode: we only render/highlight the single closest object to center ofvision to prevent distraction.
          // In 'radar' wide-scan mode: we render all of them.
          const finalPredictions = glassesFilterMode === 'gaze'
            ? (enrichedDetections.length > 0 ? [enrichedDetections[0]] : [])
            : enrichedDetections;

          if (activeViewMode === 'objects') {
            setPredictions(finalPredictions);
          } else {
            setPredictions([]);
          }

          // Object Gaze Freeze Process: Choose the object nearest to the center (the first element in sorted enriched list)
          if (enrichedDetections.length > 0 && activeViewMode === 'objects') {
            const primary = enrichedDetections[0];
            const className = primary.class;

            if (VOCABULARY_MAP[className]) {
              if (focusedObject !== className) {
                // New object focused! Reset progress and timer
                setFocusedObject(className);
                setFocusProgress(0);
                
                if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

                // Start circular loading interval
                progressIntervalRef.current = setInterval(() => {
                  setFocusProgress((prev) => {
                    if (prev >= 100) {
                      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                      return 100;
                    }
                    return prev + 12;
                  });
                }, FOCUS_PROGRESS_STEP_MS);

                // Setup a short center-point lock so new objects are spoken almost immediately.
                focusTimerRef.current = setTimeout(() => {
                  triggerObjectLock(className);
                }, CENTER_FOCUS_LOCK_MS);
              }
            }
          } else {
            // No objects detected: decay progress slowly and clear speech lock resets
            if (focusProgress > 0) {
              setFocusProgress(prev => Math.max(0, prev - 15));
            } else if (focusedObject) {
              setFocusedObject(null);
              
              // If focused target becomes null, set a minor timeout to reset speech key context
              // This ensures if they look away for 1.5s, speech can re-fire when they look back.
              // This is a premium smart glasses experience.
              if (speechResetTimeoutRef.current) clearTimeout(speechResetTimeoutRef.current);
              speechResetTimeoutRef.current = setTimeout(() => {
                lastSpokenIdRef.current = null;
              }, 1500);
            }
          }

        }
      } catch (err) {
        console.error("Detection error: ", err);
      } finally {
        // Always release TF tensors and the in-flight guard so next frame can run.
        const tf = (window as any).tf;
        if (tfScopeStarted && tf?.engine) {
          tf.engine().endScope();
        }
        isDetectingRef.current = false;
      }

      if (activeViewMode === 'objects') {
        requestRef.current = requestAnimationFrame(detectFrame);
      }
    };

    if (activeViewMode === 'objects') {
      requestRef.current = requestAnimationFrame(detectFrame);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [modelReady, cameraActive, focusedObject, focusProgress, glassesFilterMode, activeViewMode]);

  // Trigger Locking of object, play TTS audio and report progress
  const triggerObjectLock = (classNameToLock: string) => {
    const vocabData = VOCABULARY_MAP[classNameToLock];
    if (vocabData) {
      setLockedObject(vocabData);
      setLockedClassId(classNameToLock);
      setIsSaved(false);
      onWordIdentified(vocabData.english);

      // Trigger standard sweet haptic vibration feedback on successful focal confirmation
      if (autoFocusEnabled && typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([100, 50, 100]); // vibrate twice briefly
        } catch (err) {
          console.warn("Haptic play failed:", err);
        }
      }

      if (autoSpeak) {
        // Enforce smart repetition mitigation filter to avoid annoying audio loops
        if (audioPlayOnce) {
          if (!spokenHistoryRef.current.has(classNameToLock)) {
            speakWord(vocabData.english);
            spokenHistoryRef.current.add(classNameToLock);
            setSpokenCount(spokenHistoryRef.current.size);
            lastSpokenIdRef.current = classNameToLock;
          } else {
            console.log(`Smart glasses audio bypass: "${vocabData.english}" has already been spoken once this session.`);
          }
        } else {
          speakWord(vocabData.english);
        }
      }
    }
  };

  // Safe client-side Firestore vocabulary save handling
  const handleSaveToDictionary = async () => {
    if (!lockedObject || !lockedClassId) return;
    setSavingDoc(true);
    try {
      await saveWord(userId, {
        id: lockedClassId,
        english: lockedObject.english,
        arabic: lockedObject.arabic,
        phonetics: lockedObject.phonetics,
        category: lockedObject.category,
        exampleEn: lockedObject.exampleEn,
        exampleAr: lockedObject.exampleAr
      });
      setIsSaved(true);
    } catch (err) {
      console.error("Save word failed: ", err);
    } finally {
      setSavingDoc(false);
    }
  };

  // Safe client-side Firestore OCR translated document save helper
  const handleSaveOcrToDictionary = async () => {
    if (!ocrResult) return;
    setSavingOcrDoc(true);
    try {
      await saveWord(userId, {
        id: ocrResult.id,
        english: ocrResult.english,
        arabic: ocrResult.arabic,
        phonetics: ocrResult.phonetics || '[منطوق]',
        category: ocrResult.category || 'مسودات نصوص ومستندات',
        exampleEn: ocrResult.exampleEn,
        exampleAr: ocrResult.exampleAr
      });
      setOcrSaved(true);
    } catch (err) {
      console.error("Save OCR translated document failed: ", err);
    } finally {
      setSavingOcrDoc(false);
    }
  };

  // Helpers to draw bounding box
  const renderBoundingBoxes = () => {
    if (!videoRef.current || predictions.length === 0) return null;
    
    const video = videoRef.current;
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;
    
    // Default video size is 640x480 for coco mapping
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    
    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;

    return predictions.map((pred, i) => {
      const [x, y, width, height] = pred.bbox;
      const left = x * scaleX;
      const top = y * scaleY;
      const boxWidth = width * scaleX;
      const boxHeight = height * scaleY;

      // Check if this is the highlighted item
      const isActive = pred.class === focusedObject;

      const vocab = VOCABULARY_MAP[pred.class];
      const arabicName = vocab?.arabic || pred.class;
      const englishName = vocab?.english || pred.class;

      return (
        <div 
          key={i} 
          className="absolute border-2 pointer-events-none rounded-2xl transition-all duration-100"
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${boxWidth}px`,
            height: `${boxHeight}px`,
            borderColor: isActive ? '#8a9a5b' : 'rgba(255, 255, 255, 0.45)',
            boxShadow: isActive ? '0 0 20px rgba(138, 154, 91, 0.65)' : 'none',
            zIndex: isActive ? 20 : 10
          }}
        >
          {/* Corner brackets for smart Auto-Focus feedback */}
          {autoFocusEnabled && isActive && (
            <>
              {/* Top Left corner */}
              <div className="absolute -top-[2px] -left-[2px] w-5 h-5 border-t-4 border-l-4 border-[#8a9a5b] rounded-tl-xl animate-pulse" />
              {/* Top Right corner */}
              <div className="absolute -top-[2px] -right-[2px] w-5 h-5 border-t-4 border-r-4 border-[#8a9a5b] rounded-tr-xl animate-pulse" />
              {/* Bottom Left corner */}
              <div className="absolute -bottom-[2px] -left-[2px] w-5 h-5 border-b-4 border-l-4 border-[#8a9a5b] rounded-bl-xl animate-pulse" />
              {/* Bottom Right corner */}
              <div className="absolute -bottom-[2px] -right-[2px] w-5 h-5 border-b-4 border-r-4 border-[#8a9a5b] rounded-br-xl animate-pulse" />
              
              {/* Scan laser sweeping line overlay */}
              {focusProgress < 100 && (
                <div 
                  className="absolute left-0 right-0 h-[2.5px] bg-[#8a9a5b] shadow-[0_0_10px_#8a9a5b] animate-bounce"
                  style={{ top: `${focusProgress}%` }}
                />
              )}
            </>
          )}

          {/* Futuristic minimalist label displayed directly above */}
          <div 
            className="absolute top-0 right-0 -translate-y-[100%] mb-1.5 flex items-center gap-2 bg-stone-900/95 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1.5 rounded-xl shadow-lg border border-white/10 select-none pointer-events-auto filter drop-shadow-md whitespace-nowrap animate-in fade-in"
          >
            <span className="font-sans font-bold tracking-tight text-right flex items-center gap-1.5">
              <span className="text-[#d8e2be]">{arabicName}</span>
              <span className="text-stone-400 font-light text-[9px] font-mono">/</span>
              <span className="text-white font-semibold">{englishName}</span>
              {autoFocusEnabled && isActive && (
                <span className={`text-[9px] text-[#8a9a5b] mr-1 px-1.5 py-0.5 rounded-md bg-[#8a9a5b]/12 inline-block font-mono animate-pulse font-black`}>
                  {focusProgress < 100 ? `⚡ جاري الضبط... ${focusProgress}%` : '🎯 تم التتبع'}
                </span>
              )}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                speakWord(englishName);
              }}
              className="p-1 bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title="نطق الكلمة"
            >
              <Volume2 size={11} className="stroke-[3]" />
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="w-full flex flex-col gap-5" dir="rtl">

      {/* Unified Smart Scan Mode */}
      <div className="bg-stone-200/70 p-1.5 rounded-[24px] border border-stone-200/40 w-full max-w-4xl mx-auto z-10 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveViewMode('objects')}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl text-[13px] font-black transition-all cursor-pointer select-none bg-[#8a9a5b] text-white shadow-md"
        >
          <Scan size={16} />
          <span>مساعد ذكي: رصد المجسمات + ترجمة النصوص</span>
          {visionBoostReady && <span className="text-[9px] bg-white/15 px-2 py-0.5 rounded-full">Handpose + BodyPix</span>}
          {liveOcrReady && <span className="text-[9px] bg-white/15 px-2 py-0.5 rounded-full">OCR حي</span>}
        </button>
      </div>

      {/* Main Viewport */}
      <div className="relative w-full min-h-[460px] bg-stone-950 rounded-[40px] shadow-2xl overflow-hidden border-[12px] border-white flex flex-col items-center justify-center animate-in fade-in duration-300">
        <style>{`@keyframes scan-motion{0%{top:0%}50%{top:100%}100%{top:0%}}`}</style>

        {activeViewMode === 'offline' ? (
          <div className="absolute inset-0 bg-[#161513] flex flex-col p-6 overflow-y-auto scrollbar-none text-right text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-stone-800 mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/15 rounded-xl border border-amber-500/25 text-amber-500"><WifiOff size={20} /></div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-stone-100 flex items-center gap-2">
                    <span>منظومة العمل دون اتصال بالإنترنت</span>
                    <span className="text-xs bg-amber-600/10 text-amber-500 px-2 py-0.5 rounded-md">v1.2.0 (Offline Suite)</span>
                  </h3>
                  <p className="text-[10px] text-stone-400">قم بحفظ طرازات الذكاء الاصطناعي والترجمات لقراءة ليزرية بنسبة 100% بدون شبكة.</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-stone-900 px-3 py-1.5 rounded-xl border border-white/5 shrink-0">
                <span className="text-[10px] font-bold text-stone-400">وضع الأوفلاين:</span>
                <button onClick={() => handleToggleOfflineMode(!isOfflineModeActive)}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${isOfflineModeActive ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-500'}`}>
                  {isOfflineModeActive ? 'قيد العمل أوفلاين 🔌' : 'معطل (استخدام السيرفر)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 shrink-0">
              <div className="bg-stone-900/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><Database size={15} className="text-blue-400" /><span className="text-xs font-black text-stone-300">حقيبة الـ 50 كلمة الأساسية</span></div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${wordsCached ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{wordsCached ? 'مكثّفة 💾' : 'غير مخزنة'}</span>
                </div>
                <p className="text-[10px] text-stone-400">روابط الـ 50 مفردة الأكثر أهمية مبرمجة في المتصفح لتعمل بدون إنترنت.</p>
                {isCaching ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[9px] font-bold text-stone-300"><span>جاري التخزين...</span><span>{cachingProgress}%</span></div>
                    <div className="w-full bg-stone-800 rounded-full h-1"><div className="bg-blue-500 h-1 rounded-full transition-all" style={{ width: `${cachingProgress}%` }} /></div>
                  </div>
                ) : (
                  <button onClick={handleCacheWords} className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-white text-[10px] font-black rounded-lg border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer">
                    <DownloadCloud size={13} className="text-blue-400" /><span>مزامنة وحفظ الـ 50 مفردة محلياً</span>
                  </button>
                )}
              </div>
              <div className="bg-stone-900/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><Zap size={15} className="text-amber-400" /><span className="text-xs font-black text-stone-300">طراز الرؤية TensorFlow.js</span></div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${modelCached ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{modelCached ? 'مخزن 🔋' : 'غير مخزن'}</span>
                </div>
                <p className="text-[10px] text-stone-400">تهيئة مسبقة لملفات الشبكة العصبية COCO-SSD لتعمل بدون إنترنت.</p>
                <button onClick={handleCacheModels} className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-white text-[10px] font-black rounded-lg border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer">
                  <DownloadCloud size={13} className="text-amber-400" /><span>تثبيت النموذج ومحركات العمل أوفلاين</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0">
              <div className="lg:col-span-7 bg-stone-900/40 p-4 rounded-xl border border-white/5 flex flex-col min-h-[300px]">
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-2"><BookOpen size={14} className="text-emerald-400" /><span className="text-[11px] font-black text-stone-200">القاموس المحلي التفاعلي (50 كلمة)</span></div>
                  <div className="relative w-36">
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500" size={11} />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث..." className="w-full bg-stone-950 p-1.5 pr-6 text-[9px] font-bold rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200 placeholder-stone-600" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-none space-y-1.5 max-h-[160px]">
                  {OFFLINE_WORDS.filter(w => !searchTerm.trim() || w.english.toLowerCase().includes(searchTerm.toLowerCase()) || w.arabic.includes(searchTerm)).map((item) => (
                    <div key={item.id} onClick={() => speakWord(item.english)} className="bg-stone-950/50 p-2 rounded-lg border border-white/5 hover:border-amber-500/30 transition-all flex justify-between items-center gap-2 cursor-pointer group">
                      <div className="flex-1 text-right flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-serif font-black text-[11px] text-stone-200 group-hover:text-amber-400">{item.english}</span>
                          <span className="text-[7.5px] font-mono text-stone-500">{item.phonetics}</span>
                          <span className="text-[7px] font-black bg-white/5 text-stone-400 px-1 py-0.5 rounded">{item.category}</span>
                        </div>
                        <span className="text-[10px] font-black text-stone-300 mt-0.5">{item.arabic}</span>
                      </div>
                      <button type="button" className="p-1 bg-stone-900 rounded text-stone-400 group-hover:text-amber-500 transition-all flex items-center justify-center border border-white/5"><Volume2 size={11} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-stone-900/40 p-4 rounded-xl border border-white/5 flex flex-col min-h-[300px]">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5"><Award size={14} className="text-amber-500" /><span className="text-[11px] font-black text-stone-200">تحدي الذاكرة السريع</span></div>
                  <div className="flex items-center gap-1.5 text-[8.5px] bg-stone-950 px-2 py-0.5 rounded border border-white/5 text-stone-400">
                    <span>النتيجة: {quizScore} / {quizTotal}</span>
                    <button onClick={handleResetQuizScore} className="hover:text-red-400 border-r border-white/10 pr-1.5 mr-1.5">تصفير</button>
                  </div>
                </div>
                {quizWord ? (
                  <div className="flex-1 flex flex-col justify-between min-h-0">
                    <div className="text-center p-2.5 bg-stone-950/80 rounded-xl border border-white/5 flex flex-col items-center gap-1 shrink-0">
                      <span className="text-[8.5px] font-black text-amber-500">ما هو المعنى الإنجليزي للمصطلح الآتي؟</span>
                      <h4 className="text-xs font-black text-white">{quizWord.arabic}</h4>
                      <p className="text-[7.5px] text-stone-500 italic">تصنيف: {quizWord.category}</p>
                    </div>
                    <div className="space-y-1.5 my-2 flex-1 flex flex-col justify-center min-h-0">
                      {quizOptions.map((opt, oIdx) => {
                        const isCorrectOpt = opt.toLowerCase() === quizWord.english.toLowerCase();
                        let optStyle = 'bg-stone-950 hover:bg-stone-900 border-white/10 text-stone-300';
                        if (quizAnswered) optStyle = isCorrectOpt ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' : quizSelectedOption === opt ? 'bg-red-500/10 text-red-400 border-red-500/40' : 'bg-stone-950/30 text-stone-600 border-white/5 cursor-not-allowed';
                        return (
                          <button key={oIdx} disabled={!!quizAnswered} onClick={() => handleQuizAnswerSubmit(opt)} className={`w-full p-1.5 rounded-lg border text-center text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${optStyle}`}>
                            {quizAnswered && isCorrectOpt && <Check size={10} />}<span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-2 shrink-0">
                      {quizAnswered ? (
                        <span className={`text-[8.5px] font-black ${quizAnswered === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>{quizAnswered === 'correct' ? 'إجابة صحيحة! 🌟' : `خطأ! الإجابة: ${quizWord.english}`}</span>
                      ) : (<span className="text-[8px] text-stone-500">اختر الإجابة.</span>)}
                      <button onClick={handleGenerateQuiz} className="py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[8.5px] font-black flex items-center gap-1 cursor-pointer"><span>التالي</span><RotateCcw size={9} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-stone-500"><Loader2 className="animate-spin mb-1" size={13} /><span className="text-[10px]">جاري التحضير...</span></div>
                )}
              </div>
            </div>
          </div>
        ) : modelLoading && !cameraActive ? (
          <div className="absolute inset-0 bg-stone-900/95 flex flex-col items-center justify-center text-white z-50 p-6 text-center">
            <Loader2 className="animate-spin text-[#8a9a5b] mb-4" size={48} />
            <h3 className="text-lg font-black mb-2">جاري تشغيل محرك الذكاء الاصطناعي المحلي...</h3>
            <p className="text-xs text-stone-300 max-w-sm leading-relaxed">نقوم بتحميل COCO-SSD وHandpose وBodyPix وOCR مفتوح المصدر لتعمل بسرعة داخل المتصفح..</p>
          </div>
        ) : cameraFailed ? (
          <div className="absolute inset-0 bg-stone-900/95 flex flex-col items-center justify-center text-white z-50 p-6 text-center gap-4">
            <CameraOff size={48} className="text-red-400" />
            <h3 className="text-lg font-black">تعذّر تشغيل الكاميرا</h3>
            <p className="text-xs text-stone-300 max-w-sm leading-relaxed">{cameraError || 'يرجى منح إذن الكاميرا للمتصفح ثم إعادة تحميل الصفحة.'}</p>
            <button onClick={() => { setCameraFailed(false); setCameraError(null); setCameraStartNonce(prev => prev + 1); }} className="px-6 py-2.5 bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white rounded-2xl text-sm font-black cursor-pointer">إعادة المحاولة</button>
          </div>
        ) : (
          /* Real Live Camera — always direct */
          <div ref={containerRef} className="absolute inset-0 w-full h-full flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {renderBoundingBoxes()}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="relative">
                <div className={`w-20 h-20 border-2 border-dashed rounded-full flex items-center justify-center transition-transform ${focusedObject ? 'border-[#8a9a5b] scale-110 rotate-12' : 'border-white/35'}`}>
                  <div className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
                {focusedObject && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="transparent" />
                        <circle cx="40" cy="40" r="34" stroke="#8a9a5b" strokeWidth="3" fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 34}`}
                          strokeDashoffset={`${2 * Math.PI * 34 * (1 - focusProgress / 100)}`}
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              {!focusedObject && (
                <div className="mt-4 flex flex-col items-center gap-2 max-w-xs text-center animate-in fade-in duration-200">
                  {lowConfidenceWarning ? (
                    <div className="bg-amber-600/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-400/40 text-white shadow-lg flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" /><span>الشيء غير واضح بدقة 🔍</span></div>
                      <p className="text-[9.5px] text-amber-100 font-bold leading-tight">يرجى تعديل الزاوية أو الاقتراب.</p>
                    </div>
                  ) : notAbleToIdentify ? (
                    <div className="bg-stone-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-stone-200 shadow-lg flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-500"><span>تعذر تحديد الكائن بدقة</span></div>
                      <p className="text-[9.5px] text-stone-400 font-bold leading-tight">يرجى وضع الشيء في حلقة التتبع عن قرب.</p>
                    </div>
                  ) : (
                    <div className="bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/5">
                      <p className="text-white text-[11px] font-semibold flex items-center gap-1">
                        <Eye size={12} className="text-[#8a9a5b]" />
                        <span>ضع الشيء على النقطة في الوسط...</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controller toolbar */}
      <div className="bg-white p-4 rounded-[28px] border border-stone-200 shadow-sm flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isOfflineModeActive && (
              <span className="bg-amber-600/10 text-amber-700 text-[10px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-amber-200/50">
                <span className="relative flex h-1.5 w-1.5 shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" /></span>
                <span>باقات الأوفلاين نشطة 🔌</span>
              </span>
            )}
            <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border ${visionBoostReady ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-50 text-stone-400 border-stone-200'}`}>أجزاء الجسم {visionBoostReady ? 'مفعّلة' : 'قيد التحميل'}</span>
            <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border ${liveOcrReady ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-stone-50 text-stone-400 border-stone-200'}`}>قراءة اللافتات {liveOcrReady ? 'مفعّلة' : 'قيد التحميل'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3.5">
            {activeViewMode === 'objects' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowDetectionSettings(s => !s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 border transition-all ${
                    showDetectionSettings
                      ? 'bg-[#8a9a5b] text-white border-[#8a9a5b] shadow-md'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <SlidersHorizontal size={13} />
                  <span>إعدادات البث</span>
                  {spokenCount > 0 && (
                    <span className="bg-amber-400 text-amber-900 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{spokenCount}</span>
                  )}
                </button>
              </>
            )}
            {activeViewMode === 'objects' && (
              <button onClick={triggerOcrScan} disabled={ocrScanning || !ocrCustomText.trim()}
                className={`px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black cursor-pointer border ${ocrScanning ? 'bg-stone-800 text-white cursor-not-allowed border-stone-900' : !ocrCustomText.trim() ? 'bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white border-[#8a9a5b]'}`}>
                {ocrScanning ? <><Loader2 className="animate-spin" size={13} /><span>جاري الترجمة...</span></> : <><Scan size={13} /><span>ترجمة النص الآن</span></>}
              </button>
            )}
          </div>
        </div>
        {/* Detection Settings Panel */}
        {activeViewMode === 'objects' && showDetectionSettings && (
          <div className="border-t border-stone-100 pt-3 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-stone-500 flex items-center gap-1.5">
                <SlidersHorizontal size={12} className="text-[#8a9a5b]" />
                إعدادات البث والتتبع
              </span>
              <button type="button" onClick={() => setShowDetectionSettings(false)} className="p-1 hover:bg-stone-100 rounded-lg text-stone-400 cursor-pointer">
                <X size={13} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Gaze filter */}
              <div className="flex items-center justify-between bg-stone-50 px-3 py-2.5 rounded-xl border border-stone-200">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-stone-700">تصفية العين</span>
                  <span className="text-[9px] text-stone-400">{glassesFilterMode === 'gaze' ? 'بث أقرب كائن للوسط فقط' : 'بث جميع الكائنات'}</span>
                </div>
                <button type="button" onClick={() => setGlassesFilterMode(glassesFilterMode === 'gaze' ? 'radar' : 'gaze')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                    glassesFilterMode === 'gaze' ? 'bg-[#8a9a5b] text-white' : 'bg-blue-500 text-white'
                  }`}>
                  {glassesFilterMode === 'gaze' ? 'Gaze 👁️' : 'Radar 📡'}
                </button>
              </div>
              {/* Audio repeat */}
              <div className="flex items-center justify-between bg-stone-50 px-3 py-2.5 rounded-xl border border-stone-200">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-stone-700">كتم المكرر</span>
                  <span className="text-[9px] text-stone-400">{audioPlayOnce ? 'لا ينطق نفس الكلمة مرتين' : 'ينطق كل مرة'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {audioPlayOnce && spokenCount > 0 && (
                    <button type="button" onClick={() => { spokenHistoryRef.current.clear(); setSpokenCount(0); }}
                      className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[9px] font-black cursor-pointer flex items-center gap-1">
                      <RotateCcw size={9} />{spokenCount}
                    </button>
                  )}
                  <button type="button" onClick={() => setAudioPlayOnce(!audioPlayOnce)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      audioPlayOnce ? 'bg-emerald-500 text-white' : 'bg-stone-300 text-stone-600'
                    }`}>
                    {audioPlayOnce ? 'مفعّل' : 'معطّل'}
                  </button>
                </div>
              </div>
              {/* Auto-focus brackets */}
              <div className="flex items-center justify-between bg-stone-50 px-3 py-2.5 rounded-xl border border-stone-200">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-stone-700">مربعات التركيز</span>
                  <span className="text-[9px] text-stone-400">إطار أركان + اهتزاز لحظة البث</span>
                </div>
                <button type="button" onClick={() => setAutoFocusEnabled(!autoFocusEnabled)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                    autoFocusEnabled ? 'bg-emerald-500 text-white' : 'bg-stone-300 text-stone-600'
                  }`}>
                  {autoFocusEnabled ? 'مفعّل 🎯' : 'معطّل'}
                </button>
              </div>
              {/* Accuracy threshold */}
              <div className="flex items-center justify-between bg-stone-50 px-3 py-2.5 rounded-xl border border-stone-200">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-stone-700">دقة البث</span>
                  <span className="text-[9px] text-stone-400">المسح موجه للنقطة الوسطى فقط</span>
                </div>
                <div className="flex items-center gap-1">
                  {[{ val: 0.50, label: 'مرنة' }, { val: 0.65, label: 'متوازنة' }, { val: 0.78, label: 'دقيقة' }].map((lvl) => (
                    <button key={lvl.val} type="button"
                      onClick={() => { setAccuracyThreshold(lvl.val); localStorage.setItem('lingolens_accuracy_threshold', lvl.val.toString()); }}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black cursor-pointer transition-all ${
                        accuracyThreshold === lvl.val ? 'bg-[#8a9a5b] text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}>
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeViewMode === 'objects' && (
          <div className="border-t border-stone-100 pt-3 flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-stone-400">مدخل النص الذكي أو النص المقروء من البث</span>
              <span className="text-[9px] text-stone-400">يفصل تلقائياً بين المجسمات والكلام الإنجليزي</span>
            </div>
            <textarea value={ocrCustomText} onChange={(e) => setOcrCustomText(e.target.value)}
              placeholder="اكتب نصاً إنجليزياً أو اترك الكاميرا تقرأ اللافتات تلقائياً..."
              className="w-full text-xs p-3 border border-stone-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#8a9a5b] bg-stone-50 text-stone-800 resize-none h-16 shadow-inner" />
          </div>
        )}
      </div>

      {/* Results panel */}
      {ocrResult ? (
        <div className="bg-white p-6 rounded-[32px] border border-stone-200 shadow-sm animate-in fade-in duration-300 text-right">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 pb-5 border-b border-stone-100">
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-[#8a9a5b] tracking-wider uppercase bg-[#8a9a5b]/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Languages size={10} className="stroke-[3]" />ترجمة معتمدة للنظارة الذكية
                </span>
                {ocrResult && <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-lg font-black flex items-center gap-1"><CheckCircle size={10} />تم التثبيت</span>}
              </div>
              <h3 className="text-xl font-black text-stone-900 mt-2">{ocrResult.title}</h3>
            </div>
            {ocrResult && (
              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button onClick={() => speakArabic(ocrResult.arabic)} className="flex-1 lg:flex-initial px-5 py-3 bg-stone-100 hover:bg-stone-200 rounded-2xl cursor-pointer flex items-center justify-center gap-2 font-bold text-xs">
                  <Volume2 size={18} className="text-[#8a9a5b]" /><span>انطق بالعربية</span>
                </button>
                <button onClick={handleSaveOcrToDictionary} disabled={savingOcrDoc}
                  className={`flex-1 lg:flex-initial px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${ocrSaved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white shadow-md'}`}>
                  {ocrSaved ? <><BookmarkCheck size={16} /><span>محفوظ</span></> : <>{savingOcrDoc ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} />}<span>حفظ بالقاموس</span></>}
                </button>
                <button onClick={() => { setOcrResult(null); setOcrCustomText(''); }} className="flex-1 lg:flex-initial px-4 py-3 bg-stone-50 hover:bg-stone-100 rounded-2xl cursor-pointer flex items-center justify-center gap-2 font-bold text-xs text-stone-500 border border-stone-200">
                  <X size={15} /><span>إخفاء الترجمة</span>
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <span className="text-[10px] font-black text-stone-400 block uppercase mb-1">المصدر بالإنجليزية:</span>
              <p className="text-sm font-semibold font-serif text-stone-800 leading-relaxed text-left" dir="ltr">{ocrResult.english}</p>
            </div>
            <div className="bg-[#8a9a5b]/5 p-4 rounded-2xl border border-[#8a9a5b]/10">
              <span className="text-[10px] font-black text-[#6a7a3b] block uppercase mb-1">الترجمة العربية:</span>
              <p className="text-sm font-extrabold text-stone-950 leading-relaxed">{ocrResult.arabic}</p>
            </div>
          </div>
          {ocrResult?.grammarTip && (
            <div className="mt-5 bg-amber-50/60 p-5 rounded-2xl border border-amber-200/50 flex flex-col gap-2">
              <span className="text-[11px] font-extrabold text-amber-800 uppercase flex items-center gap-1.5">
                <Sparkles size={12} className="fill-amber-500 text-amber-500 animate-pulse" />المعلم الذكي: تبسيط القواعد اللغوية
              </span>
              <p className="text-stone-800 font-bold text-xs leading-relaxed">{ocrResult.grammarTip}</p>
            </div>
          )}
          {ocrResult?.vocabulary && ocrResult.vocabulary.length > 0 && (
            <div className="mt-6 border-t border-stone-100 pt-5">
              <h4 className="text-sm font-black text-stone-800 mb-4 flex items-center gap-2">
                <span className="bg-[#8a9a5b] text-white text-[10px] uppercase font-bold py-0.5 px-2.5 rounded-lg">المدرب اللغوي</span>
                <span>المفردات المستخرجة:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ocrResult.vocabulary.map((vocab, wordIdx) => {
                  const isItemSaved = savedVocabWords[vocab.word];
                  return (
                    <div key={wordIdx} className="bg-stone-50/40 p-4 rounded-2xl border border-stone-200/70 hover:border-[#8a9a5b]/40 transition-all flex justify-between items-center gap-3 group">
                      <div className="flex-1 text-right flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-black text-sm text-stone-900">{vocab.word}</span>
                          <span className="text-[9px] text-stone-400 font-mono">{vocab.phonetic}</span>
                          <span className="text-[8px] font-bold bg-[#8a9a5b]/10 text-[#8a9a5b] px-1.5 py-0.5 rounded-md">{vocab.type}</span>
                        </div>
                        <p className="text-xs font-black text-stone-800 mt-1">{vocab.meaning}</p>
                        <p className="text-[10px] text-stone-400">{vocab.explanation}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => speakWord(vocab.word)} className="p-1.5 bg-white hover:bg-[#8a9a5b]/10 text-stone-500 rounded-lg cursor-pointer flex items-center justify-center border border-stone-200"><Volume2 size={13} /></button>
                        <button onClick={() => handleSaveIndividualVocab(vocab.word, vocab.meaning, vocab.phonetic, vocab.type)} disabled={isItemSaved}
                          className={`p-1.5 rounded-lg cursor-pointer flex items-center justify-center border ${isItemSaved ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-not-allowed' : 'bg-white text-stone-400 border-stone-200'}`}>
                          {isItemSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : lockedObject ? (
        <div className="bg-white p-6 rounded-[32px] border border-stone-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300 text-right">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 pb-5 border-b border-stone-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#8a9a5b]/10 rounded-2xl flex items-center justify-center text-[#8a9a5b] shrink-0 font-serif text-2xl font-black">{lockedObject.english.charAt(0)}</div>
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold text-[#8a9a5b] uppercase bg-[#8a9a5b]/10 px-2 py-0.5 rounded-lg">صنف: {lockedObject.category}</span>
                <h3 className="text-2xl font-black text-stone-900 mt-1">{lockedObject.arabic}</h3>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className="text-stone-700 font-serif text-lg font-bold">{lockedObject.english}</span>
                  <span className="text-stone-400 font-mono text-xs">{lockedObject.phonetics}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
              <button onClick={() => speakWord(lockedObject.english)} className="flex-1 lg:flex-initial px-5 py-3 bg-stone-100 hover:bg-stone-200 rounded-2xl cursor-pointer flex items-center justify-center gap-2 font-bold text-xs">
                <Volume2 size={18} className="text-[#8a9a5b]" /><span>استمع للنطق</span>
              </button>
              <button onClick={handleSaveToDictionary} disabled={savingDoc}
                className={`flex-1 lg:flex-initial px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${isSaved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white shadow-md'}`}>
                {isSaved ? <><BookmarkCheck size={16} /><span>محفوظ</span></> : <>{savingDoc ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} />}<span>حفظ بقاموسي</span></>}
              </button>
            </div>
          </div>
          <div className="mt-5 bg-[#fbfbf8] p-5 rounded-2xl border border-stone-100 flex flex-col gap-3">
            <span className="text-[10px] font-black text-stone-400 block uppercase">استخدام الكلمة في جملة:</span>
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
              <p className="text-base font-bold text-stone-900 font-serif leading-relaxed text-left flex-1" dir="ltr">"{lockedObject.exampleEn}"</p>
              <button type="button" onClick={() => speakWord(lockedObject.exampleEn)} className="p-1.5 bg-[#8a9a5b]/10 hover:bg-[#8a9a5b] text-[#5a6a3b] hover:text-white rounded-xl cursor-pointer flex items-center justify-center border border-[#8a9a5b]/20 shrink-0"><Volume2 size={16} /></button>
            </div>
            <div className="flex items-center justify-between gap-3 bg-[#8a9a5b]/4 p-3 rounded-xl border border-[#8a9a5b]/10">
              <p className="text-sm font-bold text-stone-600 leading-relaxed text-right flex-1">({lockedObject.exampleAr})</p>
              <button type="button" onClick={() => speakArabic(lockedObject.exampleAr)} className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl cursor-pointer flex items-center justify-center border border-stone-200 shrink-0"><Volume2 size={14} /></button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-[32px] border border-stone-200 shadow-sm animate-in fade-in duration-300 text-right flex flex-col items-center justify-center min-h-[160px] text-center">
          {lowConfidenceWarning ? (
            <div className="flex flex-col items-center max-w-xl">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200/50 mb-3 animate-pulse"><Scan size={22} /></div>
              <h4 className="text-amber-800 font-black text-sm mb-1">🔍 تم رصد إشارة غير واضحة</h4>
              <p className="text-xs text-stone-600 font-bold max-w-lg">مستوى دقة البث ({accuracyThreshold * 100}%) لم يستطع الجزم بهوية الشيء. قرّب الكاميرا أو حسّن الإضاءة.</p>
            </div>
          ) : notAbleToIdentify ? (
            <div className="flex flex-col items-center max-w-xl">
              <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 border border-stone-200 mb-3"><WifiOff size={22} /></div>
              <h4 className="text-stone-800 font-black text-sm mb-1">تعذر تصنيف الكائن بدقة عالية</h4>
              <p className="text-xs text-stone-500 font-bold max-w-md">يرجى توجيه الكاميرا وتصوير الشيء بزاوية أوضح.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center max-w-lg">
              <Eye size={36} className="text-[#8a9a5b] mb-3 animate-pulse" />
              <h4 className="text-stone-800 font-bold text-sm mb-1">في انتظار تركيز النظر...</h4>
              <p className="text-xs text-stone-400 leading-relaxed font-semibold">وجه عدسة الكاميرا نحو أي كائن (كوب، هاتف، كرسي) لمدة ثانية واحدة ليقوم المساعد بتقديم درسه اللغوي فوراً!</p>
            </div>
          )}
        </div>
      )}

      <footer className="flex flex-col sm:flex-row justify-between items-center px-4 py-2 gap-4">
        <div className="flex gap-6 text-stone-400">
          <div className="flex items-center gap-2"><span className="text-[10px] font-extrabold uppercase tracking-widest">الكفاءة اللغوية</span><span className="text-stone-800 font-black text-sm">مجاني بالكامل</span></div>
          <div className="h-4 w-px bg-stone-200" />
          <div className="flex items-center gap-2"><span className="text-[10px] font-extrabold uppercase tracking-widest">النطق</span><span className="font-black text-sm text-[#8a9a5b]">مفعل (Speech Synthesis)</span></div>
        </div>
        <div className="flex items-center gap-4 text-[#8a9a5b] font-medium text-xs">
          <span>افتح بث الكائنات لتتعلم مفرداتها فوراً.</span>
        </div>
      </footer>
    </div>
  );
}
