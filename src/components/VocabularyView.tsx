import { useState, useEffect } from 'react';
import { SavedWord } from '../types';
import { getSavedWords, deleteSavedWord } from '../lib/firebaseService';
import { 
  Search, 
  Volume2, 
  Trash2, 
  Calendar, 
  Loader2, 
  BookOpen, 
  AlertCircle, 
  Sparkles, 
  Brain, 
  Award, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  BookmarkCheck,
  Check,
  HelpCircle,
  ThumbsUp
} from 'lucide-react';

interface VocabularyViewProps {
  userId: string;
  ttsVoice: string;
  ttsPitch: number;
  ttsRate: number;
}

const FALLBACK_VOCAB: SavedWord[] = [
  {
    id: 'f_1',
    english: 'Caution',
    arabic: 'تحذير / انتباه',
    phonetics: '[kɔːʃn]',
    category: 'لافتات وإشارات',
    exampleEn: 'Proceed with caution when merging onto the highway.',
    exampleAr: 'تقدّم بحذر وانتباه عند الاندماج في الطريق السريع.',
    savedAt: new Date().toISOString(),
    learnedCount: 1
  },
  {
    id: 'f_2',
    english: 'Emergency',
    arabic: 'طوارئ / حالة مستعجلة',
    phonetics: '[ɪˈmɜːdʒənsi]',
    category: 'أمن وعامة',
    exampleEn: 'Break the glass only in case of emergency.',
    exampleAr: 'اكسر الزجاج فقط في حالات الطوارئ القصوى.',
    savedAt: new Date().toISOString(),
    learnedCount: 1
  },
  {
    id: 'f_3',
    english: 'Pedestrian',
    arabic: 'مشاة / مارة',
    phonetics: '[pəˈdestriən]',
    category: 'شارع وتنقل',
    exampleEn: 'Pedestrians have the right of way on this crossing.',
    exampleAr: 'للمشاة حق الأولوية في المرور عبر هذا المعبر الصغير.',
    savedAt: new Date().toISOString(),
    learnedCount: 1
  },
  {
    id: 'f_4',
    english: 'Instruction',
    arabic: 'تعليمات / توجيهات',
    phonetics: '[ɪnˈstrʌkʃn]',
    category: 'تعليم وتوجيه',
    exampleEn: 'Read the safety manual instructions carefully.',
    exampleAr: 'اقرأ كتيب تعليمات السلامة بحرص شديد.',
    savedAt: new Date().toISOString(),
    learnedCount: 1
  },
  {
    id: 'f_5',
    english: 'Accelerate',
    arabic: 'يُسرّع / يزيد السرعة',
    phonetics: '[əkˈseləreɪt]',
    category: 'حركة وتنقل',
    exampleEn: 'The driver accelerated to overtake the slow vehicle.',
    exampleAr: 'قام السائق بتسريع المركبة ليتخطى الشاحنة البطيئة.',
    savedAt: new Date().toISOString(),
    learnedCount: 1
  }
];

