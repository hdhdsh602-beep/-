import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Check, 
  Loader2, 
  Bookmark, 
  ArrowLeftRight, 
  RotateCcw, 
  Info, 
  TrendingUp,
  Award,
  Users,
  Trash2,
  HelpCircle,
  MessageCircle,
  Calendar,
  Plane,
  Utensils,
  Building,
  Briefcase,
  Car,
  Sliders,
  Settings,
  Star,
  Copy
} from 'lucide-react';
import { 
  saveWord,
  saveConversationHistoryMessage,
  getConversationHistoryMessages,
  clearConversationHistory
} from '../lib/firebaseService';

interface ScenarioMessage {
  id: string;
  sender: 'coach' | 'student';
  textEn: string;
  textAr: string;
  feedback?: string;
  pronunciation?: string;
  timestamp: string;
}

interface ScenarioConfig {
  id: string;
  title: string;
  desc: string;
  initEn: string;
  initAr: string;
  hint: string;
  iconName: 'plane' | 'utensils' | 'hotel' | 'interview' | 'car';
}

const SCENARIOS: Record<string, ScenarioConfig> = {
  airport: {
    id: 'airport',
    title: 'إنهاء إجراءات السفر في المطار الدولي (International Airport)',
    desc: 'تدرب على استعراض جواز السفر وحجز وتجهيز الأمتعة وتسليم الحقائب مع موظف قسم التذاكر بالمكتب الرئيسي.',
    initEn: 'Hello, passport and boarding ticket please. Are you checking any bags today?',
    initAr: 'مرحباً، جواز السفر وتذكرة صعود الطائرة من فضلك. هل تود شحن أي حقائب اليوم؟',
    hint: 'جرب أن تجيب بـ: Yes, I am checking one bag and I have a carry-on.',
    iconName: 'plane'
  },
  restaurant: {
    id: 'restaurant',
    title: 'طلب وجبات ومشروبات المطعم الرفيع (Fine Dining Restaurant)',
    desc: 'تحدّث مع النادل لتجربة حجز وجبات خاصة، وطلب توصية طبق اليوم والاستفسار عن المشروبات المتاحة.',
    initEn: 'Good evening, welcome to the Chef Bistro. May I start you off with some drinks or appetisers?',
    initAr: 'مساء الخير، أهلاً بك في بيسترو الشيف. هل تحب أن نبدأ ببعض المشروبات أو المقبلات؟',
    hint: 'جرب أن تجيب بـ: Yes, I would like a bottle of mineral water and garlic bread please.',
    iconName: 'utensils'
  },
  hotel: {
    id: 'hotel',
    title: 'تسجيل الدخول وطلب الخدمات بالفندق (Hotel Reception Desk)',
    desc: 'تدرب على حجز وتأكيد خيار غرف تطل على البحر، والتحقق من مواعيد الإفطار المجاني والصالة الرياضية.',
    initEn: 'Welcome to our premium resort! I can see your reservation under your name. Could we confirm the room preference?',
    initAr: 'أهلاً بك في منتجعنا الفاخر! أرى حجزك مسجلاً لدينا بالفعل. هل يمكننا تأكيد خيار غرفتك المفضلة؟',
    hint: 'جرب أن تجيب بـ: Yes, I prefer a quiet non-smoking room with a beautiful sea view.',
    iconName: 'hotel'
  },
  interview: {
    id: 'interview',
    title: 'مقابلة توظيف تفاعلية (Interactive Job Interview)',
    desc: 'اختبر جودة صياغتك ونطقك عند الإجابة على المسؤول عن التوظيف بخصوص مهاراتك وسابق خبراتك وتطلعاتك المهنية.',
    initEn: "Thanks for coming in today. To start off, could you tell me a little bit about yourself and your key strengths?",
    initAr: 'شكراً لحضورك المقابلة اليوم. للبدء، هل يمكنك إخباري بقليل عن نفسك وأبرز نقاط قوتك؟',
    hint: 'جرب أن تجيب بـ: I am a passionate language student with background experience in customer coordination.',
    iconName: 'interview'
  },
  taxi: {
    id: 'taxi',
    title: 'مخاطبة سائق تاكسي وتحديد الوجهة (Taxi & Transport Ride)',
    desc: 'توجيه السائق ومناقشة الطرق السريعة والأجرة التقديرية باللغة الإنجليزية الحية لضمان سلامة وسهولة تنقلك.',
    initEn: "Hop in! Where can I take you today? I hope you don't mind taking the highway, it's faster.",
    initAr: 'تفضل بالركوب! إلى أين نتوجه اليوم؟ أرجو ألا مانع لديك من سلك الطريق السريع، فهو أسرع.',
    hint: 'جرب أن تجيب بـ: Please take me to the British Museum. How much is the estimated fare?',
    iconName: 'car'
  }
};

const SIMULATED_LECTURE_TOPICS = [
  {
    id: "tech_ai",
    title: "مؤتمر تقني: مستقبل الذكاء الاصطناعي الفوري (AI & Future of Society)",
    sentences: [
      "Welcome to this lecture. Today we are exploring artificial intelligence.",
      "Machine learning models can now recognize complex patterns in massive datasets.",
      "In the near future, smart glasses will overlay voice translation in real time.",
      "This technology bridges the gap between different cultures and languages globally.",
      "Thank you for attending. Remember to complete the dictionary exercise tonight."
    ]
  },
  {
    id: "business_hr",
    title: "محاضرة إدارة الأعمال: ريادة المشاريع (Business Leadership & Strategy)",
    sentences: [
      "Good morning team. Let's align on our quarterly growth objectives.",
      "Active listening is the cornerstone of effective management in business.",
      "We must adapt our strategies to meet the changing habits of our customers.",
      "Collaboration across standard departments drives significant product innovation.",
      "Our upcoming product launch represents a massive milestone for this company."
    ]
  },
  {
    id: "daily_sightseeing",
    title: "إرشاد حقل سياحي وتراثي: جولة في لندن (Cultural Tourism & Sightseeing)",
    sentences: [
      "On your right, you can see the gorgeous historic clock tower.",
      "The British Museum holds some of the most ancient artifacts in human history.",
      "Please keep your entry ticket ready before boarding the open double-decker bus.",
      "Locals here prefer drinking warm black tea during cold rainy afternoons.",
      "Enjoy the dynamic city vibes and feel free to take pictures at any spot."
    ]
  }
];

const DEFAULT_LOCAL_DICTIONARY: Record<string, { ar: string; en: string; phonetics: string; category: string; grammarTip?: string }> = {
  "hello": { ar: "مرحباً / أهلاً", en: "hello", phonetics: "[həˈloʊ]", category: "التحيات اليومية", grammarTip: "تُستخدم كتحية رئيسية وغير رسمية للترحيب بأي شخص في أي وقت." },
  "how are you": { ar: "كيف حالك اليوم؟", en: "how are you", phonetics: "[haʊ ɑːr juː]", category: "محادثة عامة", grammarTip: "سؤال كلاسيكي لبدء المحادثات الودية والمهنية." },
  "welcome": { ar: "أهلاً وسهلاً بك", en: "welcome", phonetics: "[ˈwɛlkəm]", category: "الترحيب", grammarTip: "تُقال عند استقبال الضيوف أو العملاء في المكاتب والمطاعم." },
  "thank you": { ar: "شكرًا جزيلًا لك", en: "thank you", phonetics: "[θæŋk juː]", category: "الامتنان", grammarTip: "أسلوب مهذب للتعبير عن التقدير والامتنان للآخرين." },
  "good morning": { ar: "صباح الخير", en: "good morning", phonetics: "[ɡʊd ˈmɔːnɪŋ]", category: "التحيات اليومية" },
  "good afternoon": { ar: "طاب يومك (بعد الظهر)", en: "good afternoon", phonetics: "[ɡʊd ˌɑːftəˈnuːn]", category: "التحيات اليومية" },
  "good evening": { ar: "مساء الخير", en: "good evening", phonetics: "[ɡʊd ˈiːvnɪŋ]", category: "التحيات اليومية" },
  "goodby": { ar: "مع السلامة / وداعًا", en: "goodby", phonetics: "[ˌɡʊdˈbaɪ]", category: "التحيات اليومية" },
  "goodbye": { ar: "مع السلامة / وداعًا", en: "goodbye", phonetics: "[ˌɡʊdˈbaɪ]", category: "التحيات اليومية" },
  "please": { ar: "من فضلك / رجاءً", en: "please", phonetics: "[pliːz]", category: "التعامل المؤدب" },
  "excuse me": { ar: "معذرةً / بعد إذنك", en: "excuse me", phonetics: "[ɪkˈskjuːz miː]", category: "التعامل المؤدب", grammarTip: "تُستخدم لجذب الانتباه بلطف قبل طرح الأسئلة." },
  "sorry": { ar: "أنا آسف للغاية", en: "sorry", phonetics: "[ˈsɒri]", category: "الاعتذار" },
  "yes": { ar: "نعم / بالتأكيد", en: "yes", phonetics: "[jɛs]", category: "تعبيرات أساسية" },
  "no": { ar: "لا / مطلقاً", en: "no", phonetics: "[noʊ]", category: "تعبيرات أساسية" },
  "can you help me": { ar: "هل يمكنك مساعدتي؟", en: "can you help me", phonetics: "[kæn juː hɛlp miː]", category: "المساعدة الطارئة" },
  "how much is this": { ar: "بكم سعر هذا الشيء؟", en: "how much is this", phonetics: "[haʊ mʌtʃ ɪz ðɪs]", category: "التسوق والمعاملات" },
  "where is the bathroom": { ar: "أين يقع الحمام؟", en: "where is the bathroom", phonetics: "[wɛər ɪz ðə ˈbɑːθruːm]", category: "أسئلة شائعة" },
  "do you speak arabic": { ar: "هل تتحدث اللغة العربية؟", en: "do you speak arabic", phonetics: "[duː juː spiːk ˈærəbɪk]", category: "التواصل اللغوي" },
  "i am in a job interview": { ar: "أنا في مقابلة عمل تجريبية", en: "i am in a job interview", phonetics: "[aɪ æm ɪn ə dʒɒb ˈɪntəvjuː]", category: "المقابلات والوظائف" },
  "tell me about yourself": { ar: "أخبرني نبذة عن شخصك وسيرتك", en: "tell me about yourself", phonetics: "[tɛl miː əˈbaʊt jɔːˈsɛlf]", category: "المقابلات والوظائف", grammarTip: "أشهر سؤال افتتاحي لتقييم ثقتك وقدرتك على التلخيص." },
  "what are your strengths": { ar: "ما هي نقاط قوتك البارزة؟", en: "what are your strengths", phonetics: "[wɒt ɑːr jɔːr strɛŋθs]", category: "المقابلات والوظائف" },
  "why should we hire you": { ar: "لماذا يجب علينا توظيف مهاراتك؟", en: "why should we hire you", phonetics: "[waɪ ʃʊd wiː ˈhaɪər juː]", category: "المقابلات والوظائف" },
  "my strengths include team work and problem solving": { ar: "نقاط قوتي تتضمن العمل الجماعي كفريق وحل المشكلات المعقدة", en: "my strengths include team work and problem solving", phonetics: "[maɪ strɛŋθs ɪnˈkluːd tiːm wɜːk ænd ˈprɒbləm ˌsɒlvɪŋ]", category: "المقابلات والوظائف" },
  "i have strong communication skills": { ar: "أتمتع بمهارات تواصل واستماع ممتازة جداً", en: "i have strong communication skills", phonetics: "[aɪ hæv strɒŋ kəˈmjuːnɪˈkeɪʃn skɪlz]", category: "المقابلات والوظائف" },
  "artificial intelligence": { ar: "الذكاء الاصطناعي الفائق", en: "artificial intelligence", phonetics: "[ˌɑːtɪˈfɪʃl ɪnˈtɛlɪdʒəns]", category: "المصطلحات التقنية" },
  "machine learning": { ar: "تقنية تعلّم الآلة الذاتي", en: "machine learning", phonetics: "[məˈʃiːn ˈlɜːnɪŋ]", category: "المصطلحات التقنية" },
  "software developer": { ar: "مبرمج ومطور برمجيات", en: "software developer", phonetics: "[ˈsɒftweər dɪˈvɛləpər]", category: "الوظائف والمهن" },
  "project manager": { ar: "مدير تخطيط المشاريع", en: "project manager", phonetics: "[ˈprɒdʒɛkt ˈmænɪdʒər]", category: "الوظائف والمهن" },
  "active listening": { ar: "الاصغاء المعرفي والإنصات الفعال للعميل", en: "active listening", phonetics: "[ˈæktɪv ˈlɪsnɪŋ]", category: "المهارات القيادية" },
  "collaboration": { ar: "التعاون البنّاء والعمل التشاركي", en: "collaboration", phonetics: "[kəˌlæbəˈreɪʃn]", category: "المهارات القيادية" },
  "growth objectives": { ar: "أهداف التطوير والنمو الربع سنوية", en: "growth objectives", phonetics: "[ɡroʊθ əbˈdʒɛktɪvz]", category: "إدارة الأعمال" },
  "product launch": { ar: "إطلاق المنتج المصمم حديثاً في الأسواق", en: "product launch", phonetics: "[ˈprɒdʌkt lɔːntʃ]", category: "إدارة الأعمال" },
  "smart glasses": { ar: "النظارات الذكية المعززة للرؤية والترجمة", en: "smart glasses", phonetics: "[smɑːt ˈɡlɑːsɪz]", category: "الأجهزة التقنية" },
  "real time translation": { ar: "الترجمة الآلية في الوقت الفعلي", en: "real time translation", phonetics: "[rɪəl taɪm trænsˈleɪʃn]", category: "الأجهزة التقنية" }
};

interface SpeechTranslatorViewProps {
  userId: string;
  onWordIdentified: () => void;
  ttsVoice: string;
  ttsPitch: number;
  ttsRate: number;
  autoSpeak?: boolean;
}

interface CoachResponse {
  originalText: string;
  translatedText: string;
  phonetics: string;
  category: string;
  grammarInsight: string;
  scores: {
    fluency: number;
    vocabulary: number;
    complexity: number;
    feedback: string;
  };
  alternativePhrasing: string[];
  vocabulary: Array<{
    word: string;
    role: string;
    translation: string;
    phonetics: string;
    guide: string;
  }>;
}

// Helper function for Levenshtein string similarity
function getSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  if (s1 === s2) return 1;
  
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  const dist = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return (maxLen - dist) / maxLen;
}

const PRONUNCIATION_CHALLENGES = [
  {
    id: "sc_1",
    category: "تحية وعلاقات 🤝",
    textEn: "Good morning! It is a pleasure to meet you today.",
    textAr: "صباح الخير! يسعدني جداً لقاؤك اليوم.",
    lang: "en-US",
    phonetics: "[ɡʊd ˈmɔːnɪŋ! ɪt ɪz ə ˈplɛʒə tuː miːt juː təˈdeɪ.]"
  },
  {
    id: "sc_2",
    category: "سفر وسياحة ✈️",
    textEn: "Excuse me, I would like to check in my luggage for the London flight, please.",
    textAr: "المعذرة، أود شحن أمتعتي لرحلة لندن من فضلك.",
    lang: "en-US",
    phonetics: "[ɪkˈskjuːs miː, aɪ wʊd laɪk tuː tʃɛk ɪn maɪ ˈlʌɡɪdʒ fɔːr ðə ˈlʌndən flaɪt, pliːz.]"
  },
  {
    id: "sc_3",
    category: "تطوير ومقابلات 💼",
    textEn: "I am actively looking for advanced machine learning opportunities.",
    textAr: "أنا أبحث بنشاط عن فرص متقدمة في مجال تعلم الآلة.",
    lang: "en-US",
    phonetics: "[aɪ æm ˈæktɪvli ˈlʊkɪŋ fɔːr ədˈvɑːnst məˈʃiːn ˈlɜːnɪŋ ˌɒpəˈtjuːnətiz.]"
  },
  {
    id: "sc_4",
    category: "مطاعم وضيافة 🍔",
    textEn: "Could you please bring me the mineral water and the daily special menu?",
    textAr: "هل يمكنك إحضار المياه المعدنية وقائمة الأطباق اليومية الخاصة من فضلك؟",
    lang: "en-US",
    phonetics: "[kʊd juː pliːz brɪŋ miː ðə ˈmɪnərəl ˈwɔːtər ænd ðə ˈdeɪli ˈspɛʃəl ˈmɛnjuː?]"
  },
  {
    id: "sc_5",
    category: "تحديات اللكنة الصعبة 👅",
    textEn: "The sixth sick sheikh's sixth sheep is sick.",
    textAr: "الخروف السادس للشيخ المريض السادس هو مريض.",
    lang: "en-US",
    phonetics: "[ðə sɪksθ sɪk ʃeɪks sɪksθ ʃiːp ɪz sɪk.]"
  },
  {
    id: "sc_6",
    category: "لغة عربية فصحى 🌟",
    textEn: "Arabic is a beautiful language with deep grammar and rich vocabulary.",
    textAr: "اللغة العربية لغة جميلة ذات قواعد عميقة ومفردات غنية.",
    lang: "ar-SA",
    phonetics: "Standard Arabic Pronunciation"
  },
  {
    id: "sc_7",
    category: "مخارج الحروف الصعبة 🎙️",
    textEn: "An eye for an eye makes the whole world blind.",
    textAr: "العين بالعين تجعل العالم كله أعمى.",
    lang: "en-US",
    phonetics: "[æn aɪ fɔːr æn aɪ meɪks ðə hoʊl wɜːrld blaɪnd.]"
  }
];

interface ChatMessage {
  id: string;
  sender: 'arabic' | 'english';
  originalText: string;
  translatedText: string;
  phonetics?: string;
  timestamp: string;
}

