import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Send, 
  Volume2, 
  Loader2, 
  MessageSquareCode, 
  HelpCircle, 
  ChevronDown, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types';

interface AICopilotProps {
  userProfile: UserProfile | null;
  ttsVoice: string;
  ttsPitch: number;
  ttsRate: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  { label: 'شرح قاعدة A / An / The', query: 'اشرح لي ببساطة قاعدة أدوات التعريف والتنكير (a, an, the) باللغة الإنجليزية مع أمثلة.' },
  { label: 'طلب الطعام بتهذيب', query: 'كيف يمكنني طلب الطعام داخل مطعم بريطاني بتهذيب؟ أعطني جمل من فضلك.' },
  { label: 'الفرق بين Make و Do', query: 'ما الفرق بين استخدام الفعلين Make و Do في الإنجليزية مع أمثلة في جدول دقيق؟' },
  { label: 'رسالة بريد رسمي للعمل', query: 'كيف أكتب صيغة بريد إلكتروني رسمي لمدير العمل في حال اعتذار عن التأخر الصباحي؟' }
];

export default function AICopilot({ userProfile, ttsVoice, ttsPitch, ttsRate }: AICopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUnreadPulse, setShowUnreadPulse] = useState(true);
  const containerEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting on first toggle opening
  useEffect(() => {
    if (messages.length === 0) {
      const name = userProfile?.displayName || 'زائرنا الكريم';
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `مرحباً بك يا ${name}! 👋 أنا منصور، معلمك الشخصي ومساعدك اللغوي المدمج بنظارة LingoLens. 🎓✨

يمكنك أن تسألني أي سؤال يخطر ببالك لتتعلم الإنجليزية بذكاء:
• قواعد لغوية معقدة مع شرحها بالعربية
• صياغة عبارات وتعبيرات لمختلف المواقف
• ترجمة مقاطع أو كلمات لتعلم استخدامها الصحيح

ماذا تحب أن تتعلم اليوم؟ اختر أحد التوجيهات بالأسفل أو اكتب سؤالك الخاص!`,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
        }
      ]);
    }
  }, [isOpen, userProfile, messages.length]);

  // Handle scroll to bottom of chat
  useEffect(() => {
    containerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle TTS Speak
  const speakEnglish = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Attempt to extract English sub-phrases or sentences from the assistant mixed-response
    // Match anything English: English characters, punctuation
    const englishRegex = /[a-zA-Z\s.,;:!?'-]{3,}/g;
    const matches = text.match(englishRegex);
    
    let textToSpeak = '';
    if (matches && matches.length > 0) {
      // Pick the longest match or join them
      textToSpeak = matches.filter(m => m.trim().length > 3).join('. ');
    } else {
      textToSpeak = text; // Fallback
    }

    if (!textToSpeak.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = ttsVoice;
    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;
    window.speechSynthesis.speak(utterance);
  };

  // Chat Submission
  const handleSendMessage = async (customQuery?: string) => {
    const textToSend = customQuery || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customQuery) setInputValue('');
    setIsLoading(true);

    try {
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-8)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      // Retrieve active AI provider from local storage so it synchronizes with the options dashboard setting
      let activeProvider = 'gemini';
      try {
        const saved = localStorage.getItem('lingolens_ai_provider');
        if (saved === 'ollama') activeProvider = 'ollama';
      } catch (e) {}

      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          history: chatHistory,
          userRank: userProfile?.level || 'beginner',
          provider: activeProvider
        })
      });

      if (!res.ok) {
        throw new Error('فشل جلب المعالج اللغوي');
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'آسف للغاية، لم أستطع صياغة رد مناسب حالياً.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Copilot response error: ', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: '⚠️ عذراً يا صديقي، يبدو أن هناك عطلاً طفيفاً في الاتصال السحابي بالمعالج. يرجى مراجعة مفتاح API الخاص بك أو إعادة المحاولة ثانية.',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-end gap-3" dir="rtl">
      
      {/* 1. MAIN CHAT EXPANDED CONTAINER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-[90vw] sm:w-[420px] h-[550px] bg-white rounded-3xl border border-stone-250/80 shadow-2xl flex flex-col overflow-hidden leading-normal filter drop-shadow-xl"
          >
            {/* Header Toolbar */}
            <div className="p-4 bg-gradient-to-l from-[#8a9a5b] to-[#a3b17c] text-white flex justify-between items-center select-none shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Sparkles size={18} className="text-amber-200 fill-amber-200 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black leading-tight">الأستاذ منصور 🎓</h4>
                  <p className="text-[9px] text-[#e8f1dc] font-bold tracking-wide -mt-0.5">معلم اللغات المساعد المباشر</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 active:bg-white/20 rounded-lg transition-all cursor-pointer"
                title="إغلاق التوجيه اللغوي"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages Feed Roller */}
            <div className="flex-1 overflow-y-auto p-4 bg-stone-50 space-y-4">
              {messages.map((msg) => {
                const isSystem = msg.id === 'welcome';
                const isAssistant = msg.sender === 'assistant';
                
                return (
                  <div 
                    key={msg.id}
                    className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs whitespace-pre-wrap leading-relaxed shadow-3xs border ${
                        isAssistant 
                          ? 'bg-white text-stone-800 border-stone-200/60 rounded-tr-none' 
                          : 'bg-[#8a9a5b] text-white border-[#859458] rounded-tl-none font-bold'
                      }`}
                    >
                      {msg.text}

                      {/* Speaking trigger inside English fragments */}
                      {isAssistant && !isSystem && (
                        <div className="flex justify-end mt-2 pt-2 border-t border-stone-100">
                          <button
                            onClick={() => speakEnglish(msg.text)}
                            className="px-2 py-1 bg-stone-50 hover:bg-[#8a9a5b]/10 text-[#8a9a5b] rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border border-stone-150"
                            title="نطق الكلمات الإنجليزية بالرد"
                          >
                            <Volume2 size={11} className="stroke-[2.5]" />
                            <span>استمع للإنجليزية</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-stone-400 font-bold mt-1 px-1">{msg.timestamp}</span>
                  </div>
                );
              })}

              {/* Dynamic Loading block */}
              {isLoading && (
                <div className="flex flex-col items-start animate-fade-in">
                  <div className="bg-white rounded-2xl p-3.5 border border-stone-200 flex items-center gap-2.5 shadow-3xs rounded-tr-none">
                    <Loader2 size={14} className="text-[#8a9a5b] animate-spin" />
                    <span className="text-xs text-stone-400 font-semibold leading-none">يقوم الأستاذ منصور بكتابة الإجابة اللغوية...</span>
                  </div>
                </div>
              )}
              <div ref={containerEndRef} />
            </div>

            {/* Sub-Quick chips presets (only when not loading & input is empty) */}
            {messages.length > 0 && !isLoading && inputValue.trim().length === 0 && (
              <div className="p-3 bg-white border-t border-stone-100 flex gap-1.5 overflow-x-auto max-w-full whitespace-nowrap shrink-0">
                {PRESET_PROMPTS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(preset.query)}
                    className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-full text-[10px] font-black text-stone-600 transition-all cursor-pointer flex-shrink-0 leading-none"
                  >
                    💡 {preset.label}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Keyboard text input bar */}
            <div className="p-3 border-t border-stone-200 bg-white flex gap-2 shrink-0 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="اسأل منصور عن القواعد، الترجمة، أو صياغة الجمل..."
                className="flex-1 px-3 py-2.5 bg-stone-50 border border-stone-250/80 rounded-xl text-xs font-bold focus:outline-none focus:border-[#8a9a5b] text-right"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                  inputValue.trim() && !isLoading
                    ? 'bg-[#8a9a5b] text-white hover:bg-[#7a8a4b] shadow-md'
                    : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                }`}
                title="إرسال السؤال"
              >
                <Send size={14} className="rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CHAT TRIGGER FLOATING FLUID BUTTON */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowUnreadPulse(false);
        }}
        className="w-14 h-14 rounded-full bg-[#8a9a5b] hover:bg-[#7b8b4c] text-white flex items-center justify-center shadow-lg relative cursor-pointer filter hover:brightness-105"
        title="تحدّث مع الأستاذ منصور"
        aria-label="مساعد الذكاء الاصطناعي اللغوي"
      >
        {isOpen ? (
          <ChevronDown size={24} className="stroke-[2.5]" />
        ) : (
          <Sparkles size={24} className="fill-white/10 animate-pulse" />
        )}

        {/* Pulse circular notifications indicator */}
        {showUnreadPulse && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[9px] text-stone-900 font-extrabold items-center justify-center select-none leading-none scale-90">1</span>
          </span>
        )}
      </motion.button>

    </div>
  );
}
