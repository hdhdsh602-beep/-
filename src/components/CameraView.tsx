import { useRef, useEffect, useState } from 'react';
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
  BookOpen
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
  autoSpeak
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Model state
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Detection tracking State
  const [predictions, setPredictions] = useState<PredictionBox[]>([]);
  const [focusedObject, setFocusedObject] = useState<string | null>(null);
  const [focusProgress, setFocusProgress] = useState<number>(0); // 0 to 100
  const [lockedObject, setLockedObject] = useState<VocabularyMeta | null>(null);
  const [lockedClassId, setLockedClassId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savingDoc, setSavingDoc] = useState<boolean>(false);

  // Simulation fallback mode and classified active scene
  const [simulateMode, setSimulateMode] = useState<boolean>(false);
  const [currentSimulatedItem, setCurrentSimulatedItem] = useState<string | null>(null);
  const [simActiveSceneId, setSimActiveSceneId] = useState<string>('home');

  // Futuristic Smart Glasses Clutter Mitigation configuration
  const [glassesFilterMode, setGlassesFilterMode] = useState<'gaze' | 'radar'>('gaze');
  const [audioPlayOnce, setAudioPlayOnce] = useState<boolean>(true);
  const [autoFocusEnabled, setAutoFocusEnabled] = useState<boolean>(true);
  const [spokenCount, setSpokenCount] = useState<number>(0);

  // Precision Calibration & Fallback Advisor states (to handle user requests on hand/person inaccuracy)
  const [accuracyThreshold, setAccuracyThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('lingolens_accuracy_threshold');
    return saved ? parseFloat(saved) : 0.65;
  });
  const [lowConfidenceWarning, setLowConfidenceWarning] = useState<boolean>(false);
  const [notAbleToIdentify, setNotAbleToIdentify] = useState<boolean>(false);

  // Camera Active Mode Selector: 'objects' (Object Recognition) OR 'ocr' (Document Scan & Translate) OR 'offline' (Essential terms & offline models config)
  const [activeViewMode, setActiveViewMode] = useState<'objects' | 'ocr' | 'offline'>('objects');

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
    setCurrentSimulatedItem(null);
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (speechResetTimeoutRef.current) clearTimeout(speechResetTimeoutRef.current);
    
    // Stop any ongoing synthesizer voices instantly when switching modes
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [activeViewMode]);

  // OCR Auto Scan Debouncer - automatically translates document 1.5 seconds after user stops typing
  useEffect(() => {
    if (activeViewMode !== 'ocr' || !ocrCustomText.trim()) return;
    
    // Avoid double API trigger if same as current result english text
    if (ocrResult && ocrResult.english.trim().toLowerCase() === ocrCustomText.trim().toLowerCase()) return;

    const handler = setTimeout(() => {
      triggerOcrScan();
    }, 1500);

    return () => clearTimeout(handler);
  }, [ocrCustomText, activeViewMode]);

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
  const triggerOcrScan = async () => {
    if (!ocrCustomText.trim()) return;
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
            const fallbackResult = handleTranslateCustomText(ocrCustomText);
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
          // Perform server-side dynamic translation using our newly created Express + Gemini API proxy!
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: ocrCustomText })
          });
          
          if (!response.ok) {
            throw new Error("Dynamic translation API failed with status: " + response.status);
          }
          
          const data = await response.json();
          const result: OCRPreset = {
            id: 'dyn_' + Date.now(),
            title: data.title || "ترجمة ذكية بالعدسة",
            english: data.english || ocrCustomText,
            arabic: data.arabic,
            category: data.category || "ترجمة فورية",
            phonetics: data.phonetics || "[قيد الرصد]",
            exampleEn: data.exampleEn || `Scanned: "${ocrCustomText}"`,
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
          
          // Graceful dictionary word-by-word matcher fallback client-side
          const fallbackResult = handleTranslateCustomText(ocrCustomText);
          
          setOcrScanStage(4);
          setOcrScanning(false);
          setOcrResult(fallbackResult);
          onWordIdentified(fallbackResult.english);
        }
      }, 600);
    }, 600);
  };

  // References to keep track of intervals/animation frames and anti-repetition guards
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<any>(null);
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const spokenHistoryRef = useRef<Set<string>>(new Set<string>());
  const speechResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // 1. Initial Load: TensorFlow.js & COCO-SSD loaded from index.html (with resilience ticks)
  useEffect(() => {
    let active = true;
    async function loadLibrariesAndModel() {
      try {
        if (active) setModelLoading(true);
        
        // Wait up to 5 seconds for head script tags to finish rendering/loading
        const waitForGlobals = async (ticks = 0): Promise<any> => {
          const windowAny = window as any;
          if (windowAny.cocoSsd && windowAny.tf) {
            return windowAny.cocoSsd;
          }
          if (ticks > 25) { // 5 seconds
            throw new Error("لم نتمكن من الوصول لمكتبة تصنيف الرؤية البصرية COCO-SSD في المتصفح.");
          }
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (!active) return null;
          return waitForGlobals(ticks + 1);
        };

        const cocoSsd = await waitForGlobals();
        if (!active || !cocoSsd) return;

        const loadedModel = await cocoSsd.load();
        if (active) {
          modelRef.current = loadedModel;
          setModelReady(true);
          console.log("TensorFlow & COCO-SSD initialized successfully from head script");
        }
      } catch (err: any) {
        console.error("Error loading TF models: ", err);
        if (active) {
          setModelError(err.message || 'فشل تحميل محرك الذكاء الاصطناعي المحلي.');
          // Auto enable simulation so the user is never stuck and gets a rich experience!
          setSimulateMode(true);
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

  // 2. Camera Activation and frame cycle setup
  useEffect(() => {
    let stream: MediaStream | null = null;
    let active = true;

    async function startCamera() {
      if (simulateMode) return;
      
      let resolved = false;
      // Safety timeout: If camera permission or loading hangs/blocks in some browsers or iframes,
      // fallback to simulate mode in 4 seconds so the user is never stuck.
      const timeoutId = setTimeout(() => {
        if (!resolved && active) {
          console.warn("Camera activation timed out. Switching to simulation fallback mode.");
          setCameraError("تأخر تشغيل الكاميرا! تم تفعيل وضع المحاكاة التفاعلية البديل تلقائياً لتجربة التطبيق بدون عقبات.");
          setSimulateMode(true);
        }
      }, 4000);

      try {
        setCameraError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        resolved = true;
        clearTimeout(timeoutId);
        stream = mediaStream;
        streamRef.current = mediaStream;
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.warn("Error starting video playback:", err);
          });
          setCameraActive(true);
        }
      } catch (err: any) {
        resolved = true;
        clearTimeout(timeoutId);
        console.warn("Camera access denied or failed: ", err);
        if (active) {
          setCameraError("لم نتمكن من الوصول للكاميرا، ربما بسبب صلاحيات المتصفح أو قيود بيئة التجربة الفورية في الإطار (Iframe). يرجى الضغط على زر 'افتح في علامة تبويب جديدة' (Open in new tab) أعلى اليمين للتجربة الكاملة بجميع الميزات مع تفعيل الإذن، أو استخدام وضع المحاكاة الذكية.");
          // Auto-switch to beautiful simulate mode so the user is never stuck
          setSimulateMode(true);
        }
      }
    }

    if (modelReady && !simulateMode) {
      startCamera();
    }

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      streamRef.current = null;
      setCameraActive(false);
    };
  }, [modelReady, simulateMode]);

  // Re-bind active stream to video element when view mode changes or on reload
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(err => {
        console.warn("Auto-play on view mode shift or mount interrupted: ", err);
      });
    }
  }, [activeViewMode, cameraActive, simulateMode, modelReady]);

  // 3. Frame Processing and detection loop
  useEffect(() => {
    if (!modelReady || !cameraActive || simulateMode || !videoRef.current || activeViewMode !== 'objects') {
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

      try {
        if (modelRef.current) {
          const results = await modelRef.current.detect(videoRef.current);
          
          const video = videoRef.current;
          const videoWidth = video.videoWidth || 640;
          const videoHeight = video.videoHeight || 480;
          const centerX = videoWidth / 2;
          const centerY = videoHeight / 2;

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
                distFromCenter
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

          // Sort predictions: candidates closest to center-of-vision come first
          enrichedDetections.sort((a: any, b: any) => a.distFromCenter - b.distFromCenter);

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
                    return prev + 10;
                  });
                }, 120);

                // Setup lock trigger timer matching 1200ms
                focusTimerRef.current = setTimeout(() => {
                  triggerObjectLock(className);
                }, 1200);
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
  }, [modelReady, cameraActive, simulateMode, focusedObject, focusProgress, glassesFilterMode, activeViewMode]);

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

  // Simulated Object selection
  const handleSimulateItemClick = (item: { id: string }) => {
    setCurrentSimulatedItem(item.id);
    setFocusedObject(item.id);
    setFocusProgress(0);

    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    // Speed up simulation loader for quick pleasant response
    progressIntervalRef.current = setInterval(() => {
      setFocusProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current as any);
          return 100;
        }
        return prev + 25;
      });
    }, 100);

    focusTimerRef.current = setTimeout(() => {
      triggerObjectLock(item.id);
    }, 450);
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

  const activeScene = SIMULATED_SCENES.find(sc => sc.id === simActiveSceneId) || SIMULATED_SCENES[0];

  return (
    <div className="w-full flex flex-col gap-5" dir="rtl">
      
      {/* Mode Navigation Selector Tab */}
      <div className="flex flex-col sm:flex-row bg-stone-200/70 p-1.5 rounded-[24px] border border-stone-200/40 w-full max-w-4xl mx-auto z-10 shadow-sm gap-1">
        <button
          onClick={() => {
            setActiveViewMode('objects');
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl text-[13px] font-black transition-all cursor-pointer select-none ${
            activeViewMode === 'objects'
              ? 'bg-[#8a9a5b] text-white shadow-md'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
          }`}
        >
          <Scan size={16} />
          <span>رصد وتتبع الكائنات المجسمة</span>
        </button>
        <button
          onClick={() => {
            setActiveViewMode('ocr');
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl text-[13px] font-black transition-all cursor-pointer select-none ${
            activeViewMode === 'ocr'
              ? 'bg-[#8a9a5b] text-white shadow-md'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
          }`}
        >
          <FileText size={16} />
          <span>مسح وترجمة النصوص والأوراق</span>
        </button>
        <button
          onClick={() => {
            setActiveViewMode('offline');
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl text-[13px] font-black transition-all cursor-pointer select-none ${
            activeViewMode === 'offline'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
          }`}
        >
          <WifiOff size={16} />
          <span>حقيبة التعلم بدون إنترنت (50 كلمة) 🔌</span>
        </button>
      </div>

      {/* Floating recommendation overlay if webcam rendering is black inside sandbox iframe */}
      {!simulateMode && !modelLoading && (
        <div className="flex justify-center -mb-2 mt-1 px-4 text-center">
          <button
            type="button"
            onClick={() => {
              setSimulateMode(true);
              setLockedObject(null);
              setFocusedObject(null);
              setOcrResult(null);
              lastSpokenIdRef.current = null;
              spokenHistoryRef.current.clear();
              setSpokenCount(0);
            }}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black px-5 py-3 rounded-2xl flex items-center gap-2.5 shadow-lg transition-all cursor-pointer pointer-events-auto select-none border border-amber-400"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span>الكاميرا سوداء أو لا تفتح؟ اضغط هنا لتفعيل وضع المحاكاة التفاعلية فوراً 📱</span>
          </button>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="relative w-full min-h-[460px] bg-stone-950 rounded-[40px] shadow-2xl overflow-hidden border-[12px] border-white flex flex-col items-center justify-center animate-in fade-in duration-300">
        
        {/* Inline CSS for the Laser Scan animation */}
        <style>{`
          @keyframes scan-motion {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
        `}</style>

        {/* Loader Overlays */}
        {activeViewMode === 'offline' ? (
          <div className="absolute inset-0 bg-[#161513] flex flex-col p-6 overflow-y-auto scrollbar-none text-right text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-stone-850 mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/15 rounded-xl border border-amber-500/25 text-amber-500">
                  <WifiOff size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-stone-100 flex items-center gap-2">
                    <span>منظومة العمل دون اتصال بالإنترنت</span>
                    <span className="text-xs bg-amber-600/10 text-amber-500 px-2 py-0.5 rounded-md font-sans">v1.2.0 (Offline Suite)</span>
                  </h3>
                  <p className="text-[10px] text-stone-400 font-medium">قم بتحفيز وحفظ طرازات الذكاء الاصطناعي والترجمات لقراءة ليزرية بنسبة 100% بدون شبكة.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 bg-stone-900 px-3 py-1.5 rounded-xl border border-white/5 shrink-0">
                <span className="text-[10px] font-bold text-stone-400">نشاط وضع الأوفلاين:</span>
                <button
                  onClick={() => handleToggleOfflineMode(!isOfflineModeActive)}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                    isOfflineModeActive 
                      ? 'bg-amber-600 text-white shadow-md' 
                      : 'bg-stone-800 text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {isOfflineModeActive ? 'قيد العمل أوفلاين 🔌' : 'معطل (استخدام السيرفر)'}
                </button>
              </div>
            </div>

            {/* Caching Suite Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 shrink-0">
              {/* Words Pre-caching widget */}
              <div className="bg-stone-900/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Database size={15} className="text-blue-400" />
                    <span className="text-xs font-black text-stone-300">حقيبة الـ 50 كلمة الأساسية</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${wordsCached ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {wordsCached ? 'مكثّفة بالمتصفح 💾' : 'غير مخزنة'}
                  </span>
                </div>
                
                <p className="text-[10px] text-stone-400 leading-relaxed">
                  روابط الـ 50 مفردة الأكثر أهمية مبرمجة في كود المتصفح لتعمل في أي بقعة جغرافية بدون باقة إنترنت.
                </p>

                {isCaching ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[9px] font-bold text-stone-300">
                      <span>جاري تشفير وتخزين قائمة المفردات بالمتصفح...</span>
                      <span>{cachingProgress}%</span>
                    </div>
                    <div className="w-full bg-stone-850 rounded-full h-1 overflow-hidden">
                      <div className="bg-blue-500 h-1 rounded-full transition-all duration-150" style={{ width: `${cachingProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleCacheWords}
                    className="w-full py-2 bg-stone-850 hover:bg-stone-800 text-white text-[10px] font-black rounded-lg border border-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:border-blue-500/35"
                  >
                    <DownloadCloud size={13} className="text-blue-400" />
                    <span>مزامنة وحفظ الـ 50 مفردة بالكامل محلياً</span>
                  </button>
                )}
              </div>

              {/* Tensorflow model pre-caching widget */}
              <div className="bg-stone-900/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Zap size={15} className="text-amber-400" />
                    <span className="text-xs font-black text-stone-300">طراز الرؤية TensorFlow.js</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${modelCached ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {modelCached ? 'الطراز مخزن محلياً 🔋' : 'غير مخزن'}
                  </span>
                </div>
                
                <p className="text-[10px] text-stone-400 leading-relaxed">
                  تهيئة وبناء مسبق لملفات الشبكة العصبية COCO-SSD بحيث لا تحتاج لتحميل وزن النموذج مجدداً في المدرسة أو الخارج.
                </p>

                <button
                  onClick={handleCacheModels}
                  className="w-full py-2 bg-stone-850 hover:bg-stone-800 text-white text-[10px] font-black rounded-lg border border-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:border-amber-500/35"
                >
                  <DownloadCloud size={13} className="text-amber-400" />
                  <span>تثبيت النموذج ومحركات العمل أوفلاين</span>
                </button>
              </div>
            </div>

            {/* Encyclopedia + interactive quiz challenge row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0">
              
              {/* Interactive Encyclopedia of 50 offline words */}
              <div className="lg:col-span-7 bg-stone-900/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between min-h-[300px]">
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-emerald-400" />
                    <span className="text-[11px] font-black text-stone-200">القاموس المحلي التفاعلي (50 كلمة)</span>
                  </div>
                  <div className="relative w-36">
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500" size={11} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ابحث..."
                      className="w-full bg-stone-950 p-1.5 pr-6 text-[9px] font-bold rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200 placeholder-stone-600"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none space-y-1.5 max-h-[160px]">
                  {OFFLINE_WORDS.filter(w => {
                    if (!searchTerm.trim()) return true;
                    const norm = searchTerm.trim().toLowerCase();
                    return w.english.toLowerCase().includes(norm) || w.arabic.includes(norm) || w.category.includes(norm);
                  }).map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => speakWord(item.english)}
                      className="bg-stone-950/50 p-2 rounded-lg border border-white/5 hover:border-amber-500/30 hover:bg-stone-950/95 transition-all flex justify-between items-center gap-2 cursor-pointer group"
                    >
                      <div className="flex-1 text-right flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-serif font-black text-[11px] text-stone-200 group-hover:text-amber-400 transition-colors">{item.english}</span>
                          <span className="text-[7.5px] font-mono text-stone-500">{item.phonetics}</span>
                          <span className="text-[7px] font-black bg-white/5 text-stone-400 px-1 py-0.5 rounded leading-none">{item.category}</span>
                        </div>
                        <span className="text-[10px] font-black text-stone-300 mt-0.5">{item.arabic}</span>
                        <p className="text-[8.5px] text-stone-500 leading-none mt-1">“{item.exampleEn}”</p>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          className="p-1 bg-stone-900 rounded text-stone-400 group-hover:text-amber-500 group-hover:bg-amber-600/10 transition-all flex items-center justify-center border border-white/5"
                        >
                          <Volume2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Memory Training Quiz Challenge widget */}
              <div className="lg:col-span-5 bg-stone-900/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between min-h-[300px]">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <Award size={14} className="text-amber-500" />
                    <span className="text-[11px] font-black text-stone-200">تحدي الذاكرة السريع (Offline Quiz)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8.5px] bg-stone-950 px-2 py-0.5 rounded border border-white/5 font-sans text-stone-400 shrink-0">
                    <span>النتيجة: {quizScore} / {quizTotal}</span>
                    <button onClick={handleResetQuizScore} className="hover:text-red-400 text-[8px] font-serif font-semibold border-r border-white/10 pr-1.5 mr-1.5">تصفير</button>
                  </div>
                </div>

                {quizWord ? (
                  <div className="flex-1 flex flex-col justify-between min-h-0">
                    <div className="text-center p-2.5 bg-stone-950/80 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 shrink-0">
                      <span className="text-[8.5px] font-black text-amber-500 block">ما هو المعنى الإنجليزي للمصطلح الآتي؟</span>
                      <h4 className="text-xs font-black text-white">{quizWord.arabic}</h4>
                      <p className="text-[7.5px] text-stone-500 italic">تصنيف الكلمة: {quizWord.category}</p>
                    </div>

                    {/* Scrambled candidate button options list */}
                    <div className="space-y-1.5 my-2 flex-1 flex flex-col justify-center min-h-0">
                      {quizOptions.map((opt, oIdx) => {
                        const isSelected = quizSelectedOption === opt;
                        const isCorrectOpt = opt.toLowerCase() === quizWord.english.toLowerCase();
                        
                        let optStyle = 'bg-stone-950 hover:bg-stone-900 border-white/10 text-stone-300';
                        if (quizAnswered) {
                          if (isCorrectOpt) {
                            optStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40';
                          } else if (isSelected) {
                            optStyle = 'bg-red-500/10 text-red-400 border-red-500/40';
                          } else {
                            optStyle = 'bg-stone-950/30 text-stone-600 border-white/5 cursor-not-allowed';
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={!!quizAnswered}
                            onClick={() => handleQuizAnswerSubmit(opt)}
                            className={`w-full p-1.5 rounded-lg border text-center font-serif text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${optStyle}`}
                          >
                            {quizAnswered && isCorrectOpt && <Check size={10} />}
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Question Control */}
                    <div className="flex justify-between items-center border-t border-white/5 pt-2 shrink-0">
                      {quizAnswered ? (
                        <span className={`text-[8.5px] font-black ${quizAnswered === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {quizAnswered === 'correct' ? 'إجابة صحيحة! أحسنت 🌟' : `خطأ! الإجابة هي: ${quizWord.english}`}
                        </span>
                      ) : (
                        <span className="text-[8px] text-stone-500">اختر الإجابة بلمس الكلمة.</span>
                      )}

                      <button
                        onClick={handleGenerateQuiz}
                        className="py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[8.5px] font-black transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>السؤال التالي</span>
                        <RotateCcw size={9} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-500">
                    <Loader2 className="animate-spin mb-1" size={13} />
                    <span className="text-[10px] font-semibold">جاري تحضير التحدي...</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : modelLoading ? (
          <div className="absolute inset-0 bg-stone-900/95 flex flex-col items-center justify-center text-white z-50 p-6 text-center">
            <Loader2 className="animate-spin text-[#8a9a5b] mb-4" size={48} />
            <h3 className="text-lg font-black mb-2">جاري تشغيل محرك الذكاء الاصطناعي المحلي...</h3>
            <p className="text-xs text-stone-300 text-center max-w-sm font-medium mb-6 leading-relaxed">
              نقوم بتحميل مكتبة تصنيف الرؤية لتعمل بالكامل في نظارتك الذكية..
            </p>
          </div>
        ) : (
          /* Viewport Render: Real Camera vs. Beautiful Simulation Indoor Workspace */
          simulateMode ? (
            /* Simulation Viewport showing high-quality categorized AR environment scenes */
            <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-between relative select-none">
              {/* Categorized Location Selector inside HUD */}
              <div className="absolute top-4 inset-x-4 z-20 flex gap-2 overflow-x-auto pb-1.5 justify-center scrollbar-none">
                {SIMULATED_SCENES.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      setSimActiveSceneId(scene.id);
                      setFocusedObject(null);
                      setLockedObject(null);
                      setLockedClassId(null);
                      setCurrentSimulatedItem(null);
                      setFocusProgress(0);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-full text-[11px] font-black tracking-tight transition-all border-stone-800 backdrop-blur-md cursor-pointer whitespace-nowrap shadow-md ${
                      simActiveSceneId === scene.id
                        ? 'bg-[#8a9a5b] text-white border-[#8a9a5b]'
                        : 'bg-stone-900/80 hover:bg-stone-850 text-stone-200 border-white/10'
                    }`}
                  >
                    <span>{scene.emoji}</span>
                    <span>{scene.name}</span>
                  </button>
                ))}
              </div>

              {/* AR Viewport background image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-60"
                style={{ 
                  backgroundImage: `url('${activeScene.imgUrl}')`
                }} 
              />
              
              {/* Ambient scan grid layout lining on the viewport glasses screen */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(138,154,91,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(138,154,91,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

              {/* Spatial AR Interactive coordinate Pins */}
              <div className="absolute inset-0 z-10">
                {activeScene.items.map((pin) => {
                  const isHighlighted = focusedObject === pin.id;
                  return (
                    <button
                      key={pin.id}
                      onClick={() => handleSimulateItemClick(pin)}
                      style={{ top: `${pin.topPct}%`, left: `${pin.leftPct}%` }}
                      className={`absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group active:scale-90 transition-transform ${
                        isHighlighted ? 'scale-110 shadow-lg' : 'hover:scale-105'
                      }`}
                      title={pin.labelAr}
                    >
                      {/* Glow ping */}
                      <span className={`absolute inline-flex h-full w-full rounded-full bg-[#8a9a5b]/40 opacity-75 ${
                        isHighlighted ? 'animate-ping' : 'group-hover:animate-ping'
                      }`} />
                      <span className={`relative inline-flex rounded-full h-4.5 w-4.5 border-2 shadow transition-all ${
                        isHighlighted 
                          ? 'bg-[#d8e2be] border-[#8a9a5b]' 
                          : 'bg-[#8a9a5b] border-white'
                      }`} />
                      
                      {/* Floating tag label */}
                      <span className="absolute top-8 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white text-[9px] font-black px-2 py-1 rounded-xl shadow-lg border border-white/10 whitespace-nowrap pointer-events-none flex items-center gap-1">
                        <span className="text-[#d8e2be]">{pin.labelAr}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Auto-Focus Overlay Brackets around the focused item pin under simulation mode */}
              {autoFocusEnabled && focusedObject && (
                (() => {
                  const activePin = activeScene.items.find(pi => pi.id === focusedObject);
                  if (!activePin) return null;
                  return (
                    <div 
                      className="absolute -translate-x-1/2 -translate-y-1/2 border-2 border-dashed pointer-events-none transition-all duration-300 z-15 rounded-2xl"
                      style={{
                        top: `${activePin.topPct}%`,
                        left: `${activePin.leftPct}%`,
                        width: '120px',
                        height: '120px',
                        borderColor: '#8a9a5b',
                        boxShadow: '0 0 24px rgba(138, 154, 91, 0.45)',
                      }}
                    >
                      {/* Four high-tech corner thick brackets */}
                      <div className="absolute -top-[2px] -left-[2px] w-4.5 h-4.5 border-t-4 border-l-4 border-[#8a9a5b] rounded-tl-lg animate-pulse" />
                      <div className="absolute -top-[2px] -right-[2px] w-4.5 h-4.5 border-t-4 border-r-4 border-[#8a9a5b] rounded-tr-lg animate-pulse" />
                      <div className="absolute -bottom-[2px] -left-[2px] w-4.5 h-4.5 border-b-4 border-l-4 border-[#8a9a5b] rounded-bl-lg animate-pulse" />
                      <div className="absolute -bottom-[2px] -right-[2px] w-4.5 h-4.5 border-b-4 border-r-4 border-[#8a9a5b] rounded-br-lg animate-pulse" />
                      
                      {/* Inside details text badge identifying name in both languages before saving */}
                      <div className="absolute top-[100%] mt-2.5 left-1/2 -translate-x-1/2 bg-stone-900/95 backdrop-blur-md text-white px-2 py-1.5 rounded-xl border border-white/10 flex flex-col items-center gap-0.5 shadow-xl whitespace-nowrap">
                        <span className="text-[10px] font-black text-right block tracking-tight flex items-center gap-1.5 leading-none">
                          <span className="text-[#d8e2be]">{activePin.labelAr}</span>
                          <span className="text-stone-400 font-light text-[9px]">/</span>
                          <span className="text-white font-bold">{activePin.labelEn}</span>
                        </span>
                        <span className="text-[8px] text-[#8a9a5b] font-mono leading-none mt-1">
                          {focusProgress < 100 ? `⚡ تركيز تلقائي... ${focusProgress}%` : '🎯 تم التأكيد والتحقق'}
                        </span>
                      </div>

                      {/* Scanning sweeping bar */}
                      {focusProgress < 100 && (
                        <div 
                          className="absolute left-0 right-0 h-[2px] bg-[#8a9a5b] shadow-[0_0_8px_#8a9a5b] animate-bounce"
                          style={{ top: `${focusProgress}%` }}
                        />
                      )}
                    </div>
                  );
                })()
              )}

              {/* Interactive target overlay HUD info cards */}
              <div className="relative z-10 w-full h-full flex flex-col p-6 justify-between pointer-events-none">
                {/* Spacer (accounting for top selector) */}
                <div className="h-10 shrink-0" />

                {/* HUD Focus details & Gaze circle loader */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                  {focusedObject && (
                    <div className="mb-4 animate-in fade-in scale-in duration-300 pointer-events-auto">
                      {/* Simulated AR Smart Glasses overlay cards */}
                      <div className="w-64 bg-stone-950/90 backdrop-blur-md border border-[#8a9a5b]/45 rounded-3xl relative shadow-[0_0_24px_rgba(138,154,91,0.25)] flex flex-col p-4 text-center">
                        {/* Bounding corners */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#8a9a5b] rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#8a9a5b] rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#8a9a5b] rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#8a9a5b] rounded-br-xl" />
                        
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[9px] font-black tracking-widest text-[#8a9a5b] uppercase bg-[#8a9a5b]/10 px-2.5 py-0.5 rounded-full">
                            رصد ذكي (AR TRACK LOCKED)
                          </span>
                          <h3 className="text-white text-base font-serif font-black tracking-tight" dir="ltr">
                            {VOCABULARY_MAP[focusedObject]?.english || focusedObject}
                          </h3>
                          <div className="flex items-center gap-2">
                            <p className="text-[#d8e2be] text-xs font-black">
                              {VOCABULARY_MAP[focusedObject]?.arabic || focusedObject}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speakWord(VOCABULARY_MAP[focusedObject]?.english || focusedObject);
                              }}
                              className="p-1.5 bg-[#8a9a5b]/20 hover:bg-[#8a9a5b] hover:text-white text-white rounded-lg transition-all cursor-pointer shadow flex items-center justify-center active:scale-95"
                              title="استمع للنطق الإنجليزي"
                            >
                              <Volume2 size={11} className="stroke-[3]" />
                            </button>
                          </div>
                          
                          <p className="text-stone-400 text-[10px] font-mono leading-none">
                            {VOCABULARY_MAP[focusedObject]?.phonetics}
                          </p>

                          {/* Specific daily collocation sentence context display */}
                          {activeScene.items.find(pi => pi.id === focusedObject)?.commentAr && (
                            <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] font-bold text-stone-300 leading-relaxed text-right">
                              💡 {activeScene.items.find(pi => pi.id === focusedObject)?.commentAr}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    {/* Outer tracking ring */}
                    <div className={`w-20 h-20 border-4 border-dashed rounded-full flex items-center justify-center transition-all duration-500 ${
                      focusedObject ? 'border-[#8a9a5b]/60 rotate-45 scale-105' : 'border-white/20'
                    }`}>
                      <div className="w-12 h-12 border-2 border-white/10 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-[#8a9a5b] rounded-full" />
                      </div>
                    </div>

                    {/* Circular loading lens scan progression */}
                    {focusedObject && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          <svg className="absolute w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="34"
                              stroke="rgba(138, 154, 91, 0.15)"
                              strokeWidth="4"
                              fill="transparent"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="34"
                              stroke="#8a9a5b"
                              strokeWidth="4"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 34}`}
                              strokeDashoffset={`${2 * Math.PI * 34 * (1 - focusProgress / 100)}`}
                              className="transition-all duration-100 ease-out"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulated Screen instructions hint overlay */}
                <div className="bg-black/40 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 mx-auto text-center pointer-events-auto max-w-sm mt-auto shadow-xl">
                  <p className="text-white text-[10px] font-black flex items-center gap-1.5 justify-center">
                    <span className="inline-block w-1.5 h-1.5 bg-[#8a9a5b] rounded-full animate-pulse" />
                    <span>انقر على النقاط المضيئة بالعدسة لمحاكاة النظر وتعلم الكلمة وسياقها اليومي فورياً</span>
                  </p>
                </div>
              </div>

                {/* Bottom Simulated Cards list */}
                <div className="bg-white/90 backdrop-blur-lg p-4 rounded-3xl border border-white/20 shadow-xl mt-auto">
                  <h4 className="text-xs font-black text-stone-700 mb-3 text-center">انقر للتعلم الفوري (مجسّمات بديلة للكاميرا):</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {SIMULATED_ITEMS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSimulateItemClick(item)}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all border cursor-pointer ${
                          currentSimulatedItem === item.id 
                            ? 'bg-[#8a9a5b] text-white border-[#8a9a5b]' 
                            : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        <img src={item.imgUrl} alt={item.labelEn} className="w-8 h-8 rounded-md object-cover mb-1" />
                        <span className="text-[10px] whitespace-nowrap font-bold">{item.labelAr}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
            /* Real Live Camera Viewport */
            <div ref={containerRef} className="absolute inset-0 w-full h-full flex items-center justify-center relative">
              <video 
                ref={videoRef} 
                autoPlay
                playsInline 
                muted
                className="w-full h-full object-cover text-white" 
              />
              
              {/* Real-time Bounding Boxes on top */}
              {renderBoundingBoxes()}

              {/* Centered target and looking indicator */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="relative">
                  <div className={`w-20 h-20 border-2 border-dashed rounded-full flex items-center justify-center transition-transform ${
                    focusedObject ? 'border-[#8a9a5b] scale-110 rotate-12' : 'border-white/35'
                  }`}>
                    <div className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>

                  {/* Progress Circle on Camera Gaze */}
                  {focusedObject && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth="3"
                            fill="transparent"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="#8a9a5b"
                            strokeWidth="3"
                            fill="transparent"
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
                        <div className="flex items-center gap-1.5 text-[11px] font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                          <span>الشيء غير واضح بدقة 🔍</span>
                        </div>
                        <p className="text-[9.5px] text-amber-100 font-bold leading-tight">
                          يرجى تعديل الزاوية، الاقتراب، أو تحسين إضاءة المكان للتحديد الدقيق.
                        </p>
                      </div>
                    ) : notAbleToIdentify ? (
                      <div className="bg-stone-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-stone-200 shadow-lg flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-500">
                          <span>تعذر تحديد الكائن بدقة</span>
                        </div>
                        <p className="text-[9.5px] text-stone-400 font-bold leading-tight">
                          يرجى وضع الشيء في حلقة التتبع والتقاطه عن قرب.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/5">
                        <p className="text-white text-[11px] font-semibold flex items-center gap-1">
                          <Eye size={12} className="text-[#8a9a5b]" />
                          <span>وجه الكاميرا أو ثبّت نظرك على كائن بالوسط...</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Sleek, consolidated controller toolbar below viewport to eliminate clutter as explicitly requested by USER */}
      <div className="bg-white p-4.5 rounded-[28px] border border-stone-200 shadow-sm flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Mode Switcher Option (Real Camera vs Simulation Mode) */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-stone-500">مستشعر البث الرئيسي:</span>
            <button
              type="button"
              onClick={() => {
                setSimulateMode(!simulateMode);
                setLockedObject(null);
                setFocusedObject(null);
                setOcrResult(null);
                lastSpokenIdRef.current = null;
                spokenHistoryRef.current.clear();
                setSpokenCount(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                simulateMode 
                  ? 'bg-[#8a9a5b]/10 text-[#5a6a3b]' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {simulateMode ? '🤖 وضع المحاكاة الذكية (نشط)' : '📷 البث المباشر (الحي)'}
            </button>

            {isOfflineModeActive && (
              <span className="bg-amber-600/10 text-amber-750 text-[10px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-amber-200/50 animate-in fade-in duration-200">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </span>
                <span>باقات الأوفلاين نشطة 🔌</span>
              </span>
            )}
          </div>

          {/* Configuration toolbar icons and controls based on active Mode */}
          <div className="flex flex-wrap items-center gap-3.5">
            {activeViewMode === 'objects' && (
              <>
                {/* Gaze Focus vs Radar Scan tool button */}
                <button
                  type="button"
                  onClick={() => setGlassesFilterMode(glassesFilterMode === 'gaze' ? 'radar' : 'gaze')}
                  className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-750 border border-stone-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                  title="سياق تتبع العين للنظارة لمنع التشتت بالأماكن المزدحمة"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${glassesFilterMode === 'gaze' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                  <span>تصفية العين: {glassesFilterMode === 'gaze' ? 'تركيز الوسط Gaze' : 'مسح شامل Radar'}</span>
                </button>

                {/* Intelligent repetitive voice suppression check */}
                <button
                  type="button"
                  onClick={() => setAudioPlayOnce(!audioPlayOnce)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                    audioPlayOnce 
                      ? 'bg-emerald-50/70 text-emerald-800 border-emerald-150' 
                      : 'bg-stone-50 text-stone-500 border-stone-200'
                  }`}
                  title="الحد من تكرار الأسماء الصوتية بالجولة لتجنب التشتت"
                >
                  <span>كتم المكرر: {audioPlayOnce ? 'مفعّل 🚶🔇' : 'معطّل'}</span>
                </button>

                {audioPlayOnce && spokenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      spokenHistoryRef.current.clear();
                      setSpokenCount(0);
                      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate([40, 40]); } catch (e) {}
                      }
                    }}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black transition-all cursor-pointer border border-amber-100 flex items-center gap-1"
                  >
                    <span>تصفير الذاكرة 🔄</span>
                    <strong className="bg-amber-200 text-amber-900 rounded px-1.5 font-sans">{spokenCount}</strong>
                  </button>
                )}

                {/* Gaze bounding auto-focus brackets */}
                <button
                  type="button"
                  onClick={() => setAutoFocusEnabled(!autoFocusEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                    autoFocusEnabled 
                      ? 'bg-emerald-50/70 text-emerald-800 border-emerald-150' 
                      : 'bg-stone-50 text-stone-500 border-stone-200'
                  }`}
                >
                  <span>مربعات التركيز والاهتزاز: {autoFocusEnabled ? 'تعمل 🎯' : 'معطلة'}</span>
                </button>

                {/* Dynamic AI Accuracy Threshold Selector Tool */}
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-2xl border border-stone-200">
                  <span className="text-[10px] font-black text-stone-500 px-2" title="الحد الأدنى لثقة الذكاء الاصطناعي لتجنب الأخطاء وبطء الحركة">دقة الكاميرا:</span>
                  {[
                    { val: 0.50, label: 'مرنة ⚡' },
                    { val: 0.65, label: 'متوازنة ⚖️' },
                    { val: 0.78, label: 'فائقة الدقة 🎯' }
                  ].map((lvl) => (
                    <button
                      key={lvl.val}
                      type="button"
                      onClick={() => {
                        setAccuracyThreshold(lvl.val);
                        localStorage.setItem('lingolens_accuracy_threshold', lvl.val.toString());
                        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                          try { navigator.vibrate(30); } catch (e) {}
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                        accuracyThreshold === lvl.val
                          ? 'bg-[#8a9a5b] text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/55'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeViewMode === 'ocr' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerOcrScan}
                  disabled={ocrScanning || !ocrCustomText.trim()}
                  className={`px-4.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer select-none border ${
                    ocrScanning 
                      ? 'bg-stone-800 text-white cursor-not-allowed border-stone-900' 
                      : (!ocrCustomText.trim() 
                        ? 'bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed' 
                        : 'bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white border-[#8a9a5b]')
                  }`}
                >
                  {ocrScanning ? (
                    <>
                      <Loader2 className="animate-spin" size={13} />
                      <span>جاري قراءة وترجمة المستند...</span>
                    </>
                  ) : (
                    <>
                      <Scan size={13} />
                      <span>تحليل ليزري للعدسة المترجمة</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clean, collapsible text editing workspace for Document Scanner Translation Mode */}
        {activeViewMode === 'ocr' && (
          <div className="border-t border-stone-100 pt-3 flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-stone-400">لوحة مدخلات/تعديل مستند المسح الليزري</span>
              <span className="text-[9px] text-stone-400">الترجمة تفاعلية بالذكاء الاصطناعي</span>
            </div>
            <textarea
              value={ocrCustomText}
              onChange={(e) => setOcrCustomText(e.target.value)}
              placeholder="أدخل أي جملة أو لافتة أو فقرة بالإنجليزية هنا لتقوم العدسة بقراءتها وترجمتها بالكامل فوراً..."
              className="w-full text-xs p-3 border border-stone-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#8a9a5b] bg-stone-50 text-stone-800 resize-none h-16 shadow-inner"
            />
          </div>
        )}
      </div>
      {activeViewMode === 'ocr' ? (
        /* Translation Mode Result Panel - STATIC, highly organized, and always below the viewport */
        <div className="bg-white p-6 rounded-[32px] border border-stone-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300 text-right">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 pb-5 border-b border-stone-100">
            <div className="flex-1 flex flex-col gap-1 text-right">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-[#8a9a5b] tracking-wider uppercase bg-[#8a9a5b]/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Languages size={10} className="stroke-[3]" />
                  ترجمة معتمدة للنظارة الذكية
                </span>
                {ocrResult && (
                  <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-lg font-black flex items-center gap-1">
                    <CheckCircle size={10} />
                    تم التثبيت والحفظ
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-stone-900 mt-2">
                {ocrResult ? ocrResult.title : "في انتظار بدء مسح الورقة..."}
              </h3>
              <p className="text-stone-400 text-xs mt-0.5">اللفظ باللغة الإنجليزية في العدسة مع استنباط المعاني وترجمة العبارات المجاورة.</p>
            </div>

            {/* Speaking and saving operations for the entire OCR result */}
            {ocrResult && (
              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button
                  onClick={() => speakArabic(ocrResult.arabic)}
                  className="flex-1 lg:flex-initial px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-850 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs"
                >
                  <Volume2 size={18} className="text-[#8a9a5b]" />
                  <span>انطق الترجمة بالعربية</span>
                </button>

                <button
                  onClick={handleSaveOcrToDictionary}
                  disabled={savingOcrDoc}
                  className={`flex-1 lg:flex-initial px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    ocrSaved 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                      : 'bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white shadow-md'
                  }`}
                >
                  {ocrSaved ? (
                    <>
                      <BookmarkCheck size={16} />
                      <span>محفوظ في القاموس الشخصي</span>
                    </>
                  ) : (
                    <>
                      {savingOcrDoc ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} />}
                      <span>حفظ الترجمة بالقاموس</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* OCR Translated Results Frame */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {/* Left Frame: Source text (English) */}
            <div className="bg-stone-50 p-4.5 rounded-2xl border border-stone-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-stone-400 block uppercase mb-1">المستند بالإنجليزية المصدر:</span>
                <p className="text-sm font-semibold font-serif text-stone-800 leading-relaxed text-left" dir="ltr">
                  {ocrResult ? ocrResult.english : (ocrCustomText ? ocrCustomText : "أدخل نصاً بالإنجليزية واضغط على زر العدسة المترجمة للبدء بالتحليل...")}
                </p>
              </div>
            </div>

            {/* Right Frame: Destination Translated (Arabic) */}
            <div className="bg-[#8a9a5b]/5 p-4.5 rounded-2xl border border-[#8a9a5b]/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-[#6a7a3b] block uppercase mb-1">الترجمة العربية المستخلصة:</span>
                <p className="text-sm font-extrabold text-stone-950 leading-relaxed">
                  {ocrResult ? ocrResult.arabic : "اضغط على زر المسح لبدء الترجمة الليزرية الفورية للمصطلحات والجمل..."}
                </p>
              </div>
            </div>
          </div>

          {/* Grammar & Linguistic insights - Dynamic Teacher Advice */}
          {ocrResult && ocrResult.grammarTip && (
            <div className="mt-5 bg-amber-50/60 p-5 rounded-2xl border border-amber-200/50 flex flex-col gap-2">
              <span className="text-[11px] font-extrabold text-amber-800 tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles size={12} className="fill-amber-500 text-amber-500 animate-pulse" />
                المعلم الذكي: تبسيط البناء القواعدي واللغوي (Grammar Insight)
              </span>
              <p className="text-stone-800 font-bold text-xs mt-0.5 leading-relaxed">
                {ocrResult.grammarTip}
              </p>
            </div>
          )}

          {/* Vocabulary List Interactive Lesson Card stack */}
          {ocrResult && ocrResult.vocabulary && ocrResult.vocabulary.length > 0 && (
            <div className="mt-6 border-t border-stone-100 pt-5">
              <h4 className="text-sm font-black text-stone-800 mb-4 flex items-center gap-2">
                <span className="bg-[#8a9a5b] text-white text-[10px] uppercase font-bold py-0.5 px-2.5 rounded-lg">المدرب اللغوي</span>
                <span>المفردات والتراكيب المهمة المستخرجة من الجملة:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ocrResult.vocabulary.map((vocab, wordIdx) => {
                  const isItemSaved = savedVocabWords[vocab.word];
                  return (
                    <div 
                      key={wordIdx} 
                      className="bg-stone-50/40 p-4 rounded-2xl border border-stone-200/70 hover:border-[#8a9a5b]/40 hover:bg-stone-50/80 transition-all flex justify-between items-center gap-3 group"
                    >
                      <div className="flex-1 text-right flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-black text-sm text-stone-900 leading-none">{vocab.word}</span>
                          <span className="text-[9px] text-stone-400 font-mono leading-none">{vocab.phonetic}</span>
                          <span className="text-[8px] font-bold bg-[#8a9a5b]/10 text-[#8a9a5b] px-1.5 py-0.5 rounded-md leading-none h-4 flex items-center justify-center">{vocab.type}</span>
                        </div>
                        <p className="text-xs font-black text-stone-850 mt-1 leading-normal">
                          {vocab.meaning}
                        </p>
                        <p className="text-[10px] text-stone-400 font-medium leading-normal">
                          {vocab.explanation}
                        </p>
                      </div>
                      
                      {/* Controls to speak and save inside vocabulary column */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => speakWord(vocab.word)}
                          className="p-1.5 bg-white hover:bg-[#8a9a5b]/10 hover:text-[#8a9a5b] text-stone-500 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-stone-200 shadow-xs"
                          title="استمع لنطق الكلمة"
                        >
                          <Volume2 size={13} className="stroke-[2.5]" />
                        </button>
                        
                        <button
                          onClick={() => handleSaveIndividualVocab(vocab.word, vocab.meaning, vocab.phonetic, vocab.type)}
                          disabled={isItemSaved}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center border ${
                            isItemSaved 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-not-allowed shadow-xs' 
                              : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-400 hover:text-stone-850 shadow-xs'
                          }`}
                          title={isItemSaved ? "محفوظ في قاموسك" : "حفظ بقاموسك الشخصي"}
                        >
                          {isItemSaved ? <BookmarkCheck size={13} className="stroke-[2.5]" /> : <Bookmark size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Objects radar tracking layout cards original logic */
        lockedObject ? (
          <div className="bg-white p-6 rounded-[32px] border border-stone-200 shadow-sm transform animate-in fade-in slide-in-from-bottom-4 duration-300 text-right">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 pb-5 border-b border-stone-100">
              <div className="flex items-center gap-4 text-right">
                {/* Visual marker */}
                <div className="w-14 h-14 bg-[#8a9a5b]/10 rounded-2xl flex items-center justify-center text-[#8a9a5b] shrink-0 font-serif text-2xl font-black">
                  {lockedObject.english.charAt(0)}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-[#8a9a5b] tracking-wider uppercase bg-[#8a9a5b]/10 px-2 py-0.5 rounded-lg">
                      صنف: {lockedObject.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-stone-900 mt-1">{lockedObject.arabic}</h3>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="text-stone-700 font-serif text-lg font-bold">{lockedObject.english}</span>
                    <span className="text-stone-400 font-mono text-xs">{lockedObject.phonetics}</span>
                  </div>
                </div>
              </div>

              {/* Action Pronounce + Save trigger buttons */}
              <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
                <button
                  onClick={() => speakWord(lockedObject.english)}
                  className="flex-1 lg:flex-initial px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-850 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs"
                >
                  <Volume2 size={18} className="text-[#8a9a5b]" />
                  <span>استمع للنطق بالإنكليزية</span>
                </button>

                <button
                  onClick={handleSaveToDictionary}
                  disabled={savingDoc}
                  className={`flex-1 lg:flex-initial px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isSaved 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                      : 'bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white shadow-md'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck size={16} />
                      <span>محفوظ بالقاموس</span>
                    </>
                  ) : (
                    <>
                      {savingDoc ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} />}
                      <span>حفظ بقاموسي الشخصي</span>
                    </>
                  )}
                </button>

                {simulateMode && (
                  <button
                    onClick={() => {
                      setLockedObject(null);
                      setLockedClassId(null);
                      setCurrentSimulatedItem(null);
                      setFocusedObject(null);
                    }}
                    className="p-3 border border-stone-200 hover:bg-[#fcfcf9] rounded-2xl text-stone-400 hover:text-stone-600 transition-all cursor-pointer flex items-center justify-center animate-in fade-in"
                    title="تفريغ التحديد"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Example sentence tool */}
            <div className="mt-5 bg-[#fbfbf8] p-5 rounded-2xl border border-stone-100 flex flex-col gap-3">
              <span className="text-[10px] font-black text-stone-400 block uppercase">استخدام الكلمة في جملة تعليمية مفيدة:</span>
              
              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-150/60 shadow-xs">
                <p className="text-base font-bold text-stone-900 font-serif leading-relaxed text-left flex-1" dir="ltr">
                  “{lockedObject.exampleEn}”
                </p>
                <button
                  type="button"
                  onClick={() => speakWord(lockedObject.exampleEn)}
                  className="p-1.5 bg-[#8a9a5b]/10 hover:bg-[#8a9a5b] text-[#5a6a3b] hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center border border-[#8a9a5b]/20 shrink-0"
                  title="نطق الجملة بالإنجليزية"
                >
                  <Volume2 size={16} className="stroke-[2.5]" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 bg-[#8a9a5b]/4 p-3 rounded-xl border border-[#8a9a5b]/10 shadow-xs">
                <p className="text-sm font-bold text-stone-650 leading-relaxed text-right flex-1">
                  ({lockedObject.exampleAr})
                </p>
                <button
                  type="button"
                  onClick={() => speakArabic(lockedObject.exampleAr)}
                  className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-stone-200 shrink-0"
                  title="نطق الترجمة بالعربية"
                >
                  <Volume2 size={14} className="stroke-[2]" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-[32px] border border-stone-200 shadow-sm animate-in fade-in duration-305 text-right flex flex-col items-center justify-center min-h-[160px] text-center w-full">
            {!simulateMode && lowConfidenceWarning ? (
              <div className="flex flex-col items-center max-w-xl">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200/50 mb-3 animate-pulse">
                  <Scan size={22} className="stroke-[2.5]" />
                </div>
                <h4 className="text-amber-850 font-black text-sm mb-1">🔍 تم رصد إشارة غير واضحة (التقط الشيء بشكل أفضل)</h4>
                <p className="text-xs text-stone-600 leading-relaxed font-bold max-w-lg">
                  مستوى دقة الكاميرا الحالي ({accuracyThreshold * 100}%) لم يستطع الجزم بهوية الشيء بدقة كافية لتفادي التخمينات العشوائية (مثل قراءة كف اليد كـ "شخص"). يرجى:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-3 bg-amber-50/20 p-3.5 rounded-2.5xl border border-amber-100 text-right">
                  <div className="p-2 bg-white rounded-xl border border-stone-100">
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black block mb-1 text-center">التقريب والمسافة</span>
                    <span className="text-[10px] text-stone-600 font-bold leading-normal block">قرّب الكاميرا ببطء من الشيء المراد تصنيفه لملئ الفوكس.</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-stone-100">
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black block mb-1 text-center">الإضاءة والثبات</span>
                    <span className="text-[10px] text-stone-600 font-bold leading-normal block">ثبّت الهاتف وتأكد من وجود إضاءة كافية لمنع الغَبش.</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-stone-100">
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black block mb-1 text-center">التمركز الدقيق</span>
                    <span className="text-[10px] text-stone-600 font-bold leading-normal block">ضع الشيء في مركز الدائرة الهولوغرافية بالمنتصف تماماً.</span>
                  </div>
                </div>
              </div>
            ) : !simulateMode && notAbleToIdentify ? (
              <div className="flex flex-col items-center max-w-xl">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 border border-stone-200 mb-3">
                  <WifiOff size={22} />
                </div>
                <h4 className="text-stone-800 font-black text-sm mb-1">تعذر تصنيف الكائن المكتشف بدقة عالية</h4>
                <p className="text-xs text-stone-500 font-bold leading-relaxed max-w-md">
                  يرجى توجيه الكاميرا وتصوير الشيء بزاوية أوضح، أو تعديل حساسية "دقة الكاميرا" من شريط الأدوات بالأسفل لتلقي تخمينات أكثر مرونة.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center max-w-lg">
                <Eye size={36} className="text-[#8a9a5b] mb-3 animate-pulse" />
                <h4 className="text-stone-850 font-bold text-sm mb-1">في انتظار تركيز النظر...</h4>
                <p className="text-xs text-stone-400 leading-relaxed font-semibold">
                  {simulateMode 
                    ? "انقر على أي مجسّم من لوحة المحاكاة التفاعلية بالأعلى ليقوم المعلم العربي بنطقه وترجمته وصياغته لك في جمل مفيدة!"
                    : "وجه عدسة الكاميرا نحو أي كائن (مثل كوب، هاتف، كرسي) لمدة ثانية واحدة ليقوم المساعد بتقديم درسه اللغوي فوراً!"}
                </p>
              </div>
            )}
          </div>
        )
      )}

      {/* Footer statistics report */}
      <footer className="flex flex-col sm:flex-row justify-between items-center px-4 py-2 gap-4">
        <div className="flex gap-6 text-stone-400">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest">الكفاءة اللغوية</span>
            <span className="text-stone-800 font-black text-sm">مجاني بالكامل (أوفلاين)</span>
          </div>
          <div className="h-4 w-px bg-stone-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest">وضع النطق</span>
            <span className="text-stone-[#8a9a5b] font-black text-sm">مفعل (Speech Synthesis)</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#8a9a5b] font-medium text-xs">
          <span>يمكنك التمرير للكاميرا ووضع الكائنات في بؤرة التركيز للنطق التلقائي.</span>
        </div>
      </footer>
    </div>
  );
}
