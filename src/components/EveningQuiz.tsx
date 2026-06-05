import { useState, useEffect } from 'react';
import { SavedWord } from '../types';
import { 
  X, 
  Moon, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  ThumbsUp,
  Brain,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EveningQuizProps {
  savedWords: SavedWord[];
  isOpen: boolean;
  onClose: () => void;
  ttsVoice: string;
  ttsPitch: number;
  ttsRate: number;
}

// Fallback objects if user saved nothing today/recently
const FAMILIAR_ELEMENTS = [
  { english: 'Laptop', arabic: 'حاسوب محمول', phonetics: '[ˈlæptɒp]', category: 'أجهزة وتقنيات', exampleEn: 'I use my laptop daily.', exampleAr: 'أستخدم حاسوبي المحمول يومياً.' },
  { english: 'Cup', arabic: 'كوب شرب', phonetics: '[kʌp]', category: 'أغراض يومية', exampleEn: 'A hot cup of fresh tea.', exampleAr: 'كوب ساخن من الشاي الطازج.' },
  { english: 'Book', arabic: 'كتاب مفيد', phonetics: '[bʊk]', category: 'تعليم ومطالعة', exampleEn: 'This book contains language secrets.', exampleAr: 'يحتوي هذا الكتاب على أسرار اللغة.' },
  { english: 'Apple', arabic: 'تفاحة طازجة', phonetics: '[ˈæpl]', category: 'مأكولات وأغذية', exampleEn: 'An apple is healthy.', exampleAr: 'التفاح مفيد للمناعة والصحة.' },
  { english: 'Smart Glasses', arabic: 'النظارة الذكية', phonetics: '[smɑːt ˈɡlɑːsɪz]', category: 'تقنيات المستقبل', exampleEn: 'My smart glasses guide me.', exampleAr: 'نظارتي الذكية ترشدني في كل مكان.' },
  { english: 'Success', arabic: 'نجاح باهر', phonetics: '[səkˈsɛs]', category: 'صفات هامة', exampleEn: 'Practice is the key to success.', exampleAr: 'الممارسة هي سر النجاح الباهر.' }
];

export default function EveningQuiz({ 
  savedWords, 
  isOpen, 
  onClose, 
  ttsVoice, 
  ttsPitch, 
  ttsRate 
}: EveningQuizProps) {
  
  const [todayWords, setTodayWords] = useState<SavedWord[]>([]);
  const [quizPool, setQuizPool] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);

  // Sound Speech Helpers
  const speakEnglish = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsVoice;
    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;
    window.speechSynthesis.speak(utterance);
  };

  const speakArabic = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;
    window.speechSynthesis.speak(utterance);
  };

  // Determine which words are "Today's Words"
  useEffect(() => {
    if (!isOpen) return;

    // Reset state on open
    setIsStarted(false);
    setIsCompleted(false);
    setCurrentIdx(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);

    const todayStr = new Date().toDateString();
    
    // Filter words saved today
    const filteredToday = savedWords.filter(word => {
      if (!word.savedAt) return false;
      return new Date(word.savedAt).toDateString() === todayStr;
    });

    setTodayWords(filteredToday);

    // Prepare quiz pool (if today's scanned words are fewer than 4, inject recently saved words, or default ones so quiz is rich!)
    let pool: any[] = [...filteredToday];
    
    if (pool.length < 5) {
      // Add other saved words that are not already in pool
      const otherSaved = savedWords.filter(w => !pool.some(p => p.id === w.id));
      pool = [...pool, ...otherSaved.slice(0, 5 - pool.length)];
    }

    if (pool.length < 5) {
      // Inject some interactive defaults so it remains functional
      const missingCount = 5 - pool.length;
      const injected = FAMILIAR_ELEMENTS.slice(0, missingCount);
      pool = [...pool, ...injected];
    }

    setQuizPool(pool);
  }, [savedWords, isOpen]);

  // Build 5 Interactive Multiple Choice questions
  const buildEveningQuiz = () => {
    const subset = [...quizPool].sort(() => 0.5 - Math.random()).slice(0, 5);
    
    const formattedQuestions = subset.map((item, qIdx) => {
      // Distractors source
      const otherMeanings = quizPool
        .filter(w => w.english !== item.english)
        .map(w => w.arabic);
      
      // Select 3 random distractors
      const distractors = [...otherMeanings]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      // If there are not enough items to make 3 distinct options, inject some fallback options
      while (distractors.length < 3) {
        const fallbackWord = FAMILIAR_ELEMENTS[Math.floor(Math.random() * FAMILIAR_ELEMENTS.length)].arabic;
        if (!distractors.includes(fallbackWord) && fallbackWord !== item.arabic) {
          distractors.push(fallbackWord);
        }
      }

      // Merge correct answer at random position (0 to 3)
      const correctIdx = Math.floor(Math.random() * 4);
      const options = [...distractors];
      options.splice(correctIdx, 0, item.arabic);

      return {
        target: item,
        options,
        correctIndex: correctIdx
      };
    });

    setQuestions(formattedQuestions);
    setIsStarted(true);
    
    // Announce the first word
    if (formattedQuestions.length > 0) {
      speakEnglish(formattedQuestions[0].target.english);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);

    const isCorrect = idx === questions[currentIdx].correctIndex;
    if (isCorrect) {
      setScore(prev => prev + 20);
    }

    // Speak correct or incorrect pronoun to user
    const targetWord = questions[currentIdx].target;
    speakEnglish(targetWord.english);
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
      // Auto speak next word to help auditory learners
      setTimeout(() => {
        speakEnglish(questions[currentIdx + 1].target.english);
      }, 300);
    } else {
      setIsCompleted(true);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md select-none" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-[#181d12] to-[#0d100a] text-stone-100 rounded-3xl border border-[#8a9a5b]/35 shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto"
        >
          {/* Top Absolute Close */}
          <button 
            onClick={onClose} 
            className="absolute top-4 left-4 p-2 text-stone-400 hover:text-white bg-stone-900/60 hover:bg-[#8a9a5b]/20 hover:border-[#8a9a5b]/40 border border-transparent rounded-full transition-all cursor-pointer"
            id="close_evening_quiz"
            title="إغلاق الاختبار"
          >
            <X size={16} />
          </button>

          {/* BACKGROUND DESIGN ELEMENTS */}
          <div className="absolute top-10 right-1/4 w-32 h-32 bg-[#8a9a5b]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-[#c5d3a2]/5 rounded-full blur-xl pointer-events-none" />

          {/* SCREEN 1: INTRO COMPONENT */}
          {!isStarted ? (
            <div className="flex flex-col items-center text-center py-6 gap-6">
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#8a9a5b] to-[#5a653c] rounded-full flex items-center justify-center shadow-lg shadow-[#8a9a5b]/20">
                <Moon className="w-10 h-10 text-stone-100 animate-pulse" />
                <div className="absolute -top-1 -right-1 bg-amber-400 text-stone-950 rounded-full p-1 border-2 border-[#181d12]">
                  <Sparkles size={12} className="fill-stone-950" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-black text-white leading-tight">الاختبار المسائي السريع 🌙</h1>
                <p className="text-xs text-stone-400 font-medium max-w-sm mt-2 leading-relaxed">
                  مرحباً بك في جلسة التثبيت والترسيخ لإنهاء يومك بنجاح! نقوم بتجميع كل الكائنات والأشياء التي رأيتها بالنظارة لتحدي ذكائك وتثبيتها بالذاكرة الدائمة بفترة وجيزة.
                </p>
              </div>

              {/* Status information of today's scans */}
              <div className="w-full bg-stone-900/50 rounded-2xl border border-stone-800 p-4.5 text-right flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400 font-bold flex items-center gap-1">
                    <Clock size={13} className="text-[#8a9a5b]" />
                    <span>مكتشفات اليوم:</span>
                  </span>
                  <span className="text-xs font-black bg-[#8a9a5b]/20 text-[#a3b47c] px-2.5 py-0.5 rounded-full border border-[#8a9a5b]/30">
                    {todayWords.length} كلمات مسجلة
                  </span>
                </div>

                {todayWords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pb-1">
                    {todayWords.map((w, idx) => (
                      <span 
                        key={w.id || idx} 
                        className="text-[10px] font-black bg-stone-850 text-stone-200 px-2 py-1 rounded-lg border border-stone-800 hover:border-[#8a9a5b]/40 transition-colors"
                      >
                        {w.english} ⇄ {w.arabic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-stone-950/40 p-3 rounded-xl border border-stone-850">
                    <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-stone-450 leading-normal">
                      لم تحفظ مفرادت جديدة اليوم بعد عبر الكاميرا. سنقترح عليك اختباراً مخصصاً للمراجعة من قائمة الكلمات الذكية السابقة لترسيخ مستواك اللغوي!
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={buildEveningQuiz}
                className="w-full py-4.5 bg-gradient-to-l from-[#8a9a5b] to-[#a3b17c] hover:from-[#7b8b4c] hover:to-[#93a16d] text-stone-100 font-black text-sm rounded-2xl tracking-normal flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98] cursor-pointer mt-4"
              >
                <Brain size={16} className="animate-pulse" />
                <span>ابدأ تحدي الذاكرة السريع (5 أسئلة) ✨</span>
              </button>
            </div>
          ) : !isCompleted ? (
            
            /* SCREEN 2: ACTIVE QUIZ WORKSPACE */
            <div className="flex flex-col gap-6 py-2">
              {/* Question Header Status */}
              <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                <span className="text-xs font-semibold text-stone-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                  <span>سؤال {currentIdx + 1} من {questions.length}</span>
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-wider text-[#a3b47c] bg-[#8a9a5b]/10 border border-[#8a9a5b]/20 px-2 py-0.5 rounded-md uppercase">
                    {questions[currentIdx].target.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {score} نقطة
                  </span>
                </div>
              </div>

              {/* Progress Visual Bar */}
              <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIdx) / questions.length) * 100}%` }}
                  className="bg-gradient-to-l from-[#8a9a5b] to-[#c2d39a] h-full"
                />
              </div>

              {/* Question card (Target Word in English) */}
              <div className="bg-stone-900/60 border border-stone-800 p-6 rounded-2xl text-center flex flex-col items-center gap-3 space-y-1 relative overflow-hidden">
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-[#8a9a5b] font-bold">
                  <Zap size={10} />
                  <span>نظام المعلم الصوتي</span>
                </div>

                <span className="text-[10px] font-extrabold text-stone-400 block tracking-normal">ما هو المعنى الصحيح الكامن للمفردة التالية؟</span>
                <h2 className="text-3xl font-serif font-black text-white tracking-tight leading-none mt-1">
                  {questions[currentIdx].target.english}
                </h2>
                
                <div className="flex items-center gap-1.5 text-xs text-[#a3b47c] font-mono mt-0.5">
                  <span>🔊 {questions[currentIdx].target.phonetics}</span>
                  <button 
                    onClick={() => speakEnglish(questions[currentIdx].target.english)}
                    className="p-1 hover:bg-[#8a9a5b]/20 text-[#a3b47c] rounded-md transition-all cursor-pointer"
                    title="إعادة نطق الكلمة"
                  >
                    <Volume2 size={13} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Dynamic Answer Options */}
              <div className="flex flex-col gap-3">
                {questions[currentIdx].options.map((option: string, idx: number) => {
                  const isCorrect = idx === questions[currentIdx].correctIndex;
                  const isSelected = selectedOption === idx;
                  
                  let optStyle = "bg-stone-900/70 hover:bg-stone-900 border-stone-850 text-stone-200";
                  
                  if (hasAnswered) {
                    if (isCorrect) {
                      optStyle = "bg-emerald-950/60 border-emerald-500/80 text-emerald-100 ring-1 ring-emerald-500/30";
                    } else if (isSelected) {
                      optStyle = "bg-red-950/60 border-red-500/80 text-red-100 ring-1 ring-red-500/30";
                    } else {
                      optStyle = "bg-stone-900/30 border-stone-900 text-stone-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={hasAnswered}
                      className={`w-full p-4 rounded-xl border text-right font-black text-xs transition-all flex items-center justify-between gap-3 active:scale-[0.99] cursor-pointer ${optStyle}`}
                    >
                      <span className="leading-snug">{option}</span>
                      
                      {hasAnswered && isCorrect && (
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      )}
                      {hasAnswered && isSelected && !isCorrect && (
                        <XCircle size={16} className="text-red-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Context shown instantly upon response */}
              {hasAnswered && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-stone-900/80 p-4 rounded-2xl border border-[#8a9a5b]/25 flex flex-col gap-1.5 text-right mt-1"
                >
                  <p className="text-[10px] font-black text-[#a3b47c] flex items-center gap-1 leading-none h-4">
                    <Sparkles size={11} className="fill-[#8a9a5b]/40" />
                    <span>تطبيق ومثال بالترجمة المعتمدة:</span>
                  </p>
                  
                  <div className="flex justify-between items-start gap-2 py-0.5">
                    <p className="text-xs font-serif font-bold text-stone-100 italic leading-relaxed text-left flex-1" dir="ltr">
                      “{questions[currentIdx].target.exampleEn}”
                    </p>
                    <button
                      type="button"
                      onClick={() => speakEnglish(questions[currentIdx].target.exampleEn)}
                      className="p-1 hover:bg-[#8a9a5b]/20 text-[#a3b47c] rounded-md shrink-0 transition-colors"
                      title="استمع للمثال اليومي"
                    >
                      <Volume2 size={12} className="stroke-[2.5]" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-start gap-2 py-0.5">
                    <p className="text-[11px] text-stone-400 font-semibold leading-relaxed text-right flex-1">
                      ({questions[currentIdx].target.exampleAr})
                    </p>
                    <button
                      type="button"
                      onClick={() => speakArabic(questions[currentIdx].target.exampleAr)}
                      className="p-1 hover:bg-stone-850 text-stone-300 rounded-md shrink-0 transition-colors"
                      title="استمع للترجمة العربية"
                    >
                      <Volume2 size={11} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Next navigation triggers */}
              {hasAnswered && (
                <button
                  onClick={handleNext}
                  className="w-full py-3.5 bg-[#8a9a5b] hover:bg-[#7b8b4c] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md cursor-pointer mt-2"
                >
                  <span>{currentIdx + 1 === questions.length ? 'إنهاء وحساب النقاط ➔' : 'انتقل للسؤال التالي'}</span>
                  <ArrowLeft size={13} className="stroke-[2.5]" />
                </button>
              )}
            </div>
          ) : (
            
            /* SCREEN 3: GRADUATION CARD COMPONENT */
            <div className="flex flex-col items-center text-center py-6 gap-6">
              <div className="relative w-24 h-24 bg-gradient-to-br from-amber-400/20 to-[#8a9a5b]/10 border border-amber-400/35 rounded-full flex items-center justify-center shadow-inner">
                <Award size={52} className="text-amber-400 animate-bounce" />
              </div>

              <div className="flex flex-col gap-1.5 max-w-sm">
                <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">سجل يومي مميز لترسيخ اللغة</span>
                <h2 className="text-2xl font-black text-white leading-tight">نتيجة تحدي المساء الذكي:</h2>
                
                <h1 className="text-6xl font-black font-mono text-gradient bg-gradient-to-l from-amber-400 to-[#8a9a5b] bg-clip-text text-transparent my-3">
                  {score}%
                </h1>

                <p className="text-xs text-stone-300 font-medium leading-relaxed px-4">
                  {score === 100 && 'أداء عبقري رائع للغاية! لقد راجعت كل كلماتك الملتقطة واستوعبت معانيها وصوتياتها بالكامل.'}
                  {score >= 80 && score < 100 && 'ممتاز جداً! ذاكرتك اللغوية حادة وتمتاز بسرعة حفظ واستدراك دقيقة للأثاث والأجسام والتعليمات.'}
                  {score >= 60 && score < 80 && 'جيد جداً! استمر في التقاط الأشياء وتكرار تمرين المساء، فالممارسة الدائمة تقود للتفوق.'}
                  {score < 60 && 'خطوة رائعة لتحديث مهاراتك! لا تتردد في خوض مراجعة لاحقة وقراءة الأمثلة الصوتية المفيدة لتنمو باستمرار.'}
                </p>
              </div>

              {/* Action Buttons to restart / close */}
              <div className="flex gap-3 w-full max-w-md pt-5 border-t border-stone-850 mt-2">
                <button
                  onClick={() => {
                    setSelectedOption(null);
                    setHasAnswered(false);
                    setCurrentIdx(0);
                    setScore(0);
                    setIsCompleted(false);
                    buildEveningQuiz();
                  }}
                  className="flex-1 py-3 bg-[#8a9a5b] hover:bg-[#7b8b4c] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span>أعد المحاكاة 🔄</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-stone-900 border border-stone-805 hover:bg-stone-850 hover:text-white text-stone-300 font-extrabold text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <span>أغلق النافذة</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
