import { useState } from 'react';
import { AppSettings } from '../types';
import { Volume2, Settings, Sparkles, HelpCircle, Check, ShieldCheck } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export default function SettingsView({ settings, onSettingsChange }: SettingsViewProps) {
  const [voice, setVoice] = useState(settings.ttsVoice);
  const [pitch, setPitch] = useState(settings.ttsPitch);
  const [rate, setRate] = useState(settings.ttsRate);
  const [autoSpeak, setAutoSpeak] = useState(settings.autoSpeak);
  const [testSuccess, setTestSuccess] = useState(false);

  // Gemini Advanced Option
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('LingoLens_GeminiKey') || '');
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveSettings = () => {
    onSettingsChange({
      ttsVoice: voice,
      ttsPitch: pitch,
      ttsRate: rate,
      autoSpeak,
      trackingWaitTime: settings.trackingWaitTime
    });
    setTestSuccess(true);
    setTimeout(() => setTestSuccess(false), 2500);
  };

  const handleTestTTS = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const txt = voice === 'en-US' ? 'Hello! Welcome to Lingo Lens.' : 'Hello! Welcome to Lingo Lens.';
    const utterance = new SpeechSynthesisUtterance(txt);
    utterance.lang = voice;
    utterance.pitch = pitch;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveGeminiKey = () => {
    if (geminiKey.trim()) {
      localStorage.setItem('LingoLens_GeminiKey', geminiKey.trim());
    } else {
      localStorage.removeItem('LingoLens_GeminiKey');
    }
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white rounded-3xl border border-stone-200 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900">إعدادات النطق والمساعد</h2>
          <p className="text-xs text-stone-500 font-medium">خصّص سرعة ونبرة الصوت، جرب اللكنات المختلفة، أو أضف مفتاح ذكاء اصطناعي مخصص.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[#5a6a3b] font-bold text-xs bg-[#8a9a5b]/10 px-3 py-1.5 rounded-full">
          <Settings size={14} />
          <span>مركز التحكم والتخصيص</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Audio Speech Customization */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-stone-850 flex items-center gap-2 border-b pb-3 border-stone-100">
            <Volume2 className="text-[#8a9a5b]" size={18} />
            <span>تخصيص الخرج الصوتي (نطق اللغة الإنجليزية)</span>
          </h3>

          {testSuccess && (
            <div className="p-3 bg-green-50 text-emerald-600 rounded-xl text-xs font-bold text-center border border-emerald-200">
              تم حفظ إعدادات الصوت بنجاح!
            </div>
          )}

          <div className="space-y-4">
            {/* Accent selection */}
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-2">اللكنة واللسان المفضل</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVoice('en-US')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                    voice === 'en-US'
                      ? 'bg-[#f5f5f0] text-[#5a6a3b] border-[#8a9a5b] shadow-sm'
                      : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  اللكنة الأمريكية (US Accent)
                </button>
                <button
                  type="button"
                  onClick={() => setVoice('en-GB')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                    voice === 'en-GB'
                      ? 'bg-[#f5f5f0] text-[#5a6a3b] border-[#8a9a5b] shadow-sm'
                      : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  اللكنة البريطانية (UK Accent)
                </button>
              </div>
            </div>

            {/* Pitch slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-stone-500">درجة حدة الصوت (Pitch)</label>
                <span className="text-xs font-mono text-stone-400">{pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-[#8a9a5b]"
              />
            </div>

            {/* Rate/Speed slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-stone-500">سرعة نطق الكلمات (Speed)</label>
                <span className="text-xs font-mono text-stone-400">{rate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-[#8a9a5b]"
              />
            </div>

            {/* Auto speak on locking */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-stone-700">النطق التلقائي المستمر</span>
                <span className="text-[10px] text-stone-400">انطق الكلمة فوراً بمجرد تثبيت الكاميرا عليها</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`w-12 h-6 rounded-full p-1 transition-all ${autoSpeak ? 'bg-[#8a9a5b]' : 'bg-stone-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${autoSpeak ? 'translate-x-0' : '-translate-x-6'}`} />
              </button>
            </div>
            
            {/* Quick Actions test */}
            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="flex-1 py-3 bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>حفظ التفضيلات الصوتية</span>
              </button>
              
              <button
                type="button"
                onClick={handleTestTTS}
                className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                اختبر تجربة النطق
              </button>
            </div>
          </div>
        </div>

        {/* Gemini Advanced Vision Configuration (Optional Future-Proof) */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-stone-850 flex items-center gap-2 border-b pb-3 border-stone-100">
            <Sparkles className="text-amber-500" size={18} />
            <span>المساعد البصري المتقدم (اختياري بالكامل)</span>
          </h3>

          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-amber-800 leading-relaxed">
              تطبيق LingoLens مصمم ليعتمد بالكامل على الذكاء الاصطناعي المحلي (TensorFlow) المجاني تماماً ليوفر عليك التكاليف ويكون جاهزاً للعمل فورا!
            </p>
            <p className="text-[10px] text-stone-500 leading-relaxed font-semibold">
              ولكن في حال رغبت مستقبلاً في تطويره ليقوم بتحليل دقيق جداً للمشاهد والترجمات التفصيلية للجمل المعقدة في بيئتك، يمكنك مستقبلاً تفعيل المحرك السحابي:
            </p>
          </div>

          {keySaved && (
            <div className="p-3 bg-green-50 text-emerald-600 rounded-xl text-xs font-bold text-center border border-emerald-200">
              تم تحديث مفتاح Gemini الاختياري!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">مفتاح API الخاص بـ Gemini (Gemini API Key)</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-4 pr-10 py-3 bg-stone-55 border border-stone-200 rounded-xl text-sm text-left focus:outline-none focus:border-[#8a9a5b] font-mono leading-none"
              />
              <span className="text-[10px] text-stone-400 font-medium block mt-1.5">
                نحن لا نحتفظ بمفاتحك؛ يتم حفظها وتخزينها محلياً في متصفحك لتجري اتصالات سحابية مباشرة.
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveGeminiKey}
              className="w-full py-3 border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer pt-2"
            >
              <ShieldCheck size={14} className="text-[#8a9a5b]" />
              <span>{geminiKey ? 'تحديث وحفظ المفتاح' : 'إلغاء المفتاح واستخدام المعالج المحلي المجاني'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Educational Guide Card */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <h3 className="text-lg font-black text-stone-850 flex items-center gap-2 mb-3">
          <HelpCircle size={18} className="text-[#8a9a5b]" />
          <span>استكشاف طريقة عمل التقنيات المدمجة</span>
        </h3>
        <p className="text-xs text-stone-605 leading-relaxed font-semibold">
          1. <strong className="text-stone-850">التعرف على الأشياء (Object Detection):</strong> يستخدم التطبيق خوارزميات الذكاء الاصطناعي خفيفة الحجم التي تعمل داخل الهاتف أو الحاسوب (Client-Side Tensorflow.js Model). يقوم النموذج بتحليل الصورة فريم بفريم بحدود (30 فريم بالثانية) لتصنيف الكائنات بدقة دون الحاجة لأي خوادم سحابية مدفوعة.
        </p>
        <p className="text-xs text-stone-605 leading-relaxed font-semibold mt-2">
          2. <strong className="text-stone-850">تثبيت وتتبع النظر (Gaze Tracker):</strong> عند النظر والتركيز على جسم بالوسط لمدة 1.2 ثانية، يفسر التطبيق ذلك على أنه رغبة في دراسة هذا الجسم، فيقوم بتثبيت القراءة تلقائياً ونسخ المفردة الإنكليزية والترجمة العربية لها.
        </p>
        <p className="text-xs text-stone-605 leading-relaxed font-semibold mt-2">
          3. <strong className="text-stone-850">تحفيز النطق المباشر:</strong> من خلال دمج تقنيات النطق القياسية بالمتصفح، يتم قراءة الكلمات باللكنة الإنكليزية بوضوح تام، مما يعزز مهارات الاستماع والتهجئة الصحيحة.
        </p>
      </div>
    </div>
  );
}