export default function SpeechTranslatorView({
  userId,
  onWordIdentified,
  ttsVoice,
  ttsPitch,
  ttsRate,
  autoSpeak = true
}: SpeechTranslatorViewProps) {
  // Navigation Tabs: 'coach' (Individual dynamic coach) | 'conversation' (Face-to-face duplex chat) | 'scenario' (Immersive Sandbox) | 'lecture' (Live Subtitles Caption HUD)
  const [activeTab, setActiveTab] = useState<'coach' | 'conversation' | 'scenario' | 'lecture'>('coach');

  // Individual Coach state
  const [direction, setDirection] = useState<'en_to_ar' | 'ar_to_en'>('en_to_ar');
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<CoachResponse | null>(null);
  const [savedWordsMap, setSavedWordsMap] = useState<Record<string, boolean>>({});

  // Face-to-Face Duplex Conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_m_1',
      sender: 'english',
      originalText: 'Hello! Welcome to our direct interactive face-to-face translation. How is your day going?',
      translatedText: 'مرحباً بك في المحادثة المباشرة وجهاً لوجه! كيف يمر يومك حتى الآن؟',
      phonetics: '[həˈloʊ! ˈwɛlkəm tu ˈaʊər dɪˈrɛkt ˌɪntərˈæktɪv feɪs-tu-feɪs]',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
    }
  ]);
  const [convListeningSide, setConvListeningSide] = useState<'arabic' | 'english' | null>(null);
  const [convProcessing, setConvProcessing] = useState<boolean>(false);
  const [convSaveStatuses, setConvSaveStatuses] = useState<Record<string, boolean>>({});

  // Immersive Scenario Sandbox states
  const [selectedScenario, setSelectedScenario] = useState<string>('airport');
  const [scenarioMessages, setScenarioMessages] = useState<ScenarioMessage[]>([
    {
      id: 'scen_init_' + Date.now(),
      sender: 'coach',
      textEn: SCENARIOS.airport.initEn,
      textAr: SCENARIOS.airport.initAr,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
    }
  ]);
  const [scenarioInputText, setScenarioInputText] = useState<string>('');
  const [scenarioListening, setScenarioListening] = useState<boolean>(false);
  const [scenarioProcessing, setScenarioProcessing] = useState<boolean>(false);
  const [scenarioHelperHint, setScenarioHelperHint] = useState<string>(SCENARIOS.airport.hint);
  const [scenarioVocabulary, setScenarioVocabulary] = useState<Array<{ word: string; translation: string; phonetic: string }>>([]);
  const [scenarioSaveStatuses, setScenarioSaveStatuses] = useState<Record<string, boolean>>({});

  // Smart Glasses Live Lecture Subtitles states
  const [lectureTranscriptText, setLectureTranscriptText] = useState<string>('');
  const [lecturePaginatedResult, setLecturePaginatedResult] = useState<{
    totalWords: number;
    pages: Array<{
      pageNumber: number;
      originalText: string;
      translatedText: string;
      summary: string;
      grammarInsights: string;
      keyVocabulary: Array<{ word: string; meaning: string; phonetic: string }>;
    }>;
  } | null>(null);
  const [lectureCurrentPageIdx, setLectureCurrentPageIdx] = useState<number>(0);
  const [lectureCaptions, setLectureCaptions] = useState<Array<{
    id: string;
    english: string;
    arabic: string;
    phonetics: string;
    grammarTip: string;
    exampleEn: string;
    exampleAr: string;
    vocabulary: Array<{ word: string; type: string; meaning: string; phonetic: string; explanation: string }>;
  }>>([]);
  const [isLectureListening, setIsLectureListening] = useState<boolean>(false);
  const [liveInterimTranscript, setLiveInterimTranscript] = useState<string>('');
  const [lectureProcessing, setLectureProcessing] = useState<boolean>(false);
  const [lectureLang, setLectureLang] = useState<'en-US' | 'ar-SA'>('en-US');
  const [lectureSavedWords, setLectureSavedWords] = useState<Record<string, boolean>>({});
  const [expandedCapId, setExpandedCapId] = useState<string | null>(null);

  // Speed, control & auto-translation options requested by user
  const [isContinuousActive, setIsContinuousActive] = useState<boolean>(true);
  const [isAutoTranslateActive, setIsAutoTranslateActive] = useState<boolean>(true);
  const [isTurboSpeedActive, setIsTurboSpeedActive] = useState<boolean>(true);

  // local customizable dictionary and engine triggers
  const [translationEngine, setTranslationEngine] = useState<'hybrid' | 'local'>('hybrid');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'ollama'>(() => {
    try {
      const saved = localStorage.getItem('lingolens_ai_provider');
      return (saved === 'ollama') ? 'ollama' : 'gemini';
    } catch (e) {
      return 'gemini';
    }
  });
  const [customDictionary, setCustomDictionary] = useState<Record<string, { arabic: string; phonetics: string; category: string }>>(() => {
    try {
      const saved = localStorage.getItem('lingolens_custom_dict');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [newDictWordEn, setNewDictWordEn] = useState<string>('');
  const [newDictWordAr, setNewDictWordAr] = useState<string>('');
  const [newDictPhonetics, setNewDictPhonetics] = useState<string>('');
  const [newDictCategory, setNewDictCategory] = useState<string>('مفردات المقابلة 💼');
  const [dictSearchQuery, setDictSearchQuery] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [showDictionaryGroup, setShowDictionaryGroup] = useState<boolean>(false);

  // Enhanced dictionary & quiz game states added by user instruction
  const [dictCategoryFilter, setDictCategoryFilter] = useState<string>('all');
  
  // Interactive mini dictionary quiz game
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState<{
    word: string;
    correctTranslation: string;
    options: string[];
    phonetics: string;
    category: string;
  } | null>(null);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);

  // Voice Scoring States
  const [coachSubMode, setCoachSubMode] = useState<'trainer' | 'scoring'>('trainer');
  const [scoringChallengeText, setScoringChallengeText] = useState<string>('Welcome');
  const [scoringSpokenText, setScoringSpokenText] = useState<string>('');
  const [scoringLanguage, setScoringLanguage] = useState<'en-US' | 'ar-SA'>('en-US');
  const [isScoringAnalyzing, setIsScoringAnalyzing] = useState<boolean>(false);
  const [useAiPronunciationTeacher, setUseAiPronunciationTeacher] = useState<boolean>(true);
  const [scoringResult, setScoringResult] = useState<{
    percentage: number;
    stars: number;
    feedback: string;
    evaluatedWords: Array<{ word: string; status: 'correct' | 'partial' | 'missed' | 'imperfect'; similarity?: number; phonemeTips?: string }>;
    isAiEvaluated?: boolean;
    oralGuidance?: string;
  } | null>(null);
  const [focusedEvaluatedWordIdx, setFocusedEvaluatedWordIdx] = useState<number | null>(null);
  const [scoringToast, setScoringToast] = useState<string | null>(null);

  const saveCustomDictionaryToDisk = (updated: Record<string, { arabic: string; phonetics: string; category: string }>) => {
    setCustomDictionary(updated);
    try {
      localStorage.setItem('lingolens_custom_dict', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist custom dictionary:', e);
    }
  };

  // --- AUDIO SESSIONS ARCHIVE & OFFLINE MODEL TRAINING STATES ---
  const [savedSessions, setSavedSessions] = useState<Array<{
    id: string;
    title: string;
    type: 'lecture' | 'conversation';
    englishText: string;
    arabicText: string;
    timestamp: string;
    wordCount: number;
    trainedCount: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('lingolens_saved_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [lastOfflineTrainedCount, setLastOfflineTrainedCount] = useState<number | null>(null);

  // References and User intent controls
  const isUserExplicitlyStopped = useRef<boolean>(false);
  const captionsEndRef = useRef<HTMLDivElement | null>(null);
  const conversationsEndRef = useRef<HTMLDivElement | null>(null);

  // Save Sessions to local disk
  const saveSessionsToDisk = (updated: any[]) => {
    setSavedSessions(updated);
    try {
      localStorage.setItem('lingolens_saved_sessions', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist saved sessions:', e);
    }
  };

  // Core local dictionary training engine
  const trainOfflineWithSession = (fullEn: string, fullAr: string, vocabularyList?: any[]) => {
    const updatedDict = { ...customDictionary };
    let addedCount = 0;

    // 1. Train explicitly with the identified vocabulary items
    if (vocabularyList && vocabularyList.length > 0) {
      vocabularyList.forEach(item => {
        const enKey = item.word?.toLowerCase().trim();
        if (enKey && item.meaning) {
          if (!updatedDict[enKey]) {
            updatedDict[enKey] = {
              arabic: item.meaning,
              phonetics: item.phonetic || '[صوت التدريب]',
              category: 'كلمات مستقاة من المحاضرات 🎓'
            };
            addedCount++;
          }
        }
      });
    }

    // 2. Train with sentence lines if short and sweet
    const cleanEnSentence = fullEn.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    if (cleanEnSentence && fullAr && fullEn.length < 150) {
      const normalizedEn = cleanEnSentence;
      if (!updatedDict[normalizedEn]) {
        updatedDict[normalizedEn] = {
          arabic: fullAr.trim(),
          phonetics: '[جملة كاملة]',
          category: 'جمل مراجعة المحاضرات 📁'
        };
        addedCount++;
      }
    }

    // 3. Persist the updated offline dictionary
    if (addedCount > 0) {
      saveCustomDictionaryToDisk(updatedDict);
      setLastOfflineTrainedCount(prev => (prev || 0) + addedCount);
    }
    return addedCount;
  };

  // Compile active Lecture into a single archived session
  const compileAndSaveLectureSession = () => {
    if (!lectureTranscriptText.trim()) return;
    
    let fullEn = lectureTranscriptText;
    let fullAr = 'لم يتم ترجمة هذه الجلسة الطويلة بعد.';
    const allVocabs: any[] = [];
    
    if (lecturePaginatedResult && lecturePaginatedResult.pages.length > 0) {
      fullEn = lecturePaginatedResult.pages.map(p => p.originalText).join(' ');
      fullAr = lecturePaginatedResult.pages.map(p => p.translatedText).join('\n\n');
      lecturePaginatedResult.pages.forEach(p => {
        if (Array.isArray(p.keyVocabulary)) {
          p.keyVocabulary.forEach(v => {
            allVocabs.push({
              word: v.word,
              type: 'noun',
              meaning: v.meaning,
              phonetic: v.phonetic,
              explanation: 'مفرد لغة مستخلص من المحاضرة المترجمة'
            });
          });
        }
      });
    }

    const trainedCount = trainOfflineWithSession(fullEn, fullAr, allVocabs);

    const newSession = {
      id: 'sess_lect_' + Date.now(),
      title: 'محاضرة/جلسة استماع: ' + (SIMULATED_LECTURE_TOPICS[selectedTopicIndex]?.title.split(':')[0] || 'جلسة استماع حر'),
      type: 'lecture' as const,
      englishText: fullEn,
      arabicText: fullAr,
      timestamp: new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      wordCount: fullEn.split(' ').filter(Boolean).length,
      trainedCount: trainedCount > 0 ? trainedCount : allVocabs.length
    };

    saveSessionsToDisk([newSession, ...savedSessions]);
  };

  // Compile active face-to-face translation into single archived session
  const compileAndSaveConversationSession = () => {
    if (messages.length <= 1) return;
    
    const validMsgs = messages.filter(m => m.id !== 'welcome_m_1');
    const fullEn = validMsgs.map(m => m.sender === 'english' ? m.originalText : m.translatedText).join(' ');
    const fullAr = validMsgs.map(m => m.sender === 'arabic' ? m.originalText : m.translatedText).join(' ');
    
    if (!fullEn.trim() || !fullAr.trim()) return;

    const trainedCount = trainOfflineWithSession(fullEn, fullAr);

    const newSession = {
      id: 'sess_conv_' + Date.now(),
      title: 'محادثة لغوية متبادلة وجهاً لوجه 💬',
      type: 'conversation' as const,
      englishText: fullEn,
      arabicText: fullAr,
      timestamp: new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      wordCount: fullEn.split(' ').filter(Boolean).length,
      trainedCount: trainedCount > 0 ? trainedCount : 5
    };

    saveSessionsToDisk([newSession, ...savedSessions]);
  };

  // Generate a randomized multi-choice quiz from the user's active dictionary words
  const generateQuizQuestion = (currentDict: Record<string, { arabic: string; phonetics: string; category: string }>) => {
    const items: Array<{ en: string; ar: string; phonetics: string; category: string }> = [];
    
    // Add presets
    Object.entries(DEFAULT_LOCAL_DICTIONARY).forEach(([key, val]) => {
      items.push({ en: key, ar: val.ar, phonetics: val.phonetics, category: val.category });
    });
    
    // Add customs
    (Object.entries(currentDict) as Array<[string, { arabic: string; phonetics: string; category: string }]>).forEach(([key, val]) => {
      items.push({ en: key, ar: val.arabic, phonetics: val.phonetics, category: val.category });
    });

    if (items.length < 4) {
      setQuizFeedback("⚠️ عذراً! يجب توفر 4 مفردات بالقاموس على الأقل لبدء لعبة الاختبار الذكي.");
      setCurrentQuizQuestion(null);
      return;
    }

    // Pick random target word
    const randTargetIdx = Math.floor(Math.random() * items.length);
    const target = items[randTargetIdx];

    // Pick 3 random wrong options
    const optionsSet = new Set<string>();
    optionsSet.add(target.ar);

    let attempts = 0;
    while (optionsSet.size < 4 && attempts < 150) {
      attempts++;
      const randOpt = items[Math.floor(Math.random() * items.length)].ar;
      optionsSet.add(randOpt);
    }

    const shuffledOptions = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    setCurrentQuizQuestion({
      word: target.en,
      correctTranslation: target.ar,
      options: shuffledOptions,
      phonetics: target.phonetics,
      category: target.category
    });
    setSelectedQuizAnswer(null);
    setQuizFeedback(null);
  };

  const exportCustomDictionary = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customDictionary, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `lingolens_dictionary_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert('حدث خطأ أثناء تصدير ملف القاموس.');
    }
  };

  const importCustomDictionary = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (parsed && typeof parsed === 'object') {
            const cleaned: Record<string, { arabic: string; phonetics: string; category: string }> = { ...customDictionary };
            Object.entries(parsed).forEach(([key, val]: [string, any]) => {
              if (val && (val.arabic || val.ar)) {
                cleaned[key] = {
                  arabic: val.arabic || val.ar,
                  phonetics: val.phonetics || '[مستورد]',
                  category: val.category || 'ملف مستورد 📂'
                };
              }
            });
            saveCustomDictionaryToDisk(cleaned);
            alert(`🎉 تم دمج واستيراد القاموس بنجاح! إجمالي الكلمات المضافة أو المحدثة: ${Object.keys(parsed).length}`);
          } else {
            alert('صيغة ملف النسخة الاحتياطية غير صالحة.');
          }
        } catch (err) {
          alert('فشل قراءة الملف. تأكد من رفعه بصيغة JSON صحيحة.');
        }
      };
    }
  };

  const performLocalTranslation = (text: string, currentDirection: 'en_to_ar' | 'ar_to_en'): CoachResponse => {
    const trimmed = text.trim();
    // Normalize and clean text for local dictionary search
    const lower = trimmed.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");

    // Prepare dictionary sources
    const mergedDict: Record<string, { ar: string; en: string; phonetics: string; category: string; grammarTip?: string }> = {};
    
    // 1. Populate default expert glossary
    Object.entries(DEFAULT_LOCAL_DICTIONARY).forEach(([key, val]) => {
      mergedDict[key.toLowerCase()] = val;
    });

    // 2. Populate custom dictionary entries from user's personal memory
    (Object.entries(customDictionary) as Array<[string, { arabic: string; phonetics: string; category: string }]>).forEach(([key, val]) => {
      mergedDict[key.toLowerCase()] = {
        ar: val.arabic,
        en: key,
        phonetics: val.phonetics || '[مخصص]',
        category: val.category || 'قاموسي الخاص 📕'
      };
    });

    // English Stopwords to focus on the key phrases during dynamic matching
    const STOPWORDS = new Set(["a", "an", "the", "is", "are", "am", "was", "were", "be", "been", "being", "to", "from", "in", "on", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "of", "and", "but", "or", "if", "then", "else", "this", "that", "these", "those", "my", "your", "his", "her", "its", "their", "our", "me", "him", "us", "them", "you", "he", "she", "it", "they", "i"]);

    // Option A: Seek exact direct sentence translation lookup
    // SORT keys by length descending so longer/more specific phrases match first! Critical optimization!
    const sortedKeys = Object.keys(mergedDict).sort((a, b) => b.length - a.length);
    let matchKey = sortedKeys.find(k => k === lower || lower.includes(k) || k.includes(lower));
    
    if (matchKey) {
      const match = mergedDict[matchKey];
      const isEnToAr = currentDirection === 'en_to_ar';
      
      const vocabularyExtracted = [{
        word: match.en,
        role: "عبارة مسجلة",
        translation: match.ar,
        phonetics: match.phonetics,
        guide: match.grammarTip || "عبارة محفوظة بذكاء في قاموسك الشخصي الفوري دون هدر للإنترنت."
      }];

      return {
        originalText: isEnToAr ? match.en : match.ar,
        translatedText: isEnToAr ? match.ar : match.en,
        phonetics: match.phonetics,
        category: match.category,
        grammarInsight: match.grammarTip || "تمت الترجمة فوريًا ودون متطلبات إنترنت بنسبة 100% باستخدام القاموس الداخلي الذكي المدمج بجهازك.",
        scores: {
          fluency: 100,
          vocabulary: 105, // bonus score for exact dictionary fit
          complexity: 100,
          feedback: "ممتاز! تم مطابقة العبارة بالكامل مع القاموس المحلي الفوري (زمن استجابة 0.1 ملي ثانية) ⚡."
        },
        alternativePhrasing: [
          `Local glossary match success: "${match.en}" ➔ "${match.ar}"`
        ],
        vocabulary: vocabularyExtracted
      };
    }

    // Option B: Token-based word-by-word dynamic breakdown and glossary generation
    // Enhanced stopword removal ensures we focus on important nouns, verbs, and adjectives!
    const words = lower.split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
    const vocabularyList: Array<{ word: string; role: string; translation: string; phonetics: string; guide: string }> = [];

    words.forEach(word => {
      const foundKey = Object.keys(mergedDict).find(k => k === word || k.split(/\s+/).includes(word));
      if (foundKey) {
        const item = mergedDict[foundKey];
        if (!vocabularyList.some(v => v.word.toLowerCase() === item.en.toLowerCase())) {
          vocabularyList.push({
            word: item.en,
            role: "مفردة مطابقة",
            translation: item.ar,
            phonetics: item.phonetics,
            guide: `مطابقة من فئة: ${item.category}`
          });
        }
      }
    });

    if (vocabularyList.length > 0) {
      const isEnToAr = currentDirection === 'en_to_ar';
      return {
        originalText: trimmed,
        // Compile beautiful decomposed list
        translatedText: isEnToAr 
          ? `(ترجمة الكلمات المطابقة محلياً): ${words.map(w => {
              const matchedWord = vocabularyList.find(v => v.word.toLowerCase() === w.toLowerCase() || v.word.toLowerCase().includes(w.toLowerCase()));
              return matchedWord ? matchedWord.translation : `[${w}]`;
            }).join(" ")}`
          : `(Decomposed): ${words.map(w => {
              const matchedWord = vocabularyList.find(v => v.word.toLowerCase() === w.toLowerCase() || v.word.toLowerCase().includes(w.toLowerCase()));
              return matchedWord ? matchedWord.word : `[${w}]`;
            }).join(" ")}`,
        phonetics: "[تجميع صوتي دلالي]",
        category: "تفكيك الكلمات محلياً 🔬",
        grammarInsight: "لم نعثر على مطابقة جملة كاملة حرفية بالقاموس، فقمنا بتصفية كلمات الحشو وتفكيك الكلمات لك كلمةً بكلمة لإعطائك ترجمة سريعة للمفردات الأساسية دون استهلاك خلايا شبكة الإنترنت.",
        scores: {
          fluency: 90,
          vocabulary: 85,
          complexity: 70,
          feedback: "تمت مطابقة المفردات الأساسية وتفكيك الكلمات بنجاح بعد استبعاد كلمات الحشو غير المفيدة."
        },
        alternativePhrasing: [
          "تستطيع إضافة هذه الجملة كاملة إلى هامش قاموسك الشخصي بالبطاقات بالأسفل لدعم ترجمتها الحرفية الفورية!"
        ],
        vocabulary: vocabularyList
      };
    }

    // Option C: Offline Fallback placeholder recommendation
    const isEnToAr = currentDirection === 'en_to_ar';
    return {
      originalText: trimmed,
      translatedText: isEnToAr 
        ? "هذه الجملة غير مسجلة في قاموسك الموفر محلياً حتى الآن."
        : "This segment is not registered in your offline custom dictionary yet.",
      phonetics: "[ offline ]",
      category: "مفقود في القاموس 📕",
      grammarInsight: "لكن الخبر السار! يمكنك كتابة ترجمة هذه العبارة يدوياً الآن في لوحة 'إدارة القاموس الشخصي' بالأسفل لتصبح محفوظة وتعمل فوراً تلقائياً حتى دون إنترنت!",
      scores: {
        fluency: 0,
        vocabulary: 0,
        complexity: 0,
        feedback: "لم يتم العثور على الكلمة بالقاموس الشخصي. يرجى إضافتها بالأسفل أو تفعيل ميزة ذكاء Gemini."
      },
      alternativePhrasing: [
        "سجل العبارات التي تتوقع استخدامها مسبقاً لترجمتها بذكاء 0 ملي ثانية."
      ],
      vocabulary: []
    };
  };
  
  // Simulated lecture flow state
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(0);
  const [simSegmentIdx, setSimSegmentIdx] = useState<number>(-1);
  const [isSimulatingLecture, setIsSimulatingLecture] = useState<boolean>(false);
  const simTimerRef = useRef<any>(null);

  // Reset scenario dialog on change
  useEffect(() => {
    if (activeTab === 'scenario') {
      const scen = SCENARIOS[selectedScenario] || SCENARIOS.airport;
      setScenarioMessages([
        {
          id: 'scen_init_' + Date.now(),
          sender: 'coach',
          textEn: scen.initEn,
          textAr: scen.initAr,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
        }
      ]);
      setScenarioInputText('');
      setScenarioListening(false);
      setScenarioProcessing(false);
      setScenarioHelperHint(scen.hint);
      setScenarioVocabulary([]);
      setScenarioSaveStatuses({});
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [selectedScenario, activeTab]);

  // Dynamic automatic scroll synchronization for infinite continuous streams
  useEffect(() => {
    if (captionsEndRef.current) {
      captionsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lectureCaptions, liveInterimTranscript]);

  useEffect(() => {
    if (conversationsEndRef.current) {
      conversationsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, convProcessing]);

  // Load conversation history from Firestore on mount/userId change
  useEffect(() => {
    const loadConversationHistory = async () => {
      try {
        const history = await getConversationHistoryMessages(userId);
        if (history && history.length > 0) {
          const chatMsgs: ChatMessage[] = history.map(msg => ({
            id: msg.id,
            sender: msg.sender,
            originalText: msg.originalText,
            translatedText: msg.translatedText,
            phonetics: msg.phonetics,
            timestamp: msg.timestamp
          }));
          setMessages(chatMsgs);
        } else {
          const welcome = [
            {
              id: 'welcome_m_1',
              sender: 'english' as const,
              originalText: 'Hello! Welcome to our direct interactive face-to-face translation. How is your day going?',
              translatedText: 'مرحباً بك في المحادثة المباشرة وجهاً لوجه! كيف يمر يومك حتى الآن؟',
              phonetics: '[həˈloʊ! ˈwɛlkəm tu ˈaʊər dɪˈrɛkt ˌɪntərˈæktɪv feɪs-tu-feɪs]',
              timestamp: new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
            }
          ];
          setMessages(welcome);
        }
      } catch (e) {
        console.error('Failed to load conversation history:', e);
      }
    };

    if (userId) {
      loadConversationHistory();
    }
  }, [userId]);

  // Web Speech API interfaces
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      // True continuous mode requested by the user so they can open/close manually and it doesn't auto-stop
      rec.continuous = isContinuousActive || activeTab === 'lecture';
      rec.interimResults = true; // Always true for blazing fast text typing response!
      
      rec.onstart = () => {
        if (activeTab === 'coach') {
          setIsListening(true);
        } else if (activeTab === 'scenario') {
          setScenarioListening(true);
        } else if (activeTab === 'lecture') {
          setIsLectureListening(true);
        }
        setRecognitionError(null);
      };

      rec.onresult = async (event: any) => {
        let interim = '';
        let finalFound = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalFound += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        // Extremely responsive live preview text block as words are spoken (0ms delay)
        if (interim) {
          setLiveInterimTranscript(interim);
          if (activeTab === 'coach') {
            if (coachSubMode === 'scoring') {
              setScoringSpokenText(interim);
            } else {
              setInputText(interim);
            }
          } else if (activeTab === 'scenario') {
            setScenarioInputText(interim);
          }
        }

        if (finalFound.trim()) {
          setLiveInterimTranscript('');
          
          if (activeTab === 'lecture') {
            setLectureTranscriptText(prev => prev + (prev ? ' ' : '') + finalFound.trim());
          } else if (activeTab === 'coach') {
            if (coachSubMode === 'scoring') {
              setScoringSpokenText(finalFound.trim());
              if (useAiPronunciationTeacher) {
                runAiVoiceScoring(finalFound.trim(), scoringChallengeText, scoringLanguage);
              } else {
                runVoiceScoring(finalFound.trim(), scoringChallengeText, scoringLanguage);
              }
            } else {
              setInputText(finalFound.trim());
              if (isAutoTranslateActive) {
                handleAnalyzeSpeech(finalFound.trim());
              }
            }
          } else if (activeTab === 'conversation' && convListeningSide) {
            const side = convListeningSide;
            // In continuous mode, keep side listening but translate this segment
            await handleAnalyzeConversationMessage(finalFound.trim(), side);
          } else if (activeTab === 'scenario') {
            setScenarioInputText(finalFound.trim());
            await handleAnalyzeScenarioMessage(finalFound.trim());
          }
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // In continuous streaming mode we can skip the no-speech error to maintain connection
        if ((isContinuousActive || activeTab === 'lecture') && event.error === 'no-speech') {
          return;
        }

        // Silent/Transient conditions that shouldn't display a persistent banner
        const isSilentError = event.error === 'no-speech' || event.error === 'aborted' || event.error === 'audio-capture';
        
        let friendlyErr = '';
        if (event.error === 'not-allowed') {
          friendlyErr = 'تم رفض إذن الوصول للميكروفون. إذا كنت تستخدم التطبيق داخل نافذة التجربة (Iframe)، يرجى الضغط على زر "افتح في علامة تبويب جديدة" (Open in new tab) أعلى اليمين لتفعيل تراخيص الصوت والمستشعرات بشكل مستقر!';
          isUserExplicitlyStopped.current = true;
        } else if (event.error === 'network') {
          friendlyErr = 'حدثت مشكلة في الاتصال بالإنترنت أثناء معالجة الصوت التلقائية. يرجى التحقق من الشبكة والمحاولة مرة أخرى.';
          isUserExplicitlyStopped.current = true;
        } else if (!isSilentError) {
          friendlyErr = `حدث عطل أثناء استماع الميكروفون (${event.error})`;
          isUserExplicitlyStopped.current = true;
        }

        if (friendlyErr) {
          setRecognitionError(friendlyErr);
        } else {
          // If it was just a regular silence timeout or abort, clear any previous error silently with no disturbance
          setRecognitionError(null);
        }
      };

      rec.onend = () => {
        // Dynamic continuous stream auto-recovery (reconnect on silent timeout)
        if (!isUserExplicitlyStopped.current && (isListening || isLectureListening || convListeningSide || scenarioListening)) {
          console.log("Auto-recovering speech recognition stream to bypass silence limits...");
          try {
            recognitionRef.current.start();
            return; // Exit and keep states active
          } catch (err) {
            console.warn("Failed automatic auto-recovery restart:", err);
          }
        }
        
        setIsListening(false);
        setScenarioListening(false);
        setConvListeningSide(null);
        setIsLectureListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setRecognitionError('ميزة التعرف الصوتي غير مدعومة بالكامل في هذا المتصفح. يمكنك استخدام الكتابة اليدوية بدلاً من ذلك.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [direction, activeTab, convListeningSide, selectedScenario, lectureLang, isContinuousActive, isAutoTranslateActive, coachSubMode, scoringChallengeText, scoringLanguage, useAiPronunciationTeacher]);

  // Voice scoring calculation handler
  const runVoiceScoring = (spokenBySelf: string, targetChallengeText: string, langSetting: 'en-US' | 'ar-SA') => {
    if (!spokenBySelf.trim() || !targetChallengeText.trim()) {
      setScoringResult(null);
      return;
    }

    const cleanStr = (str: string, l: 'en-US' | 'ar-SA') => {
      let temp = str;
      if (l === 'en-US') {
        temp = temp.toLowerCase();
      } else {
        temp = temp.replace(/[\u064B-\u065F]/g, "");
      }
      return temp.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ").trim();
    };

    const targetClean = cleanStr(targetChallengeText, langSetting);
    const spokenClean = cleanStr(spokenBySelf, langSetting);

    const targetWords = targetClean.split(" ").filter(Boolean);
    const spokenWords = spokenClean.split(" ").filter(Boolean);

    if (targetWords.length === 0) return;

    const evaluated: Array<{ word: string; status: 'correct' | 'partial' | 'missed' | 'imperfect'; similarity?: number; phonemeTips?: string }> = [];
    let lastMatchedIndex = -1;
    let totalScoreSum = 0;

    for (let i = 0; i < targetWords.length; i++) {
      const targetWord = targetWords[i];
      let bestSimilarity = 0;
      let matchedIndexInSpoken = -1;

      const searchStart = Math.max(0, lastMatchedIndex + 1);
      const searchEnd = Math.min(spokenWords.length, searchStart + 5);

      for (let j = searchStart; j < searchEnd; j++) {
        const spokenWord = spokenWords[j];
        const sim = getSimilarity(targetWord, spokenWord);
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
          matchedIndexInSpoken = j;
        }
      }

      let status: 'correct' | 'partial' | 'missed' | 'imperfect' = 'missed';
      if (bestSimilarity >= 0.82) {
        status = 'correct';
        lastMatchedIndex = matchedIndexInSpoken;
        totalScoreSum += 1.0;
      } else if (bestSimilarity >= 0.45) {
        status = 'partial';
        lastMatchedIndex = matchedIndexInSpoken;
        totalScoreSum += bestSimilarity;
      } else {
        status = 'missed';
        totalScoreSum += 0;
      }

      evaluated.push({
        word: targetWord,
        status,
        similarity: bestSimilarity,
        phonemeTips: status === 'correct' ? 'نطق ممتاز ومخرج صوتي دقيق!' : status === 'partial' ? 'تقارب لفظي مقبول، تدرّب أكثر للتحسين.' : 'يرجى نطق الكلمة بوضوح أكبر لتحديد مخرج حرف الكلمة.'
      });
    }

    let finalPercentage = Math.round((totalScoreSum / targetWords.length) * 100);
    finalPercentage = Math.max(0, Math.min(100, finalPercentage));

    let starsCount = 0;
    let encouragementTip = "";
    if (finalPercentage >= 92) {
      starsCount = 5;
      encouragementTip = "ممتاز جداً! نطق مثالي يضاهي نطق المتحدثين الأصليين 🏆🌟";
    } else if (finalPercentage >= 78) {
      starsCount = 4;
      encouragementTip = "رائع للغاية! نطقك سليم وواضح بنسبة كبيرة، استمر 👏⭐";
    } else if (finalPercentage >= 55) {
      starsCount = 3;
      encouragementTip = "جيد! مخارج الحروف ممتازة، ولكن تحتاج للتمرن على بضعة أحرف إضافية 👍";
    } else if (finalPercentage >= 35) {
      starsCount = 2;
      encouragementTip = "مقبول! يرجى الاستماع إلى النطق الصحيح للعبارة والمحاولة مجدداً 🎯";
    } else {
      starsCount = 1;
      encouragementTip = "حاول مجدداً! استمع للكنة واللفظ الصحيح بالضغط على زر الصوت، وتمرّن جيداً 🗣️";
    }

    if (spokenWords.length === 0) {
      starsCount = 0;
      finalPercentage = 0;
      encouragementTip = "لم نتمكن من التقاط أي نطق واضح. يرجى التحدث بوضوح أمام الميكروفون 🎙️";
    }

    setScoringResult({
      percentage: finalPercentage,
      stars: starsCount,
      feedback: encouragementTip,
      evaluatedWords: evaluated,
      isAiEvaluated: false
    });
  };

  // Modern interactive AI teacher speech scoring and makharij correction API wrapper
  const runAiVoiceScoring = async (spokenBySelf: string, targetChallengeText: string, langSetting: 'en-US' | 'ar-SA') => {
    if (!spokenBySelf.trim() || !targetChallengeText.trim()) {
      setScoringResult(null);
      return;
    }

    setIsScoringAnalyzing(true);
    setScoringResult(null);

    try {
      const response = await fetch('/api/pronunciation-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetText: targetChallengeText,
          spokenText: spokenBySelf,
          language: langSetting,
          provider: aiProvider
        })
      });

      if (!response.ok) {
        throw new Error('Fallback target code');
      }

      const data = await response.json();
      const finalScore = data.score ?? 0;
      let starsCount = 1;
      if (finalScore >= 90) starsCount = 5;
      else if (finalScore >= 75) starsCount = 4;
      else if (finalScore >= 55) starsCount = 3;
      else if (finalScore >= 30) starsCount = 2;

      setScoringResult({
        percentage: finalScore,
        stars: starsCount,
        feedback: data.arabicFeedback || 'رائع! واصل التحدث والتدريب الصوتي الآن.',
        evaluatedWords: (data.evaluatedWords || []).map((w: any) => ({
          word: w.word,
          status: (w.status === 'correct' || w.status === 'imperfect' || w.status === 'missing') ? w.status : 'missing',
          phonemeTips: w.phonemeTips || 'مخرج الحرف سليم.'
        })),
        isAiEvaluated: true,
        oralGuidance: data.oralGuidance || ''
      });

      // Automatically play back oral guidance to create an immersive spoken lesson experience!
      if (data.oralGuidance) {
        speakLoud(data.oralGuidance, 'ar-SA', true);
      } else if (data.arabicFeedback) {
        speakLoud(data.arabicFeedback, 'ar-SA', true);
      }

    } catch (err) {
      console.warn('AI speech coach lookup failed, reverting to local string matcher: ', err);
      runVoiceScoring(spokenBySelf, targetChallengeText, langSetting);
    } finally {
      setIsScoringAnalyzing(false);
    }
  };

  // Handle Coach Listen toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setRecognitionError('التعرف الصوتي غير متوفر. يرجى استخدام لوحة المفاتيح والتحليل المباشر!');
      return;
    }

    if (isListening) {
      isUserExplicitlyStopped.current = true;
      recognitionRef.current.stop();
    } else {
      isUserExplicitlyStopped.current = false;
      if (coachSubMode === 'scoring') {
        setScoringSpokenText('');
        setScoringResult(null);
        setRecognitionError(null);
        recognitionRef.current.lang = scoringLanguage;
      } else {
        setInputText('');
        setResult(null);
        setRecognitionError(null);
        recognitionRef.current.lang = direction === 'en_to_ar' ? 'en-US' : 'ar-SA';
      }
      
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        recognitionRef.current.stop();
      }
    }
  };

  // Submit to Individual Coach backend API
  const handleAnalyzeSpeech = async (textToProcess?: string) => {
    const targetText = textToProcess || inputText;
    if (!targetText.trim()) return;

    setProcessing(true);
    setResult(null);
    setSavedWordsMap({});

    if (translationEngine === 'local') {
      setTimeout(() => {
        const localRes = performLocalTranslation(targetText, direction);
        setResult(localRes);
        setProcessing(false);
        if (direction === 'ar_to_en' && localRes.translatedText) {
          speakLoud(localRes.translatedText, 'en-US', true);
        } else if (direction === 'en_to_ar' && localRes.originalText) {
          speakLoud(localRes.originalText, 'en-US', true);
        }
      }, 100);
      return;
    }

    try {
      const response = await fetch('/api/speech-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: targetText,
          direction: direction,
          fast: isTurboSpeedActive,
          provider: aiProvider
        })
      });

      if (!response.ok) {
        throw new Error('خطأ في الاتصال بمساعد الذكاء الاصطناعي');
      }

      const data: CoachResponse = await response.json();
      setResult(data);

      // Speak result English translation
      if (direction === 'ar_to_en' && data.translatedText) {
        speakLoud(data.translatedText, 'en-US', true);
      } else if (direction === 'en_to_ar' && data.originalText) {
        speakLoud(data.originalText, 'en-US', true);
      }

    } catch (err) {
      console.warn('Network or API key missing, falling back to local dictionary: ', err);
      const fallbackResult = performLocalTranslation(targetText, direction);
      fallbackResult.grammarInsight = `⚠️ [تنبيه: تم مطابقة النص بالقاموس الداخلي تلقائياً نظراً لعدم توفر خادم الذكاء الاصطناعي/مفتاح المبرمج حالياً] \n\n ${fallbackResult.grammarInsight}`;
      setResult(fallbackResult);
    } finally {
      setProcessing(false);
    }
  };

  // Handle Duplex Live Conversational speech triggers
  const startConversationListen = (side: 'arabic' | 'english') => {
    if (!recognitionRef.current) {
      setRecognitionError('ميزة التعرف الصوتي غير متوفرة في هذا الجهاز.');
      return;
    }

    if (convListeningSide === side) {
      isUserExplicitlyStopped.current = true;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setConvListeningSide(null);
      return;
    }

    // If another side or listener was active, stop it first
    isUserExplicitlyStopped.current = true;
    try {
      recognitionRef.current.stop();
    } catch (e) {}

    // Cancel speech and clear errors
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setRecognitionError(null);
    setConvListeningSide(side);
    isUserExplicitlyStopped.current = false;

    recognitionRef.current.lang = side === 'arabic' ? 'ar-SA' : 'en-US';

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start conversation speech:', err);
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      // Retry secondary
      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }, 300);
    }
  };

  // Submit conversation audio transcription for twin duplex translator processing
  const handleAnalyzeConversationMessage = async (transcript: string, side: 'arabic' | 'english') => {
    if (!transcript.trim()) return;
    setConvProcessing(true);

    const activeDirection = side === 'arabic' ? 'ar_to_en' : 'en_to_ar';

    if (translationEngine === 'local') {
      setTimeout(() => {
        const localRes = performLocalTranslation(transcript, activeDirection);
        const newMsg: ChatMessage = {
          id: 'msg_local_' + Date.now(),
          sender: side,
          originalText: localRes.originalText || transcript,
          translatedText: localRes.translatedText,
          phonetics: localRes.phonetics || '',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, newMsg]);
        saveConversationHistoryMessage(userId, {
          id: newMsg.id,
          userId,
          sender: newMsg.sender,
          originalText: newMsg.originalText,
          translatedText: newMsg.translatedText,
          phonetics: newMsg.phonetics,
          timestamp: newMsg.timestamp
        }).catch(err => console.error('Failed auto-saving local translation to Firestore:', err));
        setConvProcessing(false);
        if (side === 'arabic') {
          speakLoud(localRes.translatedText, 'en-US', true);
        } else {
          speakLoud(localRes.translatedText, 'ar-SA', true);
        }
      }, 100);
      return;
    }

    try {
      // Query the dynamic speech-coach to get correct grammatically-checked translation
      const response = await fetch('/api/speech-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: transcript,
          direction: activeDirection,
          fast: isTurboSpeedActive,
          provider: aiProvider
        })
      });

      if (!response.ok) {
        throw new Error('فشل جلب الترجمة الفورية للمحادثة');
      }

      const data: CoachResponse = await response.json();
      
      const newMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        sender: side,
        originalText: data.originalText || transcript,
        translatedText: data.translatedText,
        phonetics: data.phonetics || '',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, newMsg]);
      saveConversationHistoryMessage(userId, {
        id: newMsg.id,
        userId,
        sender: newMsg.sender,
        originalText: newMsg.originalText,
        translatedText: newMsg.translatedText,
        phonetics: newMsg.phonetics,
        timestamp: newMsg.timestamp
      }).catch(err => console.error('Failed auto-saving translation to Firestore:', err));

      // Automatically speak the translated text loud in the other person's language!
      if (side === 'arabic') {
        speakLoud(data.translatedText, 'en-US', true);
      } else {
        speakLoud(data.translatedText, 'ar-SA', true);
      }

    } catch (err) {
      console.warn('Conversation API roundtrip issue, triggering local offline engine fallback:', err);
      const fallbackRes = performLocalTranslation(transcript, activeDirection);
      const newMsg: ChatMessage = {
        id: 'msg_fallback_' + Date.now(),
        sender: side,
        originalText: transcript,
        translatedText: `(محلي 📕): ${fallbackRes.translatedText}`,
        phonetics: fallbackRes.phonetics || '',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, newMsg]);
      saveConversationHistoryMessage(userId, {
        id: newMsg.id,
        userId,
        sender: newMsg.sender,
        originalText: newMsg.originalText,
        translatedText: newMsg.translatedText,
        phonetics: newMsg.phonetics,
        timestamp: newMsg.timestamp
      }).catch(err => console.error('Failed auto-saving fallback translation to Firestore:', err));
      
      if (side === 'arabic') {
        speakLoud(fallbackRes.translatedText, 'en-US', true);
      } else {
        speakLoud(fallbackRes.translatedText, 'ar-SA', true);
      }
    } finally {
      setConvProcessing(false);
    }
  };

  // Speaks output text loud with browser synth
  const speakLoud = (phrase: string, lang: string = 'en-US', isAuto: boolean = false) => {
    if (isAuto && !autoSpeak) {
      console.log('Skipping automatic speech synthesis play back because autoSpeak is disabled.');
      return;
    }
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = lang;
    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;
    
    // Find compatible voice
    if (window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang.startsWith(lang));
      if (match) utterance.voice = match;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Bookmark a specific chat message word directly inside history list
  const handleSaveConvMessageToVocabulary = async (msg: ChatMessage) => {
    const isArabicSpoken = msg.sender === 'arabic';
    const englishPiece = isArabicSpoken ? msg.translatedText : msg.originalText;
    const arabicPiece = isArabicSpoken ? msg.originalText : msg.translatedText;

    try {
      await saveWord(userId, {
        id: 'conv_chat_' + msg.id.slice(-6),
        english: englishPiece,
        arabic: arabicPiece,
        phonetics: msg.phonetics || '[حوار متبادل]',
        category: 'محادثة لغوية ثنائية',
        exampleEn: `Captured in live Face-to-Face conversation.`,
        exampleAr: 'تم التقاطها أثناء المحادثة الصوتية المباشرة مع معلمك.'
      });
      setConvSaveStatuses((prev) => ({ ...prev, [msg.id]: true }));
      onWordIdentified();
    } catch (err) {
      console.error('Error saving message item: ', err);
    }
  };

  // Convert individual word in coach section
  const handleSaveIndividualVocab = async (word: string, meaning: string, phonetic: string, type: string) => {
    try {
      await saveWord(userId, {
        id: 'vocab_conv_' + word.toLowerCase().replace(/[^a-z]/g, '') + '_' + Date.now().toString().slice(-6),
        english: word,
        arabic: `${meaning} (${type || 'مفردة حوار'})`,
        phonetics: phonetic || '[صوتي]',
        category: result?.category || 'مفردات محادثة لفظية',
        exampleEn: result ? `Used in dialogue: "${result.originalText}"` : 'تراكيب حية.',
        exampleAr: result ? `قيلت في سياق: "${result.translatedText}"` : 'تعلم تفاعلي.'
      });
      setSavedWordsMap(prev => ({ ...prev, [word]: true }));
      onWordIdentified();
    } catch (err) {
      console.error('Failed to save dialogue vocab: ', err);
    }
  };

  // Bookmark full sentence in coach view
  const handleSaveFullSentence = async () => {
    if (!result) return;
    const isEnToAr = direction === 'en_to_ar';
    const englishPiece = isEnToAr ? result.originalText : result.translatedText;
    const arabicPiece = isEnToAr ? result.translatedText : result.originalText;
    
    try {
      await saveWord(userId, {
        id: 'sent_conv_' + Date.now().toString().slice(-8),
        english: englishPiece,
        arabic: arabicPiece,
        phonetics: result.phonetics || '[إنصات]',
        category: 'صوتيات: ' + result.category,
        exampleEn: result.alternativePhrasing?.[0] || 'Natural alternative study item.',
        exampleAr: 'تعبير بديل يعزز طلاقتك المحادثتية.'
      });
      setSavedWordsMap(prev => ({ ...prev, '__full_phrase__': true }));
      onWordIdentified();
    } catch (err) {
      console.error('Failed to save complete speech lesson: ', err);
    }
  };

  // Immersive Scenario Sandbox handler functions
  const toggleScenarioListening = () => {
    if (!recognitionRef.current) {
      setRecognitionError('التعرف الصوتي غير متوفر على جهازك حالياً. استخدم الإدخال اليدوي والنقر على إرسال!');
      return;
    }

    if (scenarioListening) {
      isUserExplicitlyStopped.current = true;
      recognitionRef.current.stop();
    } else {
      isUserExplicitlyStopped.current = false;
      setScenarioInputText('');
      setRecognitionError(null);
      recognitionRef.current.lang = 'en-US'; // English dialogues
      
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting speech recognition for scenarios:', err);
        recognitionRef.current.stop();
      }
    }
  };

  const handleAnalyzeScenarioMessage = async (transcriptOverride?: string) => {
    const textToProcess = transcriptOverride || scenarioInputText;
    if (!textToProcess.trim()) return;

    setScenarioProcessing(true);
    setRecognitionError(null);

    // Filter current conversation history to feed to Gemini
    const chatHistory = scenarioMessages.map(msg => ({
      sender: msg.sender,
      text: msg.sender === 'coach' ? msg.textEn : msg.textAr
    }));

    try {
      const response = await fetch('/api/scenario-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenarioId: selectedScenario,
          history: chatHistory.slice(-6), // Send last 6 messages
          userMessage: textToProcess,
          provider: aiProvider
        })
      });

      if (!response.ok) {
        throw new Error('فشل جلب رد المعلم الافتراضي من خادم Gemini');
      }

      const data = await response.json();

      const studentMsgId = 'scen_user_' + Date.now();
      const coachMsgId = 'scen_coach_' + (Date.now() + 1);
      const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });

      const studentMsg: ScenarioMessage = {
        id: studentMsgId,
        sender: 'student',
        textEn: textToProcess,
        textAr: '',
        feedback: data.feedback,
        timestamp
      };

      const coachMsg: ScenarioMessage = {
        id: coachMsgId,
        sender: 'coach',
        textEn: data.coachReplyEn,
        textAr: data.coachReplyAr,
        pronunciation: data.pronunciation || '',
        timestamp
      };

      setScenarioMessages(prev => [...prev, studentMsg, coachMsg]);
      setScenarioInputText('');
      setScenarioHelperHint(data.helperHint || '');
      if (Array.isArray(data.usefulVocabulary)) {
        setScenarioVocabulary(data.usefulVocabulary);
      }

      // Automatically speak the tutor's English response out loud
      speakLoud(data.coachReplyEn, 'en-US', true);

    } catch (err) {
      console.error('Scenario processing failed:', err);
      setRecognitionError('مساعد المحاكاة لم يتمكن من معالجة نطقك. الرجاء المحاولة مجدداً.');
    } finally {
      setScenarioProcessing(false);
    }
  };

  const stopLectureSimulation = () => {
    setIsSimulatingLecture(false);
    setSimSegmentIdx(-1);
    setLiveInterimTranscript('');
    if (simTimerRef.current) {
      clearTimeout(simTimerRef.current);
      simTimerRef.current = null;
    }
    // Automatically compile and archive simulation sessions too on stop!
    compileAndSaveLectureSession();
  };

  // Toggle Continuous Microphone stream
  const toggleLectureListening = () => {
    if (isSimulatingLecture) {
      stopLectureSimulation();
    }
    
    if (!recognitionRef.current) {
      setRecognitionError('التعرف الصوتي غير متوفر على هذا المتصفح/الجهاز.');
      return;
    }

    if (isLectureListening) {
      isUserExplicitlyStopped.current = true;
      recognitionRef.current.stop();
      setIsLectureListening(false);
      
      // Automatically compile and store the entire session's Arabic/English side by side
      compileAndSaveLectureSession();
    } else {
      isUserExplicitlyStopped.current = false;
      // DO NOT clear lectureCaptions; let sentences accumulate normally so history is preserved
      setLiveInterimTranscript('');
      setRecognitionError(null);
      recognitionRef.current.lang = lectureLang;
      try {
        recognitionRef.current.start();
        setIsLectureListening(true);
      } catch (err) {
        console.error('Error starting live subtitles mic:', err);
        recognitionRef.current.stop();
        setIsLectureListening(false);
      }
    }
  };

  const handleSaveScenarioWordToVocabulary = async (word: string, translation: string, phonetic: string) => {
    try {
      await saveWord(userId, {
        id: 'vocab_scen_' + word.toLowerCase().replace(/[^a-z]/g, '') + '_' + Date.now().toString().slice(-6),
        english: word,
        arabic: `${translation} (موقف: ${SCENARIOS[selectedScenario]?.title.split('(')[0].trim()})`,
        phonetics: phonetic || '[صوتي]',
        category: 'محاكاة مواقف حية',
        exampleEn: `Used in the scenario exercise dialogue of LingoLens.`,
        exampleAr: 'مفردة حية مستخرجة ومحفوظة أثناء ممارسة التخاطب بالمواقف.'
      });
      setScenarioSaveStatuses(prev => ({ ...prev, [word]: true }));
      onWordIdentified();
    } catch (err) {
      console.error('Failed to save dialogue vocab: ', err);
    }
  };

  const handleSwapDirection = () => {
    setDirection(prev => prev === 'en_to_ar' ? 'ar_to_en' : 'en_to_ar');
    setInputText('');
    setResult(null);
    setRecognitionError(null);
  };

  // Handle continuous lecture caption translation
  const handleTranslateLectureSegment = async (sentence: string) => {
    if (!sentence.trim()) return;
    setLectureProcessing(true);

    if (translationEngine === 'local') {
      setTimeout(() => {
        const localRes = performLocalTranslation(sentence, 'en_to_ar');
        const vocabMapped = localRes.vocabulary.map(v => ({
          word: v.word,
          type: v.role,
          meaning: v.translation,
          phonetic: v.phonetics,
          explanation: v.guide
        }));
        const newCaption = {
          id: 'cap_local_' + Date.now(),
          english: sentence,
          arabic: localRes.translatedText,
          phonetics: localRes.phonetics || '',
          grammarTip: localRes.grammarInsight || '',
          exampleEn: sentence,
          exampleAr: localRes.translatedText,
          vocabulary: vocabMapped
        };
        // Append instead of prepend so translation flows downwards to the bottom!
        setLectureCaptions(prev => [...prev, newCaption]);
        setLectureProcessing(false);

        // Train local offline model immediately with this translated phrase!
        trainOfflineWithSession(sentence, localRes.translatedText, vocabMapped);
      }, 100);
      return;
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: sentence,
          fast: isTurboSpeedActive,
          provider: aiProvider
        })
      });

      if (!response.ok) {
        throw new Error('فشلت ترجمة المقطع');
      }

      const data = await response.json();
      const vocabData = Array.isArray(data.vocabulary) ? data.vocabulary : [];
      
      const newCaption = {
        id: 'cap_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        english: data.english || sentence,
        arabic: data.arabic || 'ترجمة فورية...',
        phonetics: data.phonetics || '',
        grammarTip: data.grammarTip || '',
        exampleEn: data.exampleEn || '',
        exampleAr: data.exampleAr || '',
        vocabulary: vocabData
      };

      setLectureCaptions(prev => [...prev, newCaption]);

      // Train local offline model immediately with this high-quality AI translation!
      trainOfflineWithSession(sentence, data.arabic || sentence, vocabData);
    } catch (err) {
      console.warn('Lecture segment translation failed, falling back to local matches:', err);
      const localRes = performLocalTranslation(sentence, 'en_to_ar');
      const vocabFallback = localRes.vocabulary.map(v => ({
        word: v.word,
        type: v.role,
        meaning: v.translation,
        phonetic: v.phonetics,
        explanation: v.guide
      }));
      const fallbackCaption = {
        id: 'cap_fallback_' + Date.now() + '_' + Math.floor(Math.random() * 10),
        english: sentence,
        arabic: `(محلي 📕): ${localRes.translatedText}`,
        phonetics: localRes.phonetics || '',
        grammarTip: `⚠️ [تنبيه اتصال] ${localRes.grammarInsight}`,
        exampleEn: sentence,
        exampleAr: localRes.translatedText,
        vocabulary: vocabFallback
      };
      setLectureCaptions(prev => [...prev, fallbackCaption]);

      // Train offline model from fallback translation too
      trainOfflineWithSession(sentence, localRes.translatedText, vocabFallback);
    } finally {
      setLectureProcessing(false);
    }
  };

  // Translate entire accumulated lecture at once with advanced multi-page formatting
  const handleTranslateEntireLecture = async () => {
    if (!lectureTranscriptText.trim()) {
      alert('يرجى التحدث أو تشغيل عينة المحاكاة أولاً لتسجيل حديث المحاضرة قبل المباشرة بالترجمة!');
      return;
    }
    setLectureProcessing(true);
    setLectureCurrentPageIdx(0);
    setLecturePaginatedResult(null);

    try {
      const response = await fetch('/api/translate-lecture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: lectureTranscriptText,
          provider: aiProvider
        })
      });

      if (!response.ok) {
        throw new Error('فشلت ترجمة وتقسيم المحاضرة في الخادم');
      }

      const data = await response.json();
      setLecturePaginatedResult(data);
      
      // Auto-train offline speech dictionary index silently with key vocabulary of all pages
      if (data.pages && data.pages.length > 0) {
        const wordsToTrain: any[] = [];
        data.pages.forEach((p: any) => {
          if (Array.isArray(p.keyVocabulary)) {
            p.keyVocabulary.forEach((v: any) => {
              wordsToTrain.push({
                word: v.word,
                meaning: v.meaning,
                type: 'nouns',
                phonetic: v.phonetic,
                explanation: 'مفرد لغة مستخلص من المحاضرة المقسمة'
              });
            });
          }
        });
        const fullEn = data.pages.map((p: any) => p.originalText).join(' ');
        const fullAr = data.pages.map((p: any) => p.translatedText).join(' ');
        trainOfflineWithSession(fullEn, fullAr, wordsToTrain);
      }

    } catch (err: any) {
      console.error('Failed lecturing pagination translation: ', err);
      alert('حدث خطأ أثناء الاتصال بالمعالج الذكي: ' + (err.message || 'فشلت معالجة النص الطويل. يرجى إعادة المحاولة.'));
    } finally {
      setLectureProcessing(false);
    }
  };

  // Automated simulation flow
  const startLectureSimulation = () => {
    if (isSimulatingLecture) {
      stopLectureSimulation();
      return;
    }
    
    // Clear old state & transcript to receive newly simulated lecture
    setLectureTranscriptText('');
    setLecturePaginatedResult(null);
    setLectureCurrentPageIdx(0);
    setIsSimulatingLecture(true);
    setLiveInterimTranscript('');
    setSimSegmentIdx(0);
  };

  // Run simulation timeline Typing effect & speaking segments
  useEffect(() => {
    if (!isSimulatingLecture || simSegmentIdx < 0) return;
    const topic = SIMULATED_LECTURE_TOPICS[selectedTopicIndex];
    if (simSegmentIdx >= topic.sentences.length) {
      setIsSimulatingLecture(false);
      setSimSegmentIdx(-1);
      return;
    }

    const currentSentence = topic.sentences[simSegmentIdx];
    
    // Stage 1: simulate interim streaming words typing onto the screen
    const words = currentSentence.split(' ');
    let currentWordIdx = 0;
    let accumulatedText = '';
    
    const typeInterval = setInterval(() => {
      if (currentWordIdx < words.length) {
        accumulatedText += (accumulatedText ? ' ' : '') + words[currentWordIdx];
        setLiveInterimTranscript(accumulatedText);
        currentWordIdx++;
      } else {
        clearInterval(typeInterval);
        
        // Stage 2: finalize sentence and append to raw transcript
        setLiveInterimTranscript('');
        setLectureTranscriptText(prev => prev + (prev ? ' ' : '') + currentSentence.trim());
        
        // No auto-pronunciation. User initiates pronunciation manually!

        // Stage 3: schedule next sentence after a natural pause
        simTimerRef.current = setTimeout(() => {
          setSimSegmentIdx(prev => prev + 1);
        }, 1200);
      }
    }, 120);

    return () => {
      clearInterval(typeInterval);
      if (simTimerRef.current) {
        clearTimeout(simTimerRef.current);
      }
    };
  }, [isSimulatingLecture, simSegmentIdx, selectedTopicIndex]);

  // Clean up lecture on unmount
  useEffect(() => {
    return () => {
      if (simTimerRef.current) {
        clearTimeout(simTimerRef.current);
      }
    };
  }, []);

  // Save specific extracted vocabulary from the live subtitles
  const handleSaveLectureVocabWord = async (word: string, translation: string, phonetic: string, originText: string) => {
    try {
      await saveWord(userId, {
        id: 'vocab_lect_' + word.toLowerCase().replace(/[^a-z]/g, '') + '_' + Date.now().toString().slice(-6),
        english: word,
        arabic: translation,
        phonetics: phonetic || '[صوتي بالنظارة]',
        category: 'مصطلحات ومحاضرات حية',
        exampleEn: `Extracted from live speaker feed: "${originText}"`,
        exampleAr: `مستخرجة تلقائياً للتحليل والنطق السليم.`
      });
      setLectureSavedWords(prev => ({ ...prev, [word]: true }));
      onWordIdentified();
    } catch (err) {
      console.error('Failed to save lecture vocab word: ', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6" dir="rtl">
      
      {/* Upper Navigation Toggle Mode bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white rounded-3xl border border-stone-200 shadow-sm gap-4">
        <div>
          <h3 className="text-xl font-black text-stone-900 leading-none">مدرب ومترجم اللغة الصوتي</h3>
          <p className="text-xs text-stone-500 font-semibold mt-1.5">اختر وضع النطق الفردي أو المحادثة ثنائية الاتجاه مع الطرف الآخر.</p>
        </div>
        
        {/* Navigation Swapper */}
        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 flex-wrap gap-1">
          <button
            onClick={() => {
              setActiveTab('coach');
              setRecognitionError(null);
            }}
            className={`px-3 py-1.5 font-black text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'coach' ? 'bg-[#8a9a5b] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles size={13} />
            <span>المدرب اللفظي</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('conversation');
              setRecognitionError(null);
            }}
            className={`px-3 py-1.5 font-black text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'conversation' ? 'bg-[#8a9a5b] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users size={13} />
            <span>مترجم المحادثات</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('scenario');
              setRecognitionError(null);
            }}
            className={`px-3 py-1.5 font-black text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'scenario' ? 'bg-[#8a9a5b] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Briefcase size={13} />
            <span>محاكاة مواقف حية</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('lecture');
              setRecognitionError(null);
            }}
            className={`px-3 py-1.5 font-black text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'lecture' ? 'bg-[#8a9a5b] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles size={13} className="text-amber-500 fill-amber-500 animate-pulse" />
            <span className="font-extrabold text-[#8a9a5b]">ترجمة المحاضرات والنظارة الذكية 👓</span>
          </button>
        </div>
      </div>

      {recognitionError && (
        <div className="bg-amber-50 text-amber-900 border border-amber-200 p-4 rounded-2xl text-xs font-bold leading-relaxed flex items-start gap-2.5">
          <Info size={15} className="shrink-0 text-amber-600 mt-0.5" />
          <span>{recognitionError}</span>
        </div>
      )}

      {/* --- WORKSPACE 1: COACHING MODE --- */}
      {activeTab === 'coach' && (
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-l from-[#8a9a5b]/10 to-transparent p-5 rounded-3xl border border-[#8a9a5b]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-stone-900 text-base leading-tight">مساعد نطق الحروف واللهجة الفردي (المعلم) 🗣️</h4>
              <p className="text-xs text-stone-500 font-semibold mt-1">تحدث بطلاقة وسيتولى المعلم تحليل نطقك ومستواك الصياغي بدقة.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleSwapDirection}
                className="bg-white hover:bg-stone-50 border border-stone-200 py-2 px-3.5 rounded-xl text-xs font-black text-stone-850 transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs"
              >
                <ArrowLeftRight size={13} className="text-[#8a9a5b]" />
                <span>اتجاه الترجمة:</span>
                <span className="text-[#8a9a5b]">
                  {direction === 'en_to_ar' ? 'الإنجليزية ➔ العربية' : 'العربية ➔ الإنجليزية'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className={`py-2 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border shadow-3xs ${
                  showAdvancedSettings 
                    ? 'bg-[#8a9a5b] text-white border-[#8a9a5b]' 
                    : 'bg-white hover:bg-stone-100 text-stone-750 border-stone-200'
                }`}
              >
                <Settings size={13} className={showAdvancedSettings ? 'animate-spin' : ''} />
                <span>أدوات الضبط والسرعة {showAdvancedSettings ? '▲' : '⚙️'}</span>
              </button>
            </div>
          </div>

          {/* Quick Control Options Dashboard (Collapsible) */}
          {showAdvancedSettings && (
            <div className="bg-stone-50 border border-stone-200 p-5 rounded-3xl flex flex-col gap-4 animate-in slide-in-from-top-3 duration-200 text-right">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-stone-200/50">
                <span className="p-2 rounded-xl bg-[#8a9a5b]/10 text-[#8a9a5b] flex items-center justify-center shrink-0">
                  <Sliders size={16} />
                </span>
                <div>
                  <h5 className="font-extrabold text-xs text-stone-900 leading-tight">الإعدادات المتقدمة لمعالجة الصوت والذكاء الاصطناعي 🎚️</h5>
                  <p className="text-[10px] text-stone-400 font-medium leading-normal">تخصيص سرعة المعالجة ونبرات الميكروفون المترابطة بالتطبيق.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-start">
                {/* Toggle 1: Continuous Listening */}
                <label className="bg-white hover:bg-stone-150 border border-stone-200 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-2 select-none text-[11px] font-black text-stone-700 transition-colors shadow-3xs">
                  <input 
                    type="checkbox" 
                    checked={isContinuousActive} 
                    onChange={(e) => setIsContinuousActive(e.target.checked)} 
                    className="rounded text-[#8a9a5b] focus:ring-[#8a9a5b] accent-[#8a9a5b] cursor-pointer h-3.5 w-3.5"
                  />
                  <span className="whitespace-nowrap">البث الصوتي المستمر 🎙️</span>
                </label>

                {/* Toggle 2: Turbo Speed Mode */}
                <label className="bg-white hover:bg-stone-150 border border-stone-200 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-2 select-none text-[11px] font-black text-stone-700 transition-colors shadow-3xs">
                  <input 
                    type="checkbox" 
                    checked={isTurboSpeedActive} 
                    onChange={(e) => setIsTurboSpeedActive(e.target.checked)} 
                    className="rounded text-[#8a9a5b] focus:ring-[#8a9a5b] accent-[#8a9a5b] cursor-pointer h-3.5 w-3.5"
                  />
                  <span className="whitespace-nowrap">ترجمة فورية فائقة السرعة ⚡</span>
                </label>

                {/* Toggle 3: Auto-Translate */}
                <label className="bg-white hover:bg-stone-150 border border-stone-200 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-2 select-none text-[11px] font-black text-stone-700 transition-colors shadow-3xs">
                  <input 
                    type="checkbox" 
                    checked={isAutoTranslateActive} 
                    onChange={(e) => setIsAutoTranslateActive(e.target.checked)} 
                    className="rounded text-[#8a9a5b] focus:ring-[#8a9a5b] accent-[#8a9a5b] cursor-pointer h-3.5 w-3.5"
                  />
                  <span className="whitespace-nowrap">الترجمة الصامتة التلقائية 🤖</span>
                </label>

                {/* Selector 4: Translation Engine Mode (AI Hybrid vs Local Offline Dictionary Only) */}
                <div className="bg-white border border-stone-200 rounded-xl px-2.5 py-1 flex items-center gap-2 text-[11px] font-black text-stone-700 shadow-3xs">
                  <span className="text-stone-400 font-extrabold text-[10px]">المطابقة القاموسية:</span>
                  <div className="flex bg-stone-50 p-0.5 rounded-lg border border-stone-100">
                    <button 
                      type="button"
                      onClick={() => setTranslationEngine('hybrid')} 
                      className={`px-2 py-1 rounded-md text-[10px] tracking-tight transition-all cursor-pointer font-black ${
                        translationEngine === 'hybrid' 
                          ? 'bg-[#8a9a5b] text-white shadow-3xs' 
                          : 'text-stone-400 hover:text-stone-700'
                      }`}
                    >
                      مختلط (ذكاء + قاموس)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTranslationEngine('local')} 
                      className={`px-2 py-1 rounded-md text-[10px] tracking-tight transition-all cursor-pointer font-black ${
                        translationEngine === 'local' 
                          ? 'bg-[#8a9a5b] text-white shadow-3xs' 
                          : 'text-stone-400 hover:text-stone-700'
                      }`}
                    >
                      القاموس فقط 📕
                    </button>
                  </div>
                </div>

                {/* Selector 5: AI Provider Selection (Gemini Cloud vs Ollama Local) */}
                <div className="bg-white border border-stone-200 rounded-xl px-2.5 py-1 flex items-center gap-2 text-[11px] font-black text-stone-700 shadow-3xs">
                  <span className="text-stone-400 font-extrabold text-[10px]">معالج ومحرك الذكاء:</span>
                  <div className="flex bg-stone-50 p-0.5 rounded-lg border border-stone-100">
                    <button 
                      type="button"
                      onClick={() => {
                        setAiProvider('gemini');
                        localStorage.setItem('lingolens_ai_provider', 'gemini');
                      }} 
                      className={`px-2 py-1 rounded-md text-[10px] tracking-tight transition-all cursor-pointer font-black ${
                        aiProvider === 'gemini' 
                          ? 'bg-[#8a9a5b] text-white shadow-3xs' 
                          : 'text-stone-400 hover:text-stone-700'
                      }`}
                    >
                      Gemini (سحابي) ☁️
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setAiProvider('ollama');
                        localStorage.setItem('lingolens_ai_provider', 'ollama');
                      }} 
                      className={`px-2 py-1 rounded-md text-[10px] tracking-tight transition-all cursor-pointer font-black ${
                        aiProvider === 'ollama' 
                          ? 'bg-[#8a9a5b] text-white shadow-3xs' 
                          : 'text-stone-400 hover:text-stone-700'
                      }`}
                    >
                      Ollama (محلي) 🦙
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab Navigation inside Coach */}
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 self-start">
            <button
              type="button"
              onClick={() => {
                setCoachSubMode('trainer');
                if (isListening) {
                  try { recognitionRef.current?.stop(); } catch (e) {}
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                coachSubMode === 'trainer'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/50'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sparkles size={13} className="text-[#8a9a5b]" />
              <span>المترجم والمستشار الذكي 🤖</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCoachSubMode('scoring');
                if (isListening) {
                  try { recognitionRef.current?.stop(); } catch (e) {}
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                coachSubMode === 'scoring'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/50'
                  : 'text-stone-500 hover:text-stone-850'
              }`}
            >
              <Award size={13} className="text-amber-500 animate-pulse" />
              <span>معمل التقييم الصوتي (Voice Scoring) 🎙️⭐</span>
            </button>
          </div>

          {coachSubMode === 'trainer' ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Mic Dial Card */}
            <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between min-h-[340px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[#8a9a5b] text-[10px] uppercase font-black">سجل صوتك للقياس</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" style={{ display: isListening ? 'block' : 'none' }} />
              </div>

              <div className="flex-1 flex flex-col justify-center items-center gap-4 my-6">
                <button
                  onClick={toggleListening}
                  disabled={processing}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer select-none shadow-md ${
                    isListening 
                      ? 'bg-red-500 text-white ring-4 ring-red-100 scale-105' 
                      : (processing ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed' : 'bg-[#8a9a5b] hover:bg-[#7a8a4b] active:scale-95 text-white ring-4 ring-[#8a9a5b]/10')
                  }`}
                >
                  {isListening ? <MicOff size={36} className="animate-pulse" /> : <Mic size={36} />}
                </button>

                {isListening ? (
                  <div className="flex justify-center items-center gap-1.5 h-6">
                    {[1, 2, 3, 4, 1, 2, 3].map((v, i) => (
                      <span 
                        key={i} 
                        className="w-1 bg-red-400 rounded-full animate-bounce duration-500"
                        style={{ height: `${12 + v * 5}px`, animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center font-black text-xs text-stone-850">
                    {processing ? 'جار تحليل الملف اللفظي...' : 'اضغط على الميكروفون وتحدث الآن!'}
                  </p>
                )}
              </div>

              <div className="mt-auto border-t border-stone-100 pt-4">
                <div className="flex gap-2">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={direction === 'en_to_ar' ? 'اكتب جملتك بالإنجليزية هنا...' : 'اكتب جملتك بالعربية هنا...'}
                    className="flex-1 text-xs p-2.5 border border-stone-200 rounded-2xl h-14 font-semibold text-stone-850 focus:outline-none focus:ring-2 focus:ring-[#8a9a5b] bg-[#fbfbf9]"
                  />
                  <button
                    onClick={() => handleAnalyzeSpeech()}
                    disabled={processing || !inputText.trim()}
                    className={`px-3.5 py-2.5 rounded-2xl shrink-0 font-black text-xs transition-all cursor-pointer flex items-center justify-center ${
                      processing || !inputText.trim() ? 'bg-stone-100 text-stone-400' : 'bg-[#8a9a5b] text-white hover:bg-[#7a8a4b]'
                    }`}
                  >
                    {processing ? <Loader2 className="animate-spin" size={14} /> : 'حلل'}
                  </button>
                </div>
              </div>
            </div>

            {/* Coach result layout */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {processing && (
                <div className="bg-white p-12 rounded-3xl border border-stone-200 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin text-[#8a9a5b] mb-1" size={32} />
                  <h4 className="text-stone-850 font-black text-sm">يقوم مساعد Gemini بتقييم لفظك وصياغاتك...</h4>
                  <p className="text-[10px] text-stone-400">نقارن اللهجات، ونبني لك تعابير بديلة هامة.</p>
                </div>
              )}

              {result && !processing && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                  <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-center text-[10px] text-stone-400 font-extrabold">
                      <span className="bg-[#8a9a5b]/10 text-[#5a6a3b] px-2.5 py-1 rounded-lg">📁 سياق: {result.category}</span>
                      <span>مراجعة العبارة</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-stone-100">
                      <div className="flex flex-col gap-1 pb-3 md:pb-0">
                        <span className="text-[9px] font-black text-stone-400 uppercase">ما قيل باللفظ:</span>
                        <p className={`text-sm font-bold text-stone-900 mt-1 ${direction === 'en_to_ar' ? 'text-left font-serif' : 'text-right'}`}>
                          {result.originalText}
                        </p>
                        {direction === 'en_to_ar' && (
                          <span className="text-[9px] text-stone-400 font-mono mt-1">🔊 Phonetics: {result.phonetics}</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 pt-3 md:pt-0 md:pr-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-stone-400 uppercase">ترجمة المعلم المحكمة:</span>
                          <button
                            onClick={() => {
                              speakLoud(result.translatedText, direction === 'en_to_ar' ? 'ar-SA' : 'en-US');
                            }}
                            className="text-[#8a9a5b] hover:text-[#5a6a3b] p-1 rounded-lg hover:bg-[#8a9a5b]/10 transition-all flex items-center gap-1 cursor-pointer text-[10px] font-black"
                            title="تشغيل نطق الترجمة بصوت مسموع"
                          >
                            <Volume2 size={13} />
                            <span>تشغيل الصوت 🔊</span>
                          </button>
                        </div>
                        <p className={`text-sm font-black text-[#5a6a3b] mt-1 ${direction === 'ar_to_en' ? 'text-left font-serif' : 'text-right'}`}>
                          {result.translatedText}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-stone-100 pt-3 flex justify-between items-center">
                      <span className="text-[9px] text-stone-400">بإمكانك حفظ هذه العبارة كاملة كبطاقة جاهزة ببرنامج التقييم الذاتي.</span>
                      <button
                        onClick={handleSaveFullSentence}
                        disabled={savedWordsMap['__full_phrase__']}
                        className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer ${
                          savedWordsMap['__full_phrase__'] ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white border-stone-200 text-stone-700'
                        }`}
                      >
                        {savedWordsMap['__full_phrase__'] ? <Check size={11} /> : <Bookmark size={11} />}
                        <span>{savedWordsMap['__full_phrase__'] ? 'محفوظة بالقاموس' : 'احفظ العبارة'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Fluency Score Card */}
                  {result.scores && result.scores.fluency !== undefined && (
                    <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-4">
                      <span className="text-[11px] font-black text-[#5a6a3b] uppercase flex items-center gap-1.5">
                        <Award size={13} />
                        تحليل جودة نغمة اللفظ (Fluency & Spoken Scores)
                      </span>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#fbfbf9] p-3 rounded-2xl border border-stone-150 flex flex-col items-center">
                          <span className="text-[9px] font-black text-stone-400">الطلاقة اللفظية</span>
                          <span className="text-xl font-black font-mono text-[#8a9a5b] mt-1">{result.scores?.fluency}%</span>
                        </div>
                        <div className="bg-[#fbfbf9] p-3 rounded-2xl border border-stone-150 flex flex-col items-center">
                          <span className="text-[9px] font-black text-stone-400">الاختيار القواعدي</span>
                          <span className="text-xl font-black font-mono text-stone-800 mt-1">{result.scores?.vocabulary}%</span>
                        </div>
                        <div className="bg-[#fbfbf9] p-3 rounded-2xl border border-stone-150 flex flex-col items-center">
                          <span className="text-[9px] font-black text-stone-400">درجة التعقيد</span>
                          <span className="text-xl font-black font-mono text-stone-850 mt-1">{result.scores?.complexity}%</span>
                        </div>
                      </div>

                      {result.scores?.feedback && (
                        <div className="bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100 text-right text-xs">
                          <p className="font-bold text-stone-850 flex items-center gap-1">
                            <TrendingUp size={12} className="text-emerald-600" />
                            <span>توجيه المدرب الشخصي: {result.scores.feedback}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
                               {/* --- LOCAL DICTIONARY MANAGEMENT INTERACTIVE WIDGET --- */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
              <button
                type="button"
                onClick={() => setShowDictionaryGroup(!showDictionaryGroup)}
                className="flex items-center gap-2.5 text-right cursor-pointer group select-none"
              >
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Bookmark size={18} />
                </span>
                <div className="text-right">
                  <h4 className="font-extrabold text-stone-900 text-sm leading-tight flex items-center gap-1.5 justify-start">
                    <span>دفتر المفردات والقاموس الشخصي الفوري 📕</span>
                    <span className="text-[10px] text-[#8a9a5b] font-black">
                      {showDictionaryGroup ? '▲ إخفاء الكلمات المعقدة' : '▼ استعراض تفاصيل القاموس'}
                    </span>
                  </h4>
                  <p className="text-[10px] text-stone-500 font-bold mt-0.5">مفرداتك المخصصة وتدريبات الاختبار الذاتي السريعة.</p>
                </div>
              </button>

              <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                <div className="bg-amber-50 border border-amber-250/60 text-[10px] text-amber-850 px-2.5 py-1 rounded-xl font-black font-mono">
                  🎰 إجمالي المسجل: {Object.keys(DEFAULT_LOCAL_DICTIONARY).length + Object.keys(customDictionary).length} مفردة
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !quizActive;
                    setQuizActive(nextMode);
                    if (nextMode) {
                      setShowDictionaryGroup(true);
                      generateQuizQuestion(customDictionary);
                    }
                  }}
                  className={`px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-3xs ${
                    quizActive ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500'
                  }`}
                >
                  {quizActive ? '✖ إغلاق الاختبار' : '🎯 ميني اختبار ذكي'}
                </button>
              </div>
            </div>

            {showDictionaryGroup && (
              <div className="mt-3 pt-4 border-t border-stone-100 flex flex-col gap-6 animate-in fade-in duration-250">

            {/* IF ACTIVE INTERACTIVE QUIZ MODE */}
            {quizActive && currentQuizQuestion ? (
              <div className="bg-gradient-to-br from-amber-50/40 to-stone-50 border border-amber-250 p-5 rounded-2xl text-right flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-amber-105 text-amber-800 px-2 py-0.5 rounded-lg font-black">{currentQuizQuestion.category}</span>
                  <div className="text-xs font-black text-stone-700">النقاط الحالية: ⭐ {quizScore}</div>
                </div>

                <div className="text-center py-4">
                  <p className="text-[10px] text-stone-400 font-bold mb-1">ما هو المعنى الصحيح لهذه العبارة؟</p>
                  <h5 className="text-xl font-serif font-black text-stone-900 ltr mb-2 text-center" dir="ltr">{currentQuizQuestion.word}</h5>
                  {currentQuizQuestion.phonetics && (
                    <div className="inline-flex items-center gap-1.5 bg-stone-100 px-2 py-0.5 rounded-md text-[10px] font-mono text-stone-500 cursor-pointer" onClick={() => speakLoud(currentQuizQuestion.word, 'en-US')}>
                      <Volume2 size={10} className="text-stone-400" />
                      <span>{currentQuizQuestion.phonetics}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" dir="rtl">
                  {currentQuizQuestion.options.map((option, idx) => {
                    const isSelected = selectedQuizAnswer === option;
                    const isCorrectOption = option === currentQuizQuestion.correctTranslation;
                    let optionBg = "bg-white border-stone-200 hover:bg-amber-50/50";
                    
                    if (selectedQuizAnswer) {
                      if (isCorrectOption) {
                        optionBg = "bg-green-100 border-green-400 text-green-900 font-extrabold";
                      } else if (isSelected) {
                        optionBg = "bg-red-105 border-red-400 text-red-900 font-extrabold";
                      } else {
                        optionBg = "bg-white border-stone-200 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={'quiz_opt_' + idx}
                        type="button"
                        disabled={!!selectedQuizAnswer}
                        onClick={() => {
                          setSelectedQuizAnswer(option);
                          const isMatch = option === currentQuizQuestion.correctTranslation;
                          if (isMatch) {
                            setQuizScore(prev => prev + 10);
                            setQuizFeedback("🎉 إجابة صائبة وصحيحة تماماً! أحسنت.");
                          } else {
                            setQuizFeedback(`❌ خطأ! الإجابة الصائبة هي: "${currentQuizQuestion.correctTranslation}"`);
                          }
                        }}
                        className={`p-3 text-right text-xs rounded-xl border transition-all cursor-pointer ${optionBg}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {quizFeedback && (
                  <div className="text-center font-black text-xs text-stone-850 bg-white border border-stone-200 px-3 py-2 rounded-xl">
                    {quizFeedback}
                  </div>
                )}

                <div className="flex justify-between items-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuizActive(false);
                    }}
                    className="text-xs text-stone-500 hover:text-stone-800 font-bold"
                  >
                    تجاوز وإغلاق اللعبة
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      generateQuizQuestion(customDictionary);
                    }}
                    className="bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white py-1.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer shadow-3xs"
                  >
                    المفردة التالية ➔
                  </button>
                </div>
              </div>
            ) : (
              /* Sub-grid 1: Register New Word Form + Backup Actions Group */
              <div className="bg-[#fbfbf9] border border-stone-200/70 p-4.5 rounded-2xl text-right">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3 border-b border-stone-100 pb-2">
                  <h5 className="text-[11px] font-black text-[#5a6a3b] flex items-center justify-start gap-1.5">
                    <span>✨ تسجيل مفردة أو عبارة جديدة بالقاموس:</span>
                  </h5>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={exportCustomDictionary}
                      className="text-[10px] text-stone-605 hover:text-stone-900 font-extrabold flex items-center gap-1 cursor-pointer bg-white border border-stone-200 px-2.5 py-1 rounded-lg shadow-3xs"
                      title="تحميل نسخة احتياطية من قاموسك الشخصي بصيغة جيسون"
                    >
                      📥 تصدير القاموس
                    </button>
                    <label className="text-[10px] text-stone-605 hover:text-stone-900 font-extrabold flex items-center gap-1 cursor-pointer bg-white border border-stone-200 px-2.5 py-1 rounded-lg shadow-3xs">
                      📤 استيراد القاموس
                      <input
                        type="file"
                        accept=".json"
                        onChange={importCustomDictionary}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1 items-end">
                    <label className="text-[10px] text-stone-400 font-extrabold">الكلمة بالإنجليزية (English):</label>
                    <input 
                      type="text" 
                      value={newDictWordEn}
                      onChange={(e) => setNewDictWordEn(e.target.value)}
                      placeholder="e.g. key performance indicators"
                      className="w-full p-2 border border-stone-200 text-xs rounded-xl bg-white font-serif font-bold text-stone-900 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <label className="text-[10px] text-stone-400 font-extrabold">الترجمة بالعربية (Arabic):</label>
                    <input 
                      type="text" 
                      value={newDictWordAr}
                      onChange={(e) => setNewDictWordAr(e.target.value)}
                      placeholder="e.g. مؤشرات الأداء الرئيسية"
                      className="w-full p-2 border border-stone-200 text-xs rounded-xl bg-white font-semibold text-stone-900 text-right"
                      dir="rtl"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <label className="text-[10px] text-stone-400 font-extrabold">النطق الصوتي التقريبي [اختياري]:</label>
                    <input 
                      type="text" 
                      value={newDictPhonetics}
                      onChange={(e) => setNewDictPhonetics(e.target.value)}
                      placeholder="e.g. [kiː pəˈfɔːməns]"
                      className="w-full p-2 border border-stone-200 text-xs rounded-xl bg-white font-mono text-stone-450 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <label className="text-[10px] text-stone-400 font-extrabold">تصنيف العبارة:</label>
                    <select 
                      value={newDictCategory}
                      onChange={(e) => setNewDictCategory(e.target.value)}
                      className="w-full p-2 border border-stone-200 text-xs rounded-xl bg-white font-semibold text-stone-850 text-right cursor-pointer"
                      dir="rtl"
                    >
                      <option value="مفردات المقابلة 💼">مفردات المقابلة 💼</option>
                      <option value="تعبيرات المحادثة 💬">تعبيرات المحادثة 💬</option>
                      <option value="مصطلحات تكنولوجية 💻">مصطلحات تكنولوجية 💻</option>
                      <option value="عبارات المطار والسفر ✈️">عبارات المطار والسفر ✈️</option>
                      <option value="أسلوب مهذب وعام 🌸">أسلوب مهذب وعام 🌸</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 mt-4 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newDictWordEn.trim() || !newDictWordAr.trim()) {
                        alert('يرجى ملء الكلمة بالإنجليزية والترجمة بالعربية أولاً');
                        return;
                      }
                      const updated = {
                        ...customDictionary,
                        [newDictWordEn.trim()]: {
                          arabic: newDictWordAr.trim(),
                          phonetics: newDictPhonetics.trim() || '[مخصص صوتي]',
                          category: newDictCategory
                        }
                      };
                      saveCustomDictionaryToDisk(updated);
                      setNewDictWordEn('');
                      setNewDictWordAr('');
                      setNewDictPhonetics('');
                    }}
                    className="bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white py-1.5 px-5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-3xs active:scale-95 select-none"
                  >
                    أضف إلى القاموس المحلي 💾
                  </button>
                </div>
              </div>
            )}



            {/* Sub-grid 2: Dictionary Search and Mappings Display */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2.5">
                {/* Search Text Input */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input 
                    type="text"
                    value={dictSearchQuery}
                    onChange={(e) => setDictSearchQuery(e.target.value)}
                    placeholder="🔍 اكتب أي كلمة بالإنجليزية أو العربية للبحث الفوري عنها بالقاموس..."
                    className="w-full p-2.5 border border-stone-200 text-xs rounded-xl bg-white font-semibold text-stone-800 text-right shadow-3xs"
                    dir="rtl"
                  />
                  
                  {dictSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => setDictSearchQuery('')}
                      className="text-xs text-stone-400 hover:text-stone-800 font-extrabold shrink-0"
                    >
                      إعادة تعيين ✖
                    </button>
                  )}
                </div>

                {/* --- FILTERS PILL BAR --- */}
                <div className="flex flex-wrap gap-1.5 justify-start md:justify-end" dir="rtl">
                  {[
                    { id: 'all', label: '🌍 الكل' },
                    { id: 'مفردات المقابلة 💼', label: '💼 مقابلة العمل' },
                    { id: 'تعبيرات المحادثة 💬', label: '💬 المحادثات' },
                    { id: 'مصطلحات تكنولوجية 💻', label: '💻 التكنولوجيا' },
                    { id: 'عبارات المطار والسفر ✈️', label: '✈️ السفر والمطار' },
                    { id: 'أسلوب مهذب وعام 🌸', label: '🌸 عام ومهذب' },
                    { id: 'custom_only', label: '⭐ بطاقاتي المخصصة' }
                  ].map((pill) => {
                    const isSelected = dictCategoryFilter === pill.id;
                    return (
                      <button
                        key={'pill_' + pill.id}
                        type="button"
                        onClick={() => setDictCategoryFilter(pill.id)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all font-black cursor-pointer ${
                          isSelected 
                            ? 'bg-[#8a9a5b] text-white border-[#8a9a5b] shadow-2xs' 
                            : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100 hover:text-stone-700'
                        }`}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List entries */}
              <div className="max-h-[280px] overflow-y-auto divide-y divide-stone-100 border border-stone-150 rounded-2xl p-1 bg-[#faf9f6]/40">
                {(() => {
                  const query = dictSearchQuery.toLowerCase().trim();
                  
                  // Filter presets
                  const matchedPresets = Object.entries(DEFAULT_LOCAL_DICTIONARY).filter(([key, val]) => {
                    const matchesSearch = key.toLowerCase().includes(query) || val.ar.includes(query) || val.category.includes(query);
                    const matchesPill = dictCategoryFilter === 'all' || 
                                       (dictCategoryFilter !== 'custom_only' && val.category.includes(dictCategoryFilter));
                    return matchesSearch && matchesPill;
                  });

                  // Filter customs
                  const matchedCustoms = (Object.entries(customDictionary) as Array<[string, { arabic: string; phonetics: string; category: string }]>).filter(([key, val]) => {
                    const matchesSearch = key.toLowerCase().includes(query) || val.arabic.includes(query) || val.category.includes(query);
                    const matchesPill = dictCategoryFilter === 'all' || 
                                       dictCategoryFilter === 'custom_only' || 
                                       val.category.includes(dictCategoryFilter);
                    return matchesSearch && matchesPill;
                  });

                  if (matchedPresets.length === 0 && matchedCustoms.length === 0) {
                    return (
                      <p className="text-center font-bold text-xs text-stone-400 py-8">
                        ℹ️ لم يتم العثور على أي نتائج مطابقة في التصنيف المحدد حالياً.
                      </p>
                    );
                  }

                  return (
                    <div className="flex flex-col">
                      {/* Show custom matches first */}
                      {matchedCustoms.map(([key, val]) => (
                        <div key={'custom_' + key} className="p-3 hover:bg-white flex items-center justify-between gap-3 text-right group transition-all">
                          <div className="text-right">
                            <span className="bg-amber-100 text-amber-750 font-black text-[9px] px-1.5 py-0.5 rounded-md ml-1.5 inline-block animate-pulse">قاموسك المخصص 📕</span>
                            <span className="font-serif font-black text-xs text-stone-900 leading-none">{key}</span>
                            <span className="text-[10px] text-[#8a9a5b] font-black block mt-1">
                              ➔ {val.arabic} <span className="text-stone-400 font-mono text-[9px] cursor-pointer" onClick={() => speakLoud(key, 'en-US')} title="استمع للنطق الصوتي">🔊 {val.phonetics}</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-lg font-bold">{val.category}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = { ...customDictionary };
                                delete copy[key];
                                saveCustomDictionaryToDisk(copy);
                              }}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              title="حذف المفردة"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Show presetted default words */}
                      {matchedPresets.map(([key, val]) => (
                        <div key={'preset_' + key} className="p-3 hover:bg-white flex items-center justify-between gap-3 text-right group transition-all">
                          <div className="text-right">
                            <span className="bg-stone-100 text-stone-600 font-black text-[9px] px-1.5 py-0.5 rounded-md ml-1.5 inline-block">قاموس مدمج 💻</span>
                            <span className="font-serif font-black text-xs text-[#5a6a3b] leading-none">{key}</span>
                            <span className="text-[10px] text-stone-850 font-extrabold block mt-1">
                              ➔ {val.ar} <span className="text-stone-400 font-mono text-[9px] cursor-pointer" onClick={() => speakLoud(key, 'en-US')} title="استمع للنطق الصوتي">🔊 {val.phonetics}</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-stone-50 text-stone-400 border border-stone-100 px-2 py-0.5 rounded-lg font-bold">{val.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : (
            <div className="bg-white border border-stone-200 p-6 rounded-3xl flex flex-col gap-6 animate-in fade-in duration-300">
              {/* Title & Introduction block */}
              <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-500 flex items-center justify-center">
                  <Award size={24} />
                </div>
                <div className="text-right">
                  <h4 className="font-extrabold text-stone-900 text-sm">معمل التقييم الصوتي والتصحيح اللفظي الفوري (Voice Scoring Lab) ⭐🎙️</h4>
                  <p className="text-[11px] text-stone-500 font-semibold mt-0.5 leading-normal">تحدث عبر الميكروفون وسيتولى التطبيق تحليل جودة نطقك ومخارج الحروف لكل كلمة ونطق العبارات الصعبة بمقاس النجوم والنسب بدقة!</p>
                </div>
              </div>

              {/* Grid for practice: challenges list vs active practice card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Challenges Left-Rail Pane */}
                <div className="lg:col-span-4 flex flex-col gap-3 text-right">
                  <span className="text-[10px] text-stone-405 font-extrabold uppercase tracking-wider block text-right">1. اختر عبارة نموذجية للتحدي:</span>
                  <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                    {PRONUNCIATION_CHALLENGES.map((ch) => {
                      const isSelected = scoringChallengeText === ch.textEn || scoringChallengeText === ch.textAr;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => {
                            setScoringChallengeText(ch.lang === 'en-US' ? ch.textEn : ch.textAr);
                            setScoringLanguage(ch.lang as 'en-US' | 'ar-SA');
                            setScoringSpokenText('');
                            setScoringResult(null);
                            if (isListening) {
                              try { recognitionRef.current?.stop(); } catch (e) {}
                            }
                          }}
                          className={`p-3 rounded-2xl text-right transition-all cursor-pointer border flex flex-col gap-1.5 ${
                            isSelected
                              ? 'bg-amber-50/70 border-amber-250/60 shadow-xs'
                              : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[9px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded-md font-extrabold">{ch.category}</span>
                            <span className="text-[9px] text-[#5a6a3b] font-extrabold">{ch.lang === 'en-US' ? '🇬🇧 English' : '🇸🇦 العربية'}</span>
                          </div>
                          <p className={`text-[11px] font-bold ${ch.lang === 'en-US' ? 'text-left font-serif text-stone-850' : 'text-right text-stone-850'}`}>
                            {ch.lang === 'en-US' ? ch.textEn : ch.textAr}
                          </p>
                          <span className="text-[9px] text-stone-400 font-semibold truncate leading-none">
                            ➔ {ch.lang === 'en-US' ? ch.textAr : ch.textEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Text input */}
                  <div className="border-t border-stone-100 pt-3 mt-1 flex flex-col gap-2 text-right">
                    <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider">أو تدرّب على صياغتك الحرة والخاصة:</span>
                    
                    <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-100 self-start text-[9px] font-bold">
                      <button
                        type="button"
                        onClick={() => setScoringLanguage('en-US')}
                        className={`px-2.5 py-1 rounded-md transition-all ${scoringLanguage === 'en-US' ? 'bg-white text-stone-950 shadow-3xs' : 'text-stone-500 hover:text-stone-800'}`}
                      >
                        الإنجليزية 🇬🇧
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoringLanguage('ar-SA')}
                        className={`px-2.5 py-1 rounded-md transition-all ${scoringLanguage === 'ar-SA' ? 'bg-white text-stone-950 shadow-3xs' : 'text-stone-500 hover:text-stone-800'}`}
                      >
                        العربية 🇸🇦
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      <textarea
                        value={scoringChallengeText}
                        onChange={(e) => {
                          setScoringChallengeText(e.target.value);
                          setScoringResult(null);
                          setScoringSpokenText('');
                          if (isListening) {
                            try { recognitionRef.current?.stop(); } catch (err) {}
                          }
                        }}
                        placeholder="اكتب عباراتك الخاصة هنا للتحدي..."
                        className="flex-1 text-xs p-2.5 border border-stone-200 rounded-xl h-16 font-semibold bg-[#fcfcfb] focus:outline-none focus:ring-2 focus:ring-amber-400 text-right"
                      />
                    </div>

                    {result?.originalText && (
                      <button
                        type="button"
                        onClick={() => {
                          setScoringChallengeText(direction === 'en_to_ar' ? result.originalText : result.translatedText);
                          setScoringLanguage(direction === 'en_to_ar' ? 'en-US' : 'ar-SA');
                          setScoringSpokenText('');
                          setScoringResult(null);
                        }}
                        className="self-start text-[10px] text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 bg-amber-50/55 hover:bg-amber-100 border border-amber-200/50 px-2.5 py-1 rounded-xl transition-all cursor-pointer mt-1"
                      >
                        <Copy size={11} />
                        <span>تحميل وتحليل ترجمتك الذكية الأخيرة 📥</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Active scoring lab container right side */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-2 mb-1 flex-wrap w-full">
                    <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider block text-right">2. لوحة التسجيل ومصحح مخارج الحروف:</span>
                    
                    {/* Advanced Teacher Mode Selector */}
                    <div className="flex bg-stone-100 p-1 rounded-xl self-end border border-stone-200 text-[10px] font-black items-center gap-1 shadow-3xs">
                      <button
                        type="button"
                        onClick={() => {
                          setUseAiPronunciationTeacher(false);
                          setScoringResult(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          !useAiPronunciationTeacher
                            ? 'bg-white text-stone-850 shadow-3xs border border-stone-200/60 font-black'
                            : 'text-stone-500 hover:text-stone-850'
                        }`}
                      >
                        ⚡ مُقيّم المطابقة السريع
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseAiPronunciationTeacher(true);
                          setScoringResult(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          useAiPronunciationTeacher
                            ? 'bg-amber-500 text-white shadow-3xs font-black'
                            : 'text-stone-500 hover:text-amber-700'
                        }`}
                      >
                        🎓 المعلم الذكي ومصحح مخارج الحروف (Gemini AI)
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Toast Message Indicator */}
                  {scoringToast && (
                    <div className="bg-emerald-500 text-white text-xs font-black p-3 rounded-2xl flex justify-between items-center shadow-xs animate-in slide-in-from-top-2 duration-300">
                      <span>{scoringToast}</span>
                      <button type="button" onClick={() => setScoringToast(null)} className="text-white hover:opacity-80 font-black bg-emerald-600/50 rounded px-2 py-0.5 text-[10px]">إغلاق ✕</button>
                    </div>
                  )}

                  {/* Main practicing card */}
                  <div className="bg-stone-50 p-5 rounded-3xl border border-stone-200 flex flex-col gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-linear-to-l from-amber-400 to-transparent" />
                    
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-1 text-right flex-1">
                        <span className="text-[9px] font-black text-amber-600 tracking-tight">العبارة المستهدفة بالنطق (Target Phrase):</span>
                        <h5 className={`text-sm font-black text-stone-900 leading-snug mt-1 ${scoringLanguage === 'en-US' ? 'text-left font-serif' : 'text-right'}`}>
                          {scoringChallengeText}
                        </h5>
                        
                        {/* Phonetic Display */}
                        {scoringLanguage === 'en-US' && (
                          <div className="mt-1.5 flex select-none">
                            <span className="text-[9px] text-[#5a6a3b] font-black bg-[#8a9a5b]/10 border border-[#8a9a5b]/15 px-2 py-0.5 rounded-lg leading-none">
                              {PRONUNCIATION_CHALLENGES.find(c => c.textEn === scoringChallengeText)?.phonetics || "Standard Accent Guideline"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Natural Pronunciation Volume trigger */}
                      <button
                        type="button"
                        onClick={() => speakLoud(scoringChallengeText, scoringLanguage)}
                        className="p-2 bg-white hover:bg-stone-100 hover:scale-[1.02] active:scale-95 text-stone-800 border border-stone-200 rounded-xl transition-all cursor-pointer shadow-3xs shrink-0 flex items-center gap-1 text-[11px] font-extrabold ml-2"
                        title="استمع إلى اللفظ المطلوب لتقليده"
                      >
                        <Volume2 size={13} className="text-amber-505" />
                        <span>استمع للنطق 🔊</span>
                      </button>
                    </div>

                    {/* Microphone Dial Center */}
                    <div className="border-t border-stone-200/50 pt-5 flex flex-col items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer select-none shadow-md ${
                          isListening
                            ? 'bg-red-500 scale-105 text-white ring-4 ring-red-100'
                            : 'bg-amber-500 hover:bg-amber-600 hover:scale-[1.02] text-white ring-4 ring-amber-100 active:scale-95'
                        }`}
                      >
                        {isListening ? <MicOff size={28} className="animate-pulse" /> : <Mic size={28} />}
                      </button>

                      {isListening ? (
                         <div className="text-center flex flex-col items-center gap-1.5 w-full">
                           <div className="flex justify-center items-center gap-1.5 h-6 mb-1">
                             {[1, 2, 3, 4, 3, 2, 1, 3, 2].map((v, i) => (
                               <span
                                 key={i}
                                 className="w-1 bg-red-400 rounded-full animate-bounce"
                                 style={{ height: `${8 + v * 4}px`, animationDelay: `${i * 90}ms` }}
                               />
                             ))}
                           </div>
                           <p className="text-[10px] font-extrabold text-red-500">مستمر بالتقاط صوتك الآن... تحدث ببطء ووضوح.</p>
                           {scoringSpokenText && (
                             <div className="text-[11px] font-semibold text-stone-500 bg-white border border-stone-200 px-3 py-1.5 rounded-xl max-w-md shadow-3xs mt-1 text-center">
                               اللفظ الذي نسمعه: <span className="text-stone-900 font-extrabold font-serif">"{scoringSpokenText}"</span>
                             </div>
                           )}
                         </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs font-black text-stone-850">اضغط على زر الميكروفون بالأعلى وتحدث بالعبارة المطلوبة!</p>
                          <p className="text-[10px] text-stone-400 font-semibold mt-1">
                            {useAiPronunciationTeacher
                              ? "وسيقوم معلم مخارج وحلق الأصوات بالذكاء الاصطناعي بدراسة دقة الحروف وموقع اللسان وتوجيهك بالصوت."
                              : "وسيقوم المطابق السريع المحلي بمقارنة تسلسل كلماتك اللفظية مباشرة بالتصفية الفورية."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI teacher analyzing loader card */}
                  {isScoringAnalyzing && (
                    <div className="bg-white border-2 border-dashed border-amber-300 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 text-center my-2 shadow-xs animate-pulse duration-1000">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-2xl animate-spin text-amber-500 border-2 border-stone-200 border-t-amber-500 font-black">🤖</div>
                      <h4 className="text-sm font-black text-stone-850">جاري الإرسال للمعلم الذكي... 🎓</h4>
                      <p className="text-[11px] text-stone-500 font-bold max-w-sm leading-relaxed">
                        يقوم معلم مخارج الأصوات منصور بدراسة رنين صوتك ومخارج شفتيك واللسان للعبارة <span className="font-serif italic font-extrabold text-amber-600">"{scoringChallengeText}"</span> وصياغة توجيه مخصص لك...
                      </p>
                    </div>
                  )}

                  {/* Dynamic Rich Evaluation Result area */}
                  {scoringResult && (
                    <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-100 text-right">
                        {/* Stars rating Display */}
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest leading-none">معدل جودة وتقييم التلفظ (Speaking Rating)</span>
                          <div className="flex items-center gap-2 mt-1 justify-start">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={16}
                                  fill={s <= scoringResult.stars ? "currentColor" : "none"}
                                  className={s <= scoringResult.stars ? "text-amber-500" : "text-stone-200"}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-black text-stone-850">({scoringResult.stars} نجوم)</span>
                          </div>
                        </div>

                        {/* Percentage badge with matching color */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <div className={`px-3 py-1 rounded-full text-xs font-black tracking-tight ${
                            scoringResult.percentage >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                            scoringResult.percentage >= 75 ? 'bg-amber-50 text-amber-700 border border-amber-250/50' : 'bg-red-50 text-red-700 border border-red-150'
                          }`}>
                            دقة ومخرجات الأحرف اللفظية: {scoringResult.percentage}%
                          </div>
                        </div>
                      </div>

                      {/* Word-by-word Alignment display */}
                      <div className="flex flex-col gap-2 text-right">
                        <span className="text-[10px] font-extrabold text-[#5a6a3b]">مراجعة التصحيح التفصيلي لكل كلمة:</span>
                        
                        {/* Detailed alignment flow */}
                        <div className="flex flex-wrap gap-2 text-right justify-start p-3 bg-stone-50 rounded-2xl border border-stone-150/70">
                          {scoringResult.evaluatedWords.map((item, idx) => {
                            let colorClass = "";
                            let tagLabel = "";
                            if (item.status === 'correct') {
                              colorClass = "bg-emerald-100/60 text-emerald-800 border-emerald-200/80";
                              tagLabel = "صحيح";
                            } else if (item.status === 'partial') {
                              colorClass = "bg-amber-100/60 text-amber-800 border-amber-200";
                              tagLabel = "لكنة";
                            } else {
                              colorClass = "bg-red-50 text-red-700 border-red-150";
                              tagLabel = "مفقود";
                            }

                            return (
                              <div
                                key={idx}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border flex flex-col items-center gap-0.5 shadow-3xs select-none ${colorClass}`}
                              >
                                <span className="font-serif leading-none tracking-tight font-black">{item.word}</span>
                                <span className="text-[8px] opacity-75 leading-none">{tagLabel}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Coach guidance note */}
                      <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-150/50 flex items-start gap-2.5 text-right">
                        <span className="text-base select-none shrink-0">💡</span>
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-amber-800">التوجيه اللفظي المهني:</span>
                          <p className="text-xs text-stone-750 font-semibold mt-1 leading-normal">
                            {scoringResult.feedback}
                          </p>
                        </div>
                      </div>

                      {/* Dictionary Integration buttons */}
                      <div className="flex flex-col gap-2 border-t border-stone-100 pt-3 text-right">
                        <span className="text-[10px] font-extrabold text-stone-400">حفظ المفردات غير الكاملة لدعم مراجعتها وحب قواعدها لاحقاً:</span>
                        <div className="flex flex-wrap gap-1.5 justify-start">
                          {scoringResult.evaluatedWords.map((item, index) => {
                            if (item.status !== 'correct') {
                              return (
                                <button
                                  key={'dict_helper_' + index}
                                  type="button"
                                  onClick={() => {
                                    const cleanW = item.word.toLowerCase();
                                    const updated = { ...customDictionary };
                                    updated[cleanW] = {
                                      arabic: "تحتاج لمزيد من الدعم واللفظ الصحيح بالصوت 🎙️",
                                      phonetics: `[${cleanW}]`,
                                      category: "مفردات معمل النطق ⚙️"
                                    };
                                    saveCustomDictionaryToDisk(updated);
                                    alert(`تم إدراج العبارة "${cleanW}" إلى قاموس مراجعتك اللفظية الشخصي بنجاح!`);
                                  }}
                                  className="text-[10px] bg-white hover:bg-amber-100/40 border border-stone-200 hover:border-amber-200/60 px-2.5 py-1.5 rounded-lg transition-all font-black text-stone-700 flex items-center gap-1 cursor-pointer shadow-3xs"
                                >
                                  <span>مراجعة ➕</span>
                                  <span className="font-serif font-black">{item.word}</span>
                                </button>
                               );
                             }
                             return null;
                           })}
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- WORKSPACE 2: INTERACTIVE DUPLEX FACE-TO-FACE CONVERSATION MODE --- */}
      {activeTab === 'conversation' && (
        <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
          
          {/* Top instructional card */}
          <div className="bg-[#fbfbf9] p-4.5 rounded-2xl border border-[#8a9a5b]/15 leading-relaxed text-right flex items-start gap-2.5">
            <Users size={16} className="text-[#8a9a5b] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-stone-850">المترجم والوسيط الفوري ثنائي الطرفين (Live Face-to-Face Translation)</h4>
              <p className="text-[11px] text-stone-500 font-semibold mt-1 leading-normal">
                صمم هذا التطور لمساعدة شخصين يتحدثان بلغات مختلفة (عربي وأجنبي) وجهاً لوجه! يضغط المتحدث العربي على الزر
                الخاص به للتحدث وسيترجم اللسان للإنجليزية وينطقها فوراً، والعكس بالعكس بالنسبة للشريك الأجنبي لإنشاء حوار متبادل مثالي.
              </p>
            </div>
          </div>

          {/* Duplex Controllers Panel */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* ARABIC SPEAKER CONTROL BUTTON */}
            <div className={`p-5 rounded-3xl border-2 flex flex-col items-center text-center transition-all bg-white ${
              convListeningSide === 'arabic' ? 'border-[#8a9a5b] ring-4 ring-[#8a9a5b]/10 shadow-sm' : 'border-stone-250'
            }`}>
              <span className="text-[10px] font-black text-stone-450 block uppercase tracking-wide">الطرف العربي (Arabic User)</span>
              <p className="text-xs text-stone-400 font-bold mt-0.5 mb-4">أنقر وتكلّم بلسانك العربي</p>
              
              <button
                onClick={() => startConversationListen('arabic')}
                disabled={convProcessing}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                  convListeningSide === 'arabic'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-[#8a9a5b]/10 text-[#8a9a5b] hover:bg-[#8a9a5b] hover:text-white border border-[#8a9a5b]/20 shadow-2xs active:scale-95'
                }`}
                title="اضغط للتحدث بكلمة أو جملة عربية"
              >
                <Mic size={24} />
                {convListeningSide === 'arabic' && (
                  <span className="absolute inset-0 rounded-full border-4 border-red-200 animate-ping opacity-60" />
                )}
              </button>

              <span className="text-[10px] font-extrabold text-stone-500 mt-3 h-5">
                {convListeningSide === 'arabic' ? '🎤 مستعد، تحدث بالعربية...' : (convProcessing ? '...' : 'أنقر للتحدث ➔')}
              </span>
            </div>

            {/* ENGLISH SPEAKER CONTROL BUTTON */}
            <div className={`p-5 rounded-3xl border-2 flex flex-col items-center text-center transition-all bg-white ${
              convListeningSide === 'english' ? 'border-amber-400 ring-4 ring-amber-50 shadow-sm' : 'border-stone-250'
            }`}>
              <span className="text-[10px] font-black text-stone-450 block uppercase tracking-wide">الطرف الأجنبي (English Guest)</span>
              <p className="text-xs text-stone-400 font-bold mt-0.5 mb-4">Press to speak English phrase</p>
              
              <button
                onClick={() => startConversationListen('english')}
                disabled={convProcessing}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                  convListeningSide === 'english'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-800 hover:text-white border border-stone-300 shadow-2xs active:scale-95'
                }`}
                title="Speak in English"
              >
                <Mic size={24} />
                {convListeningSide === 'english' && (
                  <span className="absolute inset-0 rounded-full border-4 border-red-200 animate-ping opacity-60" />
                )}
              </button>

              <span className="text-[10px] font-extrabold text-stone-500 mt-3 h-5">
                {convListeningSide === 'english' ? '🎤 Listening... Speak English' : (convProcessing ? '...' : 'Click to Speak ➔')}
              </span>
            </div>

          </div>

          {/* Central Messenger conversation stream view */}
          <div className="bg-[#fcfcfd] rounded-3xl border border-stone-200 p-5 shadow-inner min-h-[360px] flex flex-col justify-between">
            
            {/* Scrollable Timeline of bubbles */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              
              {messages.map((msg) => {
                const isArabic = msg.sender === 'arabic';
                const hasSaved = convSaveStatuses[msg.id];

                return (
                  <div 
                    key={msg.id}
                    className={`flex flex-col gap-1.5 max-w-[85%] ${
                      isArabic ? 'mr-auto items-start text-left' : 'ml-auto items-end text-right'
                    } animate-in slide-in-from-bottom-3 duration-250`}
                  >
                    {/* Timestamp & Speaker Label */}
                    <div className="flex items-center gap-1.5 text-[9px] text-stone-400 font-bold px-2">
                      <span className={isArabic ? 'text-[#8a9a5b]' : 'text-stone-600'}>
                        {isArabic ? '👤 المتحدث العربي' : '👥 الضيف الأجنبي'}
                      </span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Speech Bubble structure */}
                    <div className={`p-4 rounded-2xl border shadow-3xs ${
                      isArabic 
                        ? 'bg-white border-stone-250 rounded-tl-none text-left' 
                        : 'bg-[#8a9a5b]/10 border-[#8a9a5b]/20 rounded-tr-none text-right'
                    }`}>
                      {/* Original spoken block */}
                      <p className={`text-xs font-black text-stone-850 leading-relaxed ${isArabic ? 'text-right' : 'text-left font-serif'}`}>
                        {msg.originalText}
                      </p>
                      
                      {/* Interactive translation line representation */}
                      <div className="border-t border-stone-200/50 my-2.5" />
                      
                      <p className={`text-xs font-serif font-black text-stone-900 leading-relaxed ${isArabic ? 'text-left' : 'text-right'}`}>
                        {msg.translatedText}
                      </p>

                      {msg.phonetics && (
                        <span className="block text-[8px] text-stone-400 font-mono mt-1" dir="ltr">
                          🔊 {msg.phonetics}
                        </span>
                      )}

                      {/* Micro actions buttons on current message bubble */}
                      <div className="flex gap-2 items-center justify-end mt-3 pt-2 border-t border-stone-150/50">
                        {/* Speaker re-pronunciation */}
                        <button
                          onClick={() => {
                            if (isArabic) {
                              // Spoke arabic, translation is English, so read English
                              speakLoud(msg.translatedText, 'en-US');
                            } else {
                              // Spoke english, translation is Arabic, read Arabic
                              speakLoud(msg.translatedText, 'ar-SA');
                            }
                          }}
                          className="p-1 px-1.5 bg-stone-50 hover:bg-stone-100/70 text-[#8a9a5b] rounded-lg border border-stone-200/50 flex items-center gap-1 transition-all cursor-pointer text-[9px]"
                          title="تكرار نطق الترجمة"
                        >
                          <Volume2 size={10} className="stroke-[2.5]" />
                          <span>نطق</span>
                        </button>

                        {/* Firestore Dictionary Save Button */}
                        <button
                          onClick={() => handleSaveConvMessageToVocabulary(msg)}
                          disabled={hasSaved}
                          className={`p-1 px-1.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer text-[9px] ${
                            hasSaved 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-600 cursor-not-allowed' 
                              : 'bg-white border-stone-200 text-stone-500 hover:text-stone-800'
                          }`}
                          title="حفظ بقاموسي"
                        >
                          <Bookmark size={9} />
                          <span>{hasSaved ? 'محفوظة' : 'اضم للقاموس'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loader during active translating translation server round-trips */}
              {convProcessing && (
                <div className="flex gap-2 items-center justify-start text-stone-400 text-xs font-bold p-3 bg-white w-fit rounded-full border border-stone-200 animate-pulse">
                  <Loader2 className="animate-spin text-[#8a9a5b]" size={14} />
                  <span>يقوم المعلم بالتحصيل والترجمة فوراً...</span>
                </div>
              )}

            </div>

            {/* Bottom Actions of messaging Feed viewport */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-stone-200 pt-3.5 mt-4 gap-2">
              <span className="text-[10px] text-stone-400 font-bold flex items-center gap-1">
                <MessageCircle size={12} className="text-[#8a9a5b]" />
                <span>سجل المحادثة المستمر والمحفوظ محلياً</span>
              </span>
              <div className="flex gap-2">
                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      compileAndSaveConversationSession();
                      alert('🎉 تم بنجاح تجميع وحفظ هذه المحادثة الثنائية وأرشفتها في خلاصة المراجع بالأسفل، كما تم تدريب القاموس الصوتي تلقائياً!');
                    }}
                    className="px-3.5 py-1.5 bg-[#8a9a5b]/10 hover:bg-[#8a9a5b]/20 text-[#5a6a3b] border border-[#8a9a5b]/15 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                    title="حفظ خلاصة المحادثة في المراجع"
                  >
                    <Bookmark size={11} />
                    <span>📥 حفظ وأرشفة المحادثة</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (messages.length > 1) {
                      compileAndSaveConversationSession();
                    }
                    setMessages([]);
                    setConvSaveStatuses({});
                    try {
                      await clearConversationHistory(userId);
                    } catch (err) {
                      console.error('Failed to clear conversation history from Firestore:', err);
                    }
                  }}
                  className="px-3.5 py-1.5 hover:bg-red-50 text-stone-400 hover:text-red-500 border border-stone-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                  title="مسح السجل بعد الأرشفة التلقائية"
                >
                  <Trash2 size={12} />
                  <span>مسح وتصفير السجل</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- WORKSPACE 3: IMMERSIVE SCENARIO SANDBOX ROLEPLAY MODE --- */}
      {activeTab === 'scenario' && (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
          
          {/* Top selection slider */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-4">
            <div>
              <h4 className="font-black text-stone-900 text-sm">اختر سيناريو المحاكاة التفاعلية (Active Dialogue Scenarios)</h4>
              <p className="text-[11px] text-stone-500 font-semibold mt-1">تتدرب في هذه المحاكاة مع معلم روبوت ذكي يمثل دوراً حياً بالإنجليزية لتدريب لسانك على الرد السريع واللبق.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              {Object.values(SCENARIOS).map((sc) => {
                const isSelected = selectedScenario === sc.id;
                
                const getScenIcon = (name: string) => {
                  switch (name) {
                    case 'plane': return <Plane size={15} />;
                    case 'utensils': return <Utensils size={15} />;
                    case 'hotel': return <Building size={15} />;
                    case 'interview': return <Briefcase size={15} />;
                    case 'car': return <Car size={15} />;
                    default: return <Briefcase size={15} />;
                  }
                };

                return (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc.id)}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center border cursor-pointer ${
                      isSelected 
                        ? 'bg-[#8a9a5b] text-white border-[#8a9a5b] shadow-sm' 
                        : 'bg-[#fbfbf9] text-stone-600 border-stone-150 hover:bg-stone-50'
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : 'text-[#8a9a5b]'}>
                      {getScenIcon(sc.iconName)}
                    </span>
                    <span className="text-[10px] font-black leading-tight block">
                      {sc.id === 'airport' ? 'المطار' : (sc.id === 'restaurant' ? 'المطعم' : (sc.id === 'hotel' ? 'الفندق' : (sc.id === 'interview' ? 'المقابلة' : 'التاكسي')))}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bg-[#fcfcfd] p-4.5 rounded-2xl border border-stone-150 leading-relaxed text-right mt-1">
              <span className="font-black text-stone-850 text-xs text-[#5a6a3b] block">❖ {SCENARIOS[selectedScenario]?.title}</span>
              <p className="text-stone-500 font-semibold text-[11px] mt-1 leading-normal">
                {SCENARIOS[selectedScenario]?.desc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Dialogue stream viewport */}
            <div className="lg:col-span-2 bg-gradient-to-t from-[#fbfbf9] to-white rounded-3xl border border-stone-200 p-5 shadow-sm min-h-[440px] flex flex-col justify-between">
              
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {scenarioMessages.map((msg) => {
                  const isCoach = msg.sender === 'coach';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col gap-1 max-w-[85%] ${
                        isCoach ? 'mr-auto items-start text-left' : 'ml-auto items-end text-right'
                      } animate-in slide-in-from-bottom-2 duration-200`}
                    >
                      {/* Name tag */}
                      <span className="text-[9px] font-bold text-stone-400 px-2">
                        {isCoach ? '🗣️ الموظف / النادل المسؤول (Tutor)' : '👤 أنت (المتدرب)'} • {msg.timestamp}
                      </span>

                      {/* Bubble */}
                      <div className={`p-4 rounded-2xl border shadow-3xs ${
                        isCoach 
                          ? 'bg-white border-stone-200 rounded-tl-none text-left' 
                          : 'bg-[#8a9a5b]/10 border-[#8a9a5b]/15 rounded-tr-none text-right'
                      }`}>
                        {/* En */}
                        <p className="text-xs font-serif font-black text-stone-850 leading-relaxed text-left" dir="ltr">
                          {msg.textEn}
                        </p>

                        {/* Speech Translation line */}
                        {isCoach && msg.textAr && (
                          <>
                            <div className="border-t border-stone-100 my-2" />
                            <p className="text-xs font-bold text-stone-500 leading-relaxed text-right">
                              {msg.textAr}
                            </p>
                          </>
                        )}

                        {/* Pronunciation phonetics */}
                        {isCoach && msg.pronunciation && (
                          <span className="block text-[8px] text-stone-400 font-mono mt-1" dir="ltr">
                            🔊 Pronunciation: {msg.pronunciation}
                          </span>
                        )}

                        {/* Personal Feedback report for student */}
                        {!isCoach && msg.feedback && (
                          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-right text-[10px] font-bold mt-2.5 text-emerald-900 leading-normal">
                            ⭐ مراجعة اللفظ والقواعد: {msg.feedback}
                          </div>
                        )}

                        {/* Audio play button */}
                        {isCoach && (
                          <div className="flex justify-end gap-2 mt-2 pt-1 border-t border-stone-100/60">
                            <button
                              type="button"
                              onClick={() => speakLoud(msg.textEn, 'en-US')}
                              className="p-1 px-2 bg-stone-50 hover:bg-stone-100 text-[#8a9a5b] rounded-lg border border-stone-200/60 flex items-center gap-1 transition-all cursor-pointer text-[9px]"
                            >
                              <Volume2 size={10} className="stroke-[2.5]" />
                              <span>تكرار نطق العبارة</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {scenarioProcessing && (
                  <div className="flex gap-2 items-center justify-start text-stone-500 text-xs font-bold p-3 bg-white w-fit rounded-2xl border border-stone-150 animate-pulse">
                    <Loader2 className="animate-spin text-[#8a9a5b]" size={14} />
                    <span>المعلم يفحص صياغتك ويعد الرّد في الموقف...</span>
                  </div>
                )}
              </div>

              {/* Box input controller */}
              <div className="border-t border-stone-200/80 pt-4 mt-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleScenarioListening}
                    disabled={scenarioProcessing}
                    className={`p-3 rounded-2xl shrink-0 transition-all cursor-pointer flex items-center justify-center relative ${
                      scenarioListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-[#8a9a5b]/10 text-[#8a9a5b] hover:bg-[#8a9a5b] hover:text-white border border-[#8a9a5b]/10'
                    }`}
                    title="تحدث بالإنكليزية مع رصد فوري"
                  >
                    {scenarioListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>

                  <input
                    type="text"
                    value={scenarioInputText}
                    onChange={(e) => setScenarioInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && scenarioInputText.trim() && !scenarioProcessing) {
                        handleAnalyzeScenarioMessage();
                      }
                    }}
                    placeholder="جاوب المعلم بالإنجليزية الآن (عبر الصوت أو كتابة)..."
                    disabled={scenarioProcessing}
                    className="flex-1 text-xs px-3.5 py-2.5 border border-stone-200 rounded-2xl h-12 font-semibold text-stone-850 focus:outline-none focus:ring-2 focus:ring-[#8a9a5b] bg-[#fbfbf9]"
                  />

                  <button
                    type="button"
                    onClick={() => handleAnalyzeScenarioMessage()}
                    disabled={scenarioProcessing || !scenarioInputText.trim()}
                    className={`px-4 py-2.5 rounded-2xl shrink-0 font-black text-xs transition-all cursor-pointer ${
                      scenarioProcessing || !scenarioInputText.trim()
                        ? 'bg-stone-50 text-stone-400 border border-stone-150 cursor-not-allowed'
                        : 'bg-[#8a9a5b] text-white hover:bg-[#7a8a4b]'
                    }`}
                  >
                    إرسال ➔
                  </button>
                </div>
              </div>

            </div>

            {/* Hint & Vocabulary sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              
              {/* Advisor Hint recommendation card */}
              {scenarioHelperHint && (
                <div className="bg-amber-50/70 p-5 rounded-3xl border border-amber-200/40 text-right flex flex-col gap-2">
                  <span className="text-[11px] font-black text-amber-800 flex items-center gap-1.5">
                    <Sparkles size={13} className="fill-amber-550 text-amber-550 animate-pulse" />
                    توجيه المساعد: كيف يمكنك الإجابة؟
                  </span>
                  <p className="text-amber-950 font-bold text-xs mt-0.5 leading-relaxed">
                    {scenarioHelperHint}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Extract english quote from the hints
                      const match = scenarioHelperHint.match(/"([^"]+)"|'([^']+)'|:\s*([a-zA-Z\s,.]+)/);
                      const phraseToSpeak = match ? (match[1] || match[2] || match[3]) : '';
                      if (phraseToSpeak) {
                        speakLoud(phraseToSpeak, 'en-US');
                      }
                    }}
                    className="mt-2.5 text-[10px] text-amber-700 font-extrabold hover:underline self-start bg-amber-100/50 py-1 px-2.5 rounded-lg border border-amber-200/20 active:scale-95 transition-all text-center"
                  >
                    🔊 انطق المقترح التعليمي الاسترشادي
                  </button>
                </div>
              )}

              {/* Extracted Scenario Vocabulary Lesson cards */}
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-4 flex-1">
                <div>
                  <h4 className="text-xs font-black text-stone-850">مفردات هامة للموقف (Key Scenario Words)</h4>
                  <p className="text-[9px] text-stone-400 mt-0.5 font-bold">احفظ الكلمات لتتدرب عليها في القاموس الشخصي لاحقاً.</p>
                </div>

                {scenarioVocabulary.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-stone-200 rounded-2xl text-stone-400 min-h-[140px]">
                    <HelpCircle size={20} className="mb-1 text-stone-300" />
                    <span className="text-[10px] font-semibold">بانتظار التقدم في الحوار لاستخلاص كلمات الدرس...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {scenarioVocabulary.map((wordObj, i) => {
                      const isSaved = scenarioSaveStatuses[wordObj.word];
                      return (
                        <div key={i} className="bg-stone-50/50 p-3 rounded-2xl border border-stone-150 flex items-center justify-between gap-2 text-right">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-serif font-black text-xs text-stone-900 text-left">{wordObj.word}</span>
                            <span className="text-[10px] font-black text-[#5a6a3b] mt-0.5">{wordObj.translation}</span>
                            <span className="text-[8px] text-stone-400 leading-none">{wordObj.phonetic || '[صوت]'}</span>
                          </div>

                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => speakLoud(wordObj.word, 'en-US')}
                              className="p-1 px-1.5 bg-white border border-stone-200 text-stone-400 hover:text-[#8a9a5b] hover:bg-[#8a9a5b]/10 rounded-lg transition-all"
                            >
                              <Volume2 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveScenarioWordToVocabulary(wordObj.word, wordObj.translation, wordObj.phonetic)}
                              disabled={isSaved}
                              className={`p-1 px-1.5 rounded-lg border transition-all ${
                                isSaved 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100 cursor-not-allowed' 
                                  : 'bg-white border-stone-200 text-stone-450 hover:text-stone-750'
                              }`}
                            >
                              {isSaved ? <Check size={11} /> : <Bookmark size={11} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* --- WORKSPACE 4: LIVE LECTURE & SMART GLASSES SUBTITLES HUD --- */}
      {activeTab === 'lecture' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          
          
          {/* Top informative card */}
          <div className="bg-stone-900 text-stone-100 p-5 rounded-3xl border border-stone-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
            <div>
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-[#8a9a5b] rounded-full animate-ping" />
                <span>وضع النظارات الذكية واستماع المحاضرات والاجتماعات الطويلة (Lecture & Meeting Multi-Page HUB)</span>
              </h4>
              <p className="text-stone-400 text-xs mt-1.5 font-semibold leading-relaxed">
                هذا الوضع مخصص للاستماع المتواصل والمستمر لأكثر من ساعة دون انقطاع! يكتب كل شيء يقال تلقائياً في مسودة واحدة، ثم يقوم بترجمتها وصياغتها دفعة واحدة في النهاية عند نقرك على زر الترجمة، مع تقسيم المحتوى الطويل تلقائياً لصفحات ذكية مريحة للقراءة والدراسة بدون نطق تلقائي مزعج.
              </p>
            </div>
            
            <div className="flex bg-stone-800 p-1 rounded-xl border border-stone-750 gap-1 self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() => setLectureLang('en-US')}
                className={`px-3 py-1 font-extrabold text-[10px] rounded-md transition-all cursor-pointer ${
                  lectureLang === 'en-US' ? 'bg-[#8a9a5b] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                المتحدث بالإنجليزية
              </button>
              <button
                type="button"
                onClick={() => setLectureLang('ar-SA')}
                className={`px-3 py-1 font-extrabold text-[10px] rounded-md transition-all cursor-pointer ${
                  lectureLang === 'ar-SA' ? 'bg-[#8a9a5b] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                المتحدث بالعربية
              </button>
            </div>
          </div>

          {/* Controls and Selectors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Interactive Controller & Transcription Pad */}
            <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between min-h-[460px]">
              <div className="flex flex-col gap-4">
                <div className="border-b border-stone-100 pb-3">
                  <span className="text-[#8a9a5b] text-[10px] uppercase font-black block">الراصد وتدفق الميكروفون</span>
                  <h4 className="text-xs font-black text-stone-850 mt-0.5">التقاط الحديث كمسودة موحدة:</h4>
                  <p className="text-[10px] text-stone-500 font-semibold mt-1">
                    شغله وسيدون كل الكلمات المستمرة دون انقطاع. يمكنك تركه يعمل لساعات طويلة وسيقوم بجمع النص بالكامل.
                  </p>
                </div>

                {/* Main Microphone Action button */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={toggleLectureListening}
                    className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-xs ${
                      isLectureListening
                        ? 'bg-red-500 text-white ring-4 ring-red-100 animate-pulse'
                        : 'bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white'
                    }`}
                  >
                    {isLectureListening ? <MicOff size={14} /> : <Mic size={14} />}
                    <span>{isLectureListening ? 'إيقاف استماع الميكروفون' : 'تشغيل الاستماع المستمر'}</span>
                  </button>
                </div>

                {/* Live Transcript Interactive Pad / Text Area */}
                <div className="mt-2 text-right">
                  <div className="flex justify-between items-center mb-1 bg-stone-50 p-1.5 rounded-lg border border-stone-150">
                    <span className="text-[10px] font-black text-stone-700">📝 مسودة وتعديل اللفظ يدوياً:</span>
                    <span className="text-[9px] font-mono text-stone-550 font-black">
                      ⏱️ {lectureTranscriptText.trim().split(/\s+/).filter(Boolean).length} كلمة
                    </span>
                  </div>
                  <textarea
                    className="w-full h-32 p-3 text-xs bg-stone-50 border border-stone-200 rounded-xl font-mono text-left focus:ring-1 focus:ring-[#8a9a5b] focus:border-[#8a9a5b] resize-none leading-relaxed text-stone-800"
                    dir="ltr"
                    value={lectureTranscriptText}
                    onChange={(e) => setLectureTranscriptText(e.target.value)}
                    placeholder="سيظهر النص المدون هنا في المسودة فورياً عند تشغيل الاستماع... كما يمكنك كتابة أو تعديل أي كلمة يدوياً قبل صياغة الترجمة!"
                  />
                </div>

                {/* Preset Simulation samples */}
                <div className="border-t border-stone-100 pt-3">
                  <h5 className="text-[10px] font-black text-stone-800">💡 أو اختر محاكاة محاضرة مسبقة الصنع:</h5>
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    {SIMULATED_LECTURE_TOPICS.map((topic, index) => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => {
                          setSelectedTopicIndex(index);
                          if (isSimulatingLecture) {
                            stopLectureSimulation();
                          }
                          // Load simulated topic instantly to lets users test without speaking
                          setLectureTranscriptText(topic.sentences.join(' '));
                          setLecturePaginatedResult(null);
                          setLectureCurrentPageIdx(0);
                        }}
                        className={`text-right p-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                          selectedTopicIndex === index
                            ? 'border-[#8a9a5b] bg-[#8a9a5b]/5 text-[#5a6a3b]'
                            : 'border-stone-150 hover:bg-stone-50 text-stone-600'
                        }`}
                      >
                        📖 عينة: {topic.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* End & Translate Trigger Buttons */}
              <div className="pt-4 border-t border-stone-100 flex flex-col gap-2">
                {lectureTranscriptText.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isLectureListening) {
                        setIsLectureListening(false);
                      }
                      if (isSimulatingLecture) {
                        setIsSimulatingLecture(false);
                      }
                      handleTranslateEntireLecture();
                    }}
                    disabled={lectureProcessing}
                    className="w-full py-3 rounded-xl font-black text-xs text-white bg-stone-900 hover:bg-stone-800 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                  >
                    <Sparkles size={13} className={lectureProcessing ? 'animate-spin' : ''} />
                    <span>{lectureProcessing ? 'جاري صياغة الصفحات والترجمة...' : 'ترجمة وصياغة المحاضرة كاملة الآن ⚡'}</span>
                  </button>
                )}

                {lectureTranscriptText.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('هل تود مسح هذه الجلسة وإفراغ مسودة النص الحالية؟')) {
                        setLectureTranscriptText('');
                        setLecturePaginatedResult(null);
                        setLectureCurrentPageIdx(0);
                        setLiveInterimTranscript('');
                      }
                    }}
                    className="w-full py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={11} />
                    <span>تصفير وإفراغ المسودة والصفحات</span>
                  </button>
                )}
              </div>
            </div>

            {/* Smart Glasses Virtual Screen Viewport / Long-Form Book Reader */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              
              {/* Virtual HUD Frame */}
              <div className="bg-stone-950 rounded-3xl p-5 border border-stone-850 shadow-xl flex flex-col justify-start min-h-[460px] max-h-[620px] overflow-y-auto relative no-scrollbar">
                
                {/* Simulated Glass Status Bar */}
                <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-4 sticky top-0 bg-stone-950 z-10">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        isLectureListening || isSimulatingLecture ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`} />
                    </span>
                    <span className="text-[9px] font-black tracking-widest text-[#8a9a5b] font-mono">
                      {isLectureListening ? '👓 LINGOLENS GLASSES ACTIVE (STREAMING MIC)' : (lecturePaginatedResult ? '📚 LINGOLENS PAGINATED STUDY BOOK' : '👓 LINGOLENS GLASSES STANDBY')}
                    </span>
                  </div>
                  {lecturePaginatedResult && (
                    <span className="text-[9px] font-mono text-[#c5d3a2] font-black bg-[#8a9a5b]/20 px-2 py-0.5 rounded-md">
                      إجمالي الكلمات المعالجة: {lecturePaginatedResult.totalWords || '1000+'} كلمة
                    </span>
                  )}
                </div>

                {/* Simulated Lens Live Text (Real-time Typing Caption Overlay) */}
                {liveInterimTranscript && (
                  <div className="mb-4 bg-[#8a9a5b]/15 border border-[#8a9a5b]/20 p-4 rounded-xl animate-in slide-in-from-top duration-200">
                    <div className="flex gap-2 items-center text-[#8a9a5b] text-[9px] font-black uppercase mb-1">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                      <span>الصوت المسترسل المكتوب الآن بالنظارة:</span>
                    </div>
                    <p className="text-white text-xs leading-relaxed font-semibold italic text-left font-mono" dir="ltr">
                      {liveInterimTranscript}
                    </p>
                  </div>
                )}

                {/* Subtitle stream container / Page Viewport */}
                <div className="flex flex-col gap-4 flex-1">
                  
                  {lectureProcessing ? (
                    /* Loading State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-stone-300">
                      <div className="w-10 h-10 border-4 border-[#8a9a5b] border-t-transparent rounded-full animate-spin mb-4" />
                      <span className="text-xs font-black text-stone-200 mb-1">جاري الترجمة المتكاملة وإعادة تجزئة وصياغة المحاضرة...</span>
                      <p className="text-[10px] text-stone-500 max-w-sm leading-relaxed">
                        نحن نقوم الآن بتقسيم المحتوى الطويل (ومحاضرات الـ 1000 كلمة) إلى تجمعات صفحات منسقة ببيانات قواعد لغوية، ملخصات ذكية وقواميس لتعلم النطق التفاعلي.
                      </p>
                    </div>
                  ) : lecturePaginatedResult && lecturePaginatedResult.pages && lecturePaginatedResult.pages.length > 0 ? (
                    
                    /* Paginated Book Reader View! */
                    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                      
                      {/* Page selector Tabs panel */}
                      <div className="flex flex-wrap gap-1 border-b border-white/5 pb-3">
                        {lecturePaginatedResult.pages.map((p, pIdx) => (
                          <button
                            key={p.pageNumber || pIdx}
                            type="button"
                            onClick={() => setLectureCurrentPageIdx(pIdx)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-tight leading-none transition-all cursor-pointer ${
                              lectureCurrentPageIdx === pIdx
                                ? 'bg-[#8a9a5b] text-white shadow-xs'
                                : 'bg-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/10'
                            }`}
                          >
                            📖 الصفحة {p.pageNumber || (pIdx + 1)}
                          </button>
                        ))}
                      </div>

                      {/* Content of the active Page */}
                      {(() => {
                        const page = lecturePaginatedResult.pages[lectureCurrentPageIdx];
                        if (!page) return null;
                        return (
                          <div className="flex flex-col gap-4 text-right">
                            
                            {/* Page header and nav indicators */}
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                              <span className="text-[10px] text-stone-400 font-extrabold">
                                تصفح صفحات المحاضرة ({lectureCurrentPageIdx + 1} من أصل {lecturePaginatedResult.pages.length})
                              </span>
                              <span className="text-[9px] text-[#c5d3a2] font-black uppercase font-mono">
                                PAGE #{page.pageNumber || (lectureCurrentPageIdx + 1)} CONTENT
                              </span>
                            </div>

                            {/* Main split Text Translation area */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              
                              {/* Left column: Original Source Text with Speaker */}
                              <div className="bg-[#1c1c1a]/50 p-4 rounded-xl border border-white/5 flex flex-col justify-between" dir="ltr">
                                <div>
                                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-2.5">
                                    <span className="text-[8px] bg-white/10 text-stone-300 px-2 py-0.5 rounded-full font-mono font-black uppercase">
                                      The Original Speech (منطوق اللفظ)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => speakLoud(page.originalText, 'en-US')}
                                      className="p-1 px-1.5 bg-white/15 hover:bg-white/25 text-[#c5d3a2] rounded-md transition-all cursor-pointer flex items-center gap-1 text-[8px] font-bold"
                                      title="اضغط لاستماع نطق هذه الصفحة بالكامل"
                                    >
                                      <Volume2 size={10} className="stroke-[2.5]" />
                                      <span>انطق الصفحة 🔊</span>
                                    </button>
                                  </div>
                                  <p className="text-stone-150 text-xs font-serif leading-relaxed text-left font-black tracking-wide whitespace-pre-wrap">
                                    {page.originalText}
                                  </p>
                                </div>
                              </div>

                              {/* Right column: Arabic translation */}
                              <div className="bg-[#12140e]/60 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-2.5">
                                    <span className="text-[8px] bg-[#8a9a5b]/20 text-[#c5d3a2] px-2 py-0.5 rounded-full font-black">
                                      الترجمة اللغوية المتناسقة بالنظارة
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => speakLoud(page.translatedText, 'ar-SA')}
                                      className="p-1 px-1.5 bg-white/10 hover:bg-white/20 text-[#c5d3a2] rounded-md transition-all cursor-pointer flex items-center gap-1 text-[8px] font-bold"
                                      title="استمع للفظ الترجمة العربية"
                                    >
                                      <Volume2 size={10} />
                                      <span>انطق الترجمة 🔊</span>
                                    </button>
                                  </div>
                                  <p className="text-[#8a9a5b] text-xs font-black leading-relaxed whitespace-pre-wrap">
                                    {page.translatedText}
                                  </p>
                                </div>
                              </div>

                            </div>

                            {/* Page Executive Summary */}
                            {page.summary && (
                              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-right">
                                <span className="text-[10px] font-black text-amber-500 flex items-center gap-1 mb-1 bg-amber-500/5 py-1 px-2.5 rounded-lg w-fit">
                                  <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping" />
                                  الملخص والزبدة التنفيذية لهذه الصفحة 🎓:
                                </span>
                                <p className="text-stone-300 text-xs font-semibold leading-relaxed">
                                  {page.summary}
                                </p>
                              </div>
                            )}

                            {/* Educational Grammar tip */}
                            {page.grammarInsights && (
                              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-right">
                                <span className="text-[10px] font-black text-blue-400 flex items-center gap-1 mb-1 bg-blue-500/5 py-1 px-2.5 rounded-lg w-fit">
                                  <Sparkles size={11} className="fill-blue-400 text-blue-400" />
                                  الدروس القواعدية والتراكيب اللغوية الهامة 📚:
                                </span>
                                <p className="text-stone-300 text-xs font-semibold leading-relaxed">
                                  {page.grammarInsights}
                                </p>
                              </div>
                            )}

                            {/* Key vocabulary tags */}
                            {page.keyVocabulary && page.keyVocabulary.length > 0 && (
                              <div className="flex flex-col gap-2 mt-2">
                                <span className="text-[10px] text-[#8a9a5b] font-black block">🔑 قاموس المفردات الصعبة المستخلصة لتطوير النطق (تفاعلي):</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {page.keyVocabulary.map((vWord, i) => {
                                    const isSaved = lectureSavedWords[vWord.word];
                                    return (
                                      <div
                                        key={i}
                                        className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-2.5 hover:bg-white/10 transition-all text-right"
                                      >
                                        <div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-serif font-black text-xs text-[#c5d3a2]" dir="ltr">{vWord.word}</span>
                                            {vWord.phonetic && (
                                              <span className="text-[8px] text-stone-550 font-mono" dir="ltr">{vWord.phonetic}</span>
                                            )}
                                          </div>
                                          <span className="text-[11px] font-extrabold text-stone-200 block mt-1">{vWord.meaning}</span>
                                        </div>

                                        {/* Manual triggers for Study / Pronunciation */}
                                        <div className="flex flex-col gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => speakLoud(vWord.word, 'en-US')}
                                            className="p-1 px-1.5 bg-white/5 hover:bg-white/15 text-stone-300 hover:text-[#c5d3a2] rounded-lg transition-all cursor-pointer"
                                            title="استمع لنطق الكلمة الآن"
                                          >
                                            <Volume2 size={11} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleSaveLectureVocabWord(
                                                vWord.word,
                                                vWord.meaning,
                                                vWord.phonetic || '[صوت بالنظارة]',
                                                page.originalText
                                              )
                                            }
                                            disabled={isSaved}
                                            className={`p-1 px-1.5 rounded-lg border transition-all cursor-pointer ${
                                              isSaved
                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                : 'bg-white/5 border-white/10 text-stone-400 hover:text-white'
                                            }`}
                                          >
                                            {isSaved ? <Check size={11} /> : <Bookmark size={11} />}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Pagination controls inside Book frame */}
                            <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-2">
                              <button
                                type="button"
                                disabled={lectureCurrentPageIdx === 0}
                                onClick={() => setLectureCurrentPageIdx(prev => Math.max(0, prev - 1))}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 text-stone-350 hover:text-white rounded-lg text-[10px] font-black tracking-tight leading-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              >
                                ◄ الصفحة السابقة
                              </button>
                              <span className="text-[11px] text-stone-400 font-extrabold font-mono">
                                PAGE {lectureCurrentPageIdx + 1} OF {lecturePaginatedResult.pages.length}
                              </span>
                              <button
                                type="button"
                                disabled={lectureCurrentPageIdx >= lecturePaginatedResult.pages.length - 1}
                                onClick={() => setLectureCurrentPageIdx(prev => Math.min(lecturePaginatedResult.pages.length - 1, prev + 1))}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 text-stone-350 hover:text-white rounded-lg text-[10px] font-black tracking-tight leading-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              >
                                الصفحة التالية ➔
                              </button>
                            </div>

                          </div>
                        );
                      })()}

                    </div>
                  ) : (
                    
                    /* Empty Feed / Raw live streaming preview */
                    <div className="flex-1 flex flex-col justify-start text-stone-400 h-full">
                      {lectureTranscriptText.trim().length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-stone-500 h-full my-auto">
                          <Mic size={32} className="text-stone-700 mb-2.5 animate-pulse" />
                          <span className="text-[11px] font-black text-stone-400 mb-1">بانتظار تدفق الحديث والمحاضرة</span>
                          <p className="text-[10px] text-stone-650 max-w-sm leading-relaxed">
                            قم بتشغيل ميكروفون النظارات وبث حديث المحاضرة باستمرار، أو انقر على **"عينة"** لشحن المسودة، ثم ترجمها وصغ الصفحات كوثيقة دراسية ذكية رائعة!
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 text-right text-stone-300">
                          <div className="flex justify-between items-center text-[10px] text-[#8a9a5b] font-black border-b border-white/5 pb-2">
                            <span>📡 راصد النص المتدفق بدون ترجمة حالياً (Continuous Raw Feed):</span>
                            <span>⏱️ جاري الفرز اللفظي</span>
                          </div>
                          
                          {/* Continuous Glowing Raw Feed text viewport */}
                          <div className="p-4 bg-stone-900 border border-white/5 rounded-2xl min-h-[180px] text-left font-mono" dir="ltr">
                            <p className="text-[#a5b4fc] text-xs font-semibold leading-relaxed">
                              {lectureTranscriptText}
                              <span className="inline-block w-1 h-3.5 bg-indigo-400 rounded-full animate-pulse ml-0.5" />
                            </p>
                          </div>
                          
                          <p className="text-[10px] text-stone-500 leading-normal font-bold">
                            ⚠️ تذكر: الترجمة لن تنطلق تلقائياً لإعطاء الراصد أقصى مدة استماع وحفظ طاقة وبدون تشتيت لفظي. اضغط على **"ترجمة وصياغة المحاضرة كاملة الآن ⚡"** باليمين لصياغة الترجمة المتكاملة فور انتهاء الشرح!
                          </p>
                        </div>
                      )}
                    </div>

                  )}
                  
                  {/* Invisible scroll anchor */}
                  <div ref={captionsEndRef} />
                </div>

                {/* Subtitle HUD Action Footer Bar */}
                {lectureTranscriptText.trim().length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-[#8a9a5b] rounded-full animate-ping" />
                      <span className="text-[9px] text-[#8a9a5b] font-black uppercase">
                        تلقين ذكاء الأوفلاين: جاهز للتصدير للأرشيف ⚙️
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          compileAndSaveLectureSession();
                          alert('🎉 تم أرشفة وحفظ المحاضرة كاملة بمسودتها وصفحاتها الحالية بنجاح في مراجعك التاريخية!');
                        }}
                        className="px-2.5 py-1.5 bg-[#8a9a5b]/20 hover:bg-[#8a9a5b]/35 border border-[#8a9a5b]/30 text-[#c5d3a2] rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1"
                        title="أرشفة المحاضرة"
                      >
                        <Bookmark size={9} />
                        <span>مزامنة وأرشفة الجلسة 📥</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* --- EXTRA SECTION: COMPREHENSIVE SAVED TRANSLATION REFERENCE JOURNALS --- */}
      {savedSessions.length > 0 && (
        <div className="mt-8 border-t border-stone-200 pt-7 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-black text-stone-850 flex items-center gap-2">
                <Bookmark className="text-[#8a9a5b]" size={16} />
                <span>📚 أرشيف مرجع جلسات الترجمة الحرة المجمّعة</span>
              </h3>
              <p className="text-[10px] text-stone-500 font-bold mt-0.5 leading-snug">
                سجل المراجع والذكاء المحلي للنظارات! تم تدريب القاموس الصوتي تلقائياً بكامل المفردات المدخلة هنا لتصحيح النطق أوفلاين.
              </p>
            </div>
            
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من مسح وتصفير الأرشيف بالكامل؟')) {
                  saveSessionsToDisk([]);
                  setLastOfflineTrainedCount(null);
                }
              }}
              className="text-[10px] text-red-500 hover:text-red-700 font-extrabold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <Trash2 size={11} />
              <span>تفريغ المرجع بالكامل</span>
            </button>
          </div>

          <div className="flex flex-col gap-3.5">
            {savedSessions.map((session) => (
              <div 
                key={session.id}
                className="bg-white border border-stone-200/90 hover:border-stone-300 rounded-2xl p-4.5 transition-all shadow-3xs hover:shadow-2xs text-right"
              >
                {/* Header info */}
                <div className="flex justify-between items-start gap-2 border-b border-stone-100 pb-2.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                      session.type === 'lecture' 
                        ? 'bg-[#8a9a5b]/10 text-[#5a6a3b]' 
                        : 'bg-[#9ac5b5]/15 text-[#355f50]'
                    }`}>
                      {session.type === 'lecture' ? 'محاضرة / بث مباشر 🎓' : 'محادثة ثنائية 💬'}
                    </span>
                    <h4 className="text-xs font-black text-stone-800">{session.title}</h4>
                  </div>
                  <span className="text-[9px] text-stone-400 font-mono font-bold" dir="rtl">{session.timestamp}</span>
                </div>

                {/* Subtitle transcript displays */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {/* English original audio source Column */}
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/50" dir="ltr">
                    <div className="flex justify-between items-center mb-1 bg-stone-100/50 -mx-3 -mt-3 p-2 px-3 rounded-t-xl border-b border-stone-200/30">
                      <span className="text-[8px] text-stone-500 font-black uppercase tracking-wide">English Original Speech Transcript:</span>
                      <button
                        onClick={() => speakLoud(session.englishText, 'en-US')}
                        className="p-1 px-1.5 bg-white hover:bg-[#8a9a5b]/10 hover:text-[#5a6a3b] text-stone-600 rounded-md transition-all flex items-center gap-1.5 text-[8px] font-black shadow-3xs"
                        title="إعادة نطق النص الأصلي بصوت المعلم"
                      >
                        <Volume2 size={10} className="stroke-[2.5]" />
                        <span>تشغيل نطق المحادثة 🔊</span>
                      </button>
                    </div>
                    <p className="text-xs font-serif font-semibold text-stone-700 leading-relaxed text-left max-h-36 overflow-y-auto">
                      {session.englishText}
                    </p>
                  </div>

                  {/* Arabic translated context displays */}
                  <div className="bg-[#8a9a5b]/3 rounded-xl p-3 border border-[#8a9a5b]/10">
                    <div className="flex justify-between items-center mb-1 bg-[#8a9a5b]/5 -mx-3 -mt-3 p-2 px-3 rounded-t-xl border-b border-[#8a9a5b]/10">
                      <span className="text-[8px] text-[#5a6a3b] font-black uppercase">الترجمة العربية والملخص الفوري:</span>
                      <span className="text-[8px] bg-[#8a9a5b]/10 text-[#5a6a3b] font-black px-1.5 py-0.5 rounded">
                        ✓ ذاكرة محلية نشطة
                      </span>
                    </div>
                    <p className="text-xs font-sans font-black text-stone-800 leading-relaxed max-h-36 overflow-y-auto">
                      {session.arabicText}
                    </p>
                  </div>
                </div>

                {/* Footer specs / action row */}
                <div className="flex justify-between items-center mt-3 pt-2 limit border-t border-stone-100 text-[9px] text-stone-500 font-bold">
                  <div className="flex items-center gap-3">
                    <span>حجم الكلمات المحصية: <strong className="text-stone-800 font-mono">{session.wordCount} كلمة</strong></span>
                    <span className="text-[#8a9a5b]">✓ تم تدريب ذكاء الأوفلاين بـ <strong className="font-mono">{session.trainedCount}</strong> مراجعة لغوية بنجاح!</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      const remain = savedSessions.filter(s => s.id !== session.id);
                      saveSessionsToDisk(remain);
                    }}
                    className="text-stone-400 hover:text-red-500 transition-all font-black flex items-center gap-0.5"
                    title="حذف هذه الجلسة من السجلات"
                  >
                    <Trash2 size={10} />
                    <span>حذف الجلسة</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