export default function VocabularyView({ userId, ttsVoice, ttsPitch, ttsRate }: VocabularyViewProps) {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Tab control: 'list' | 'flashcards' | 'quiz'
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'flashcards' | 'quiz'>('list');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);

  // Smart Quiz state
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    target: SavedWord;
    options: string[];
    correctIndex: number;
  }>>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);

  // Fetch saved words from Firestore
  useEffect(() => {
    async function fetchWords() {
      try {
        setLoading(true);
        const fetched = await getSavedWords(userId);
        setWords(fetched);
      } catch (err) {
        console.error("Error fetching saved words: ", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWords();
  }, [userId]);

  // Handle speak repeat pronunciation
  const speakWord = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsVoice;
    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;
    window.speechSynthesis.speak(utterance);
  };

  // Speak Arabic translation / context
  const speakArabic = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;
    window.speechSynthesis.speak(utterance);
  };

  // Delete word from list & Firestore
  const handleDeleteWord = async (wordId: string) => {
    setDeletingId(wordId);
    try {
      await deleteSavedWord(userId, wordId);
      setWords((prev) => prev.filter(w => w.id !== wordId));
      
      // Reset indexes if bounds exceed
      if (flashcardIndex >= Math.max(1, words.length - 1)) {
        setFlashcardIndex(0);
      }
    } catch (err) {
      console.error("Delete failed: ", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Get distinct categories
  const categories = ['all', ...Array.from(new Set(words.map(w => w.category)))];

  // Apply filters
  const filteredWords = words.filter(word => {
    const matchesSearch = 
      word.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.arabic.includes(searchQuery);
    
    const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Blend words & fallbacks safely for quizzes & decks
  const studyPool = words.length > 0 ? words : FALLBACK_VOCAB;

  // Generate dynamic 5-question multi-choice quiz based on study pool
  const generateQuiz = () => {
    const pool = [...studyPool];
    // Shuffle the pool
    const shuffledPool = pool.sort(() => 0.5 - Math.random());
    const subset = shuffledPool.slice(0, Math.min(5, pool.length));
    
    const builtQuestions = subset.map((target) => {
      // Pick other elements to build distractors
      const otherMeanings = pool
        .filter(p => p.id !== target.id)
        .map(p => p.arabic);
      
      // Shuffle distractors
      const shuffledDistractors = otherMeanings.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      // Insert correct meaning
      const correctIdx = Math.floor(Math.random() * (shuffledDistractors.length + 1));
      const options = [...shuffledDistractors];
      options.splice(correctIdx, 0, target.arabic);

      return {
        target,
        options,
        correctIndex: correctIdx
      };
    });

    setQuizQuestions(builtQuestions);
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setAnsweredCorrectly(null);
    setScore(0);
    setQuizComplete(false);
  };

  // Initialize first quiz when tab shifts
  useEffect(() => {
    if (activeSubTab === 'quiz') {
      generateQuiz();
    }
    // Also flip reset on card transitions
    setIsCardFlipped(false);
  }, [activeSubTab, words]);

  // Handle quiz answer selection
  const handleAnswerOption = (optionIdx: number, correctIdx: number) => {
    if (selectedOptionIdx !== null) return; // Answer locked
    
    setSelectedOptionIdx(optionIdx);
    const correct = optionIdx === correctIdx;
    setAnsweredCorrectly(correct);
    
    if (correct) {
      setScore(prev => prev + 20); // 20 pts per question, max 100
    }
  };

  // Skip / Next in quiz
  const handleNextQuestion = () => {
    setSelectedOptionIdx(null);
    setAnsweredCorrectly(null);
    if (currentQuestionIdx + 1 < quizQuestions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setQuizComplete(true);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300" dir="rtl">
      
      {/* Primary Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-l from-[#8a9a5b]/10 to-transparent rounded-3xl border border-[#8a9a5b]/15 gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 leading-tight">البيئة التعليمية والقاموس الشخصي ({words.length})</h2>
          <p className="text-xs text-stone-500 font-semibold mt-1">
            إدارة الكلمات الملتقطة، والبطاقات التفاعلية لترسيخ الذاكرة، مع تحدّي الاختبار المباشر الذكي!
          </p>
        </div>
        
        {/* Navigation Tabs for local workspace */}
        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'list' ? 'bg-[#8a9a5b] text-white shadow-sm' : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            قاموسي
          </button>
          <button
            onClick={() => {
              setActiveSubTab('flashcards');
              setFlashcardIndex(0);
              setIsCardFlipped(false);
            }}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'flashcards' ? 'bg-[#8a9a5b] text-white shadow-sm' : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            <Brain size={12} />
            <span>بطاقات ذكية</span>
          </button>
          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'quiz' ? 'bg-[#8a9a5b] text-white shadow-sm' : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            <Award size={12} />
            <span>تحدي التقييم</span>
          </button>
        </div>
      </div>

      {/* 1. LINGUISTIC DICTIONARY LIST WORKSPACE */}
      {activeSubTab === 'list' && (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative w-full md:flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالإنكليزية أو العربية في قاموسك..."
                className="w-full pl-4 pr-10 py-3 bg-stone-50 border border-stone-250 rounded-2xl text-xs font-bold focus:outline-none focus:border-[#8a9a5b] text-right"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-stone-400">
                <Search size={16} />
              </span>
            </div>

            {/* Categories Scroller */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#8a9a5b] text-white shadow-md'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  {cat === 'all' ? 'الكل' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Words Grid Layout */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-stone-200">
              <Loader2 className="animate-spin text-[#8a9a5b] mb-3" size={32} />
              <p className="text-xs font-bold text-stone-500">جاري تصفح القاموس الشخصي...</p>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-stone-250 p-6 text-center shadow-3xs">
              <div className="w-16 h-16 bg-[#8a9a5b]/10 rounded-full flex items-center justify-center text-[#8a9a5b] mb-4">
                <AlertCircle size={30} />
              </div>
              <h3 className="text-base font-black text-stone-800">لا توجد كلمات محفوظة تطابق بحثك حالياً</h3>
              <p className="text-xs text-stone-400 max-w-md mt-2 font-semibold leading-relaxed">
                اذهب إلى شاشة الكاميرا وتصفَّح الأشياء بالنظارة أو العبارات اللفظية، وسجّلها بضغطة زر لتصنع قائمة دراسية حية ملؤها الذكاء اللغوي!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWords.map((word) => (
                <div 
                  key={word.id} 
                  className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group hover:border-[#8a9a5b]/35"
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[9px] font-black tracking-wider bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md leading-none h-4 flex items-center justify-center">
                        {word.category}
                      </span>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteWord(word.id)}
                        disabled={deletingId === word.id}
                        className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                        title="حذف من القاموس"
                      >
                        {deletingId === word.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>

                    {/* Vocabulary display */}
                    <div className="text-right">
                      <h3 className="text-lg font-black text-stone-900 mb-1">{word.arabic}</h3>
                      <div className="flex items-center gap-1.5 text-stone-400 text-xs mb-3 font-semibold">
                        <span className="font-serif text-sm font-black text-[#5a6a3b]">{word.english}</span>
                        <span className="font-mono text-[9px] text-stone-400 italic">({word.phonetics})</span>
                      </div>
                    </div>

                    {/* Usage Sentence */}
                    <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100 text-right mt-2 text-xs flex flex-col gap-2">
                      <span className="text-[9px] font-bold text-stone-400 block mb-0.5">المثال اللغوي المستخرج:</span>
                      
                      <div className="flex items-center justify-between gap-2.5 bg-white p-2 rounded-xl border border-stone-150/40">
                        <p className="font-bold text-stone-850 leading-relaxed font-serif text-left flex-1" dir="ltr">“{word.exampleEn}”</p>
                        <button
                          type="button"
                          onClick={() => speakWord(word.exampleEn)}
                          className="p-1 hover:bg-[#8a9a5b]/10 text-[#8a9a5b] rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                          title="استمع للمثال بالإنجليزية"
                        >
                          <Volume2 size={13} className="stroke-[2.5]" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2.5 bg-[#8a9a5b]/4 p-2 rounded-xl border border-[#8a9a5b]/10">
                        <p className="text-stone-550 font-semibold leading-relaxed text-right flex-1">({word.exampleAr})</p>
                        <button
                          type="button"
                          onClick={() => speakArabic(word.exampleAr)}
                          className="p-1 hover:bg-stone-100 text-stone-600 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                          title="استمع للترجمة العربية"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom pronounce listen tools */}
                  <div className="flex justify-between items-center border-t border-stone-100 mt-4 pt-4 text-xs font-semibold text-stone-400">
                    <span className="flex items-center gap-1 text-[9px] font-bold">
                      <Calendar size={11} />
                      <span>حُفظ بتاريخ: {new Date(word.savedAt).toLocaleDateString('ar-EG')}</span>
                    </span>

                    <button
                      onClick={() => speakWord(word.english)}
                      className="px-3 py-1.5 bg-stone-50 hover:bg-[#8a9a5b]/10 text-[#8a9a5b] rounded-xl flex items-center gap-1 transition-all cursor-pointer text-[11px] font-black border border-stone-250/20"
                    >
                      <Volume2 size={12} />
                      <span>استمع</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. FLASHCARD INTERACTIVE SYSTEM */}
      {activeSubTab === 'flashcards' && (
        <div className="max-w-2xl mx-auto flex flex-col gap-5 py-2 animate-in fade-in duration-300">
          
          {/* Card Indicator Progress header */}
          <div className="flex justify-between items-center text-xs text-stone-400 font-bold px-1">
            <span>البطاقات التعليمية اليدوية الذكية</span>
            <span>البطاقة {flashcardIndex + 1} من {studyPool.length}</span>
          </div>

          {/* Core Interactive Flippable Card Deck Frame */}
          <div 
            onClick={() => setIsCardFlipped(!isCardFlipped)}
            className={`min-h-[280px] bg-white rounded-3xl border-2 ${
              isCardFlipped ? 'border-[#8a9a5b] bg-[#fbfbf9]' : 'border-stone-200'
            } p-8 flex flex-col justify-between shadow-sm cursor-pointer select-none transition-all duration-300 transform active:scale-[0.99] relative overflow-hidden`}
          >
            {/* Top Badge Details */}
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-extrabold uppercase bg-stone-100 text-stone-500 px-2.5 py-1 rounded-md">
                📂 تصنيف: {studyPool[flashcardIndex]?.category || 'تعليم لغوي'}
              </span>
              <span className="text-[10px] font-extrabold text-[#8a9a5b] tracking-wider animate-pulse uppercase">
                {isCardFlipped ? 'انقر لإلقاء نظرة على الإنجليزية ➔' : 'انقر لكشف المعنى والترجمة ➔'}
              </span>
            </div>

            {/* Central visual text based on state */}
            {!isCardFlipped ? (
              <div className="text-center my-6 flex flex-col gap-2 items-center">
                <span className="text-xs text-stone-400 font-black tracking-wide uppercase">الكلمة المكتوبة بالإنكليزية:</span>
                <h1 className="text-3xl font-serif font-black text-stone-900 tracking-tight leading-none">
                  {studyPool[flashcardIndex]?.english}
                </h1>
                <span className="text-[11px] text-[#5a6a3b] font-mono tracking-widest bg-[#8a9a5b]/10 py-1 px-3 rounded-full font-bold mt-1">
                  🔊 {studyPool[flashcardIndex]?.phonetics || '[صوتيات]'}
                </span>
              </div>
            ) : (
              <div className="text-center my-6 flex flex-col gap-25 items-center">
                <span className="text-xs text-stone-400 font-black tracking-wide uppercase">المقابل والمعنى باللغة العربية:</span>
                <h2 className="text-2xl font-black text-stone-850 leading-relaxed">
                  {studyPool[flashcardIndex]?.arabic}
                </h2>
                
                {/* Embedded example review tip */}
                <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/50 text-right w-full max-w-sm mt-3 flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-stone-400 block">العبارة وتطبيقها اليومي:</span>
                  
                  <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1 rounded-lg border border-stone-150">
                    <p className="font-serif font-bold text-xs text-stone-900 leading-normal flex-1 text-left" dir="ltr">“{studyPool[flashcardIndex]?.exampleEn}”</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(studyPool[flashcardIndex]?.exampleEn);
                      }}
                      className="p-1 hover:bg-[#8a9a5b]/10 text-[#8a9a5b] rounded-md shrink-0 cursor-pointer"
                      title="استمع للمثال اليومي"
                    >
                      <Volume2 size={13} className="stroke-[2.5]" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-[#8a9a5b]/4 px-2.5 py-1 rounded-lg border border-[#8a9a5b]/10">
                    <p className="text-[10px] text-stone-500 leading-normal font-semibold flex-1 text-right">({studyPool[flashcardIndex]?.exampleAr})</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakArabic(studyPool[flashcardIndex]?.exampleAr);
                      }}
                      className="p-1 hover:bg-stone-100 text-stone-600 rounded-md shrink-0 cursor-pointer"
                      title="استمع للترجمة العربية"
                    >
                      <Volume2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Speaking speaker triggers for the current word */}
            <div className="flex justify-between items-center mt-auto border-t border-stone-100 pt-5">
              <span className="text-[10px] text-stone-400 leading-normal font-semibold">
                * انقر في أي مكان على البطاقة لقلبها، أو استخدم الأزرار بالأسفل للتطوير.
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Avoid triggering card invert
                  speakWord(studyPool[flashcardIndex]?.english);
                }}
                className="p-2.5 bg-stone-50 hover:bg-[#8a9a5b]/15 text-[#8a9a5b] rounded-full transition-all cursor-pointer shadow-3xs"
                title="نطق الكلمة إنجليزي"
              >
                <Volume2 size={16} />
              </button>
            </div>
          </div>

          {/* Cards Navigator Controls layout */}
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={() => {
                setIsCardFlipped(false);
                setFlashcardIndex(prev => Math.max(0, prev - 1));
              }}
              disabled={flashcardIndex === 0}
              className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                flashcardIndex === 0 
                  ? 'bg-stone-50 border-stone-150 text-stone-300 cursor-not-allowed' 
                  : 'bg-white border-stone-200 text-stone-600 hover:text-stone-850 hover:bg-stone-50 shadow-3xs'
              }`}
            >
              <ChevronRight size={14} className="stroke-[2.5]" />
              <span>اليسار السابق</span>
            </button>

            <button
              onClick={() => {
                setIsCardFlipped(!isCardFlipped);
              }}
              className="px-5 py-3 bg-stone-100 hover:bg-stone-150 border border-stone-200/50 text-stone-800 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              <RefreshCcw size={13} className="text-[#8a9a5b]" />
              <span>اقلب البطاقة</span>
            </button>

            <button
              onClick={() => {
                setIsCardFlipped(false);
                setFlashcardIndex(prev => Math.min(studyPool.length - 1, prev + 1));
              }}
              disabled={flashcardIndex === studyPool.length - 1}
              className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                flashcardIndex === studyPool.length - 1 
                  ? 'bg-stone-50 border-stone-150 text-stone-300 cursor-not-allowed' 
                  : 'bg-white border-stone-200 text-stone-600 hover:text-stone-850 hover:bg-stone-50 shadow-3xs'
              }`}
            >
              <span>التالي اليمين</span>
              <ChevronLeft size={14} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE QUIZ & SCORE SYSTEM */}
      {activeSubTab === 'quiz' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-3xl border border-stone-200 shadow-sm animate-in fade-in duration-300">
          
          {/* Initial / In-progress Quiz screen layout */}
          {!quizComplete && quizQuestions.length > 0 ? (
            <div className="flex flex-col gap-6">
              
              {/* Question progress header with scoring state */}
              <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                <div className="flex items-center gap-1.5 text-stone-500 font-black text-xs">
                  <HelpCircle size={14} className="text-[#8a9a5b]" />
                  <span>السؤال {currentQuestionIdx + 1} من {quizQuestions.length}</span>
                </div>
                <div className="text-xs font-extrabold text-stone-800 bg-stone-50 py-1 px-3 rounded-lg border border-stone-100">
                  النقاط الحالية: <span className="text-[#8a9a5b] font-mono">{score}</span> / 100
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mb-1">
                <div 
                  className="bg-[#8a9a5b] h-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx) / quizQuestions.length) * 100}%` }}
                />
              </div>

              {/* The educational target block */}
              <div className="bg-stone-50 border border-stone-200/80 p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                <span className="text-[10px] font-black text-stone-400 block tracking-wider uppercase">ما هو المعنى الصحيح للمفردة الإنجليزية بالأسفل؟</span>
                <h2 className="text-2xl font-serif font-black text-[#5a6a3b]">{quizQuestions[currentQuestionIdx].target.english}</h2>
                <div className="flex items-center gap-1 text-[11px] text-stone-450 font-mono mt-0.5">
                  <span>🔊 {quizQuestions[currentQuestionIdx].target.phonetics}</span>
                  <button 
                    onClick={() => speakWord(quizQuestions[currentQuestionIdx].target.english)}
                    className="p-1 hover:bg-[#8a9a5b]/10 text-[#8a9a5b] rounded-md shrink-0 ml-1 transition-all cursor-pointer"
                  >
                    <Volume2 size={11} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Dynamic Multiple Choice Interactive Option buttons */}
              <div className="flex flex-col gap-3">
                {quizQuestions[currentQuestionIdx].options.map((option, idx) => {
                  const isCorrectAnswer = idx === quizQuestions[currentQuestionIdx].correctIndex;
                  const isSelected = selectedOptionIdx === idx;
                  const hasAnswered = selectedOptionIdx !== null;
                  
                  let btnStyle = 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50';
                  
                  if (hasAnswered) {
                    if (isCorrectAnswer) {
                      // Turn correct answer green
                      btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-850 ring-2 ring-emerald-50';
                    } else if (isSelected) {
                      // Turn selected wrong choice red
                      btnStyle = 'bg-red-50 border-red-400 text-red-850 ring-2 ring-red-50';
                    } else {
                      // Fade others out
                      btnStyle = 'bg-white border-stone-150 text-stone-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerOption(idx, quizQuestions[currentQuestionIdx].correctIndex)}
                      disabled={hasAnswered}
                      className={`w-full p-4 rounded-2xl border text-right font-black text-xs transition-all cursor-pointer flex items-center justify-between gap-3 ${btnStyle}`}
                    >
                      <span className="leading-snug">{option}</span>
                      
                      {hasAnswered && isCorrectAnswer && (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      )}
                      {hasAnswered && isSelected && !isCorrectAnswer && (
                        <XCircle size={16} className="text-red-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Constructive explanation shown instantly after voting */}
              {selectedOptionIdx !== null && (
                <div className="bg-[#8a9a5b]/5 p-4 rounded-2xl border border-[#8a9a5b]/15 leading-relaxed leading-normal mt-1 animate-in fade-in duration-200 flex flex-col gap-1.5 text-right">
                  <div className="flex items-center gap-1.5 text-xs text-[#5a6a3b] font-extrabold">
                    <Sparkles size={12} className="text-[#8a9a5b] fill-[#8a9a5b]" />
                    <span>تفسير المعمل اللغوي والتطبيق الموصى به:</span>
                  </div>
                  <p className="text-stone-850 text-xs font-bold font-serif leading-normal">
                    “{quizQuestions[currentQuestionIdx].target.exampleEn}”
                  </p>
                  <p className="text-stone-500 text-[11px] leading-normal font-semibold">
                    ({quizQuestions[currentQuestionIdx].target.exampleAr})
                  </p>
                </div>
              )}

              {/* Next navigation triggers */}
              {selectedOptionIdx !== null && (
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3.5 bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white font-extrabold text-xs rounded-2xl tracking-normal flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mt-2"
                >
                  <span>{currentQuestionIdx + 1 === quizQuestions.length ? 'رؤية النتيجة النهائية' : 'انتقل للسؤال التالي'}</span>
                  <ChevronLeft size={14} className="stroke-[2.5]" />
                </button>
              )}

            </div>
          ) : quizComplete ? (
            
            /* Finish score badge interactive card */
            <div className="text-center flex flex-col items-center justify-center gap-6 py-8 animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 bg-[#8a9a5b]/10 text-[#8a9a5b] rounded-full flex items-center justify-center shadow-inner">
                <Award size={48} className="animate-bounce" />
              </div>
              
              <div className="flex flex-col gap-1.5 max-w-sm">
                <span className="text-[11px] font-extrabold uppercase text-[#5a6a3b] tracking-wider">تهانينا! أكملت تحدي لغتك</span>
                <h3 className="text-2xl font-black text-stone-900 leading-tight">نتيجة الاختبار والتقييم:</h3>
                
                {/* Visual scorecard percentage */}
                <h1 className="text-5xl font-black font-mono text-[#8a9a5b] mt-2 mb-1">{score}%</h1>
                
                <p className="text-xs text-stone-500 font-bold leading-relaxed px-4">
                  {score === 100 && 'الدرجة الكاملة مذهل للغاية! أنت ملمّ بجميع مصطلحاتك وقمت بمراجعتها بكفاءة مع المعلم.'}
                  {score >= 80 && score < 100 && 'رائع جداً! مستوى لغوي متميز وتركيز عالٍ ومثالي، استمر على هذا المنوال.'}
                  {score >= 60 && score < 80 && 'جيد جداً! لقد تجاوزت الاختبار بنجاح، المراجعة المستمرة ستجعله ممتازاً بالتأكيد.'}
                  {score < 60 && 'بداية طيبة للغاية! تصفّح البطاقات الذكية، والتقط المزيد من الكائنات ليعود ذكاؤك أقوى!'}
                </p>
              </div>

              {/* Control triggers to restart or learn more */}
              <div className="flex gap-3 w-full max-w-md pt-4 border-t border-stone-100 mt-2">
                <button
                  onClick={() => generateQuiz()}
                  className="flex-1 py-3 bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <RefreshCcw size={13} />
                  <span>ابدأ اختباراً جديداً</span>
                </button>
                <button
                  onClick={() => setActiveSubTab('list')}
                  className="flex-1 py-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 font-extrabold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  <span>العودة لقاموسي</span>
                </button>
              </div>
            </div>
          ) : (
            /* Quiz generating fallback fallback */
            <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[#8a9a5b]" size={28} />
              <p className="text-xs font-bold text-stone-400">يقوم المعلم بتحضير خيارات الاختبار التفاعلي...</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
