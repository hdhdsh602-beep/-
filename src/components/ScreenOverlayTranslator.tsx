import { type PointerEvent, useEffect, useRef, useState } from 'react';
import { Clipboard, Languages, Loader2, Move, X } from 'lucide-react';
import { getDefaultTranslationEndpoint } from '../lib/screenOverlayBridge';

interface ScreenOverlayTranslatorProps {
  enabled: boolean;
  autoSpeak: boolean;
  ttsPitch: number;
  ttsRate: number;
}

export default function ScreenOverlayTranslator({ enabled, autoSpeak, ttsPitch, ttsRate }: ScreenOverlayTranslatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [status, setStatus] = useState('جاهز. في Android: اضغط الفقاعة لسماع صوت التطبيق وترجمته.');
  const [isTranslating, setIsTranslating] = useState(false);
  const [position, setPosition] = useState(() => ({ x: 18, y: Math.max(120, window.innerHeight - 190) }));
  const dragRef = useRef<{ dragging: boolean; x: number; y: number }>({ dragging: false, x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) setIsOpen(false);
  }, [enabled]);

  if (!enabled) return null;

  const speakArabic = (text: string) => {
    if (!autoSpeak || !text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;
    window.speechSynthesis.speak(utterance);
  };

  const translateText = async (text: string) => {
    const clean = text.trim();
    if (!clean) {
      setStatus('انسخ نصاً أو اكتبه أولاً.');
      return;
    }

    setIsTranslating(true);
    setStatus('جاري الترجمة السريعة...');
    try {
      const response = await fetch(getDefaultTranslationEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean.slice(0, 1600), fast: true, provider: 'auto' }),
        signal: AbortSignal.timeout(9000)
      });
      if (!response.ok) throw new Error(`translate ${response.status}`);
      const data = await response.json();
      const arabic = data.arabic || data.translatedText || data.result?.arabic || 'تعذرت الترجمة.';
      setTranslatedText(arabic);
      setStatus('تمت الترجمة.');
      speakArabic(arabic);
    } catch (error) {
      console.warn('Screen overlay translation failed:', error);
      setStatus('تعذر الاتصال بمحرك الترجمة الآن.');
    } finally {
      setIsTranslating(false);
    }
  };

  const translateClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      await translateText(text);
    } catch (error) {
      console.warn('Clipboard read failed:', error);
      setStatus('المتصفح رفض قراءة الحافظة. الصق النص يدوياً.');
      setIsOpen(true);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    dragRef.current = { dragging: true, x: event.clientX - position.x, y: event.clientY - position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.dragging) return;
    setPosition({
      x: Math.min(Math.max(8, event.clientX - dragRef.current.x), window.innerWidth - 76),
      y: Math.min(Math.max(70, event.clientY - dragRef.current.y), window.innerHeight - 76)
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    dragRef.current.dragging = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="fixed z-[70]" dir="rtl" style={{ left: position.x, top: position.y }}>
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-[min(92vw,360px)] rounded-3xl border border-sky-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between bg-sky-600 text-white px-4 py-3">
            <div className="flex items-center gap-2 font-black text-sm">
              <Languages size={16} />
              مترجم الشاشة
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/15 rounded-lg" aria-label="إغلاق مترجم الشاشة">
              <X size={16} />
            </button>
          </div>
          <div className="p-3 space-y-3">
            <p className="text-[11px] text-stone-500 font-bold leading-relaxed">داخل المتصفح: انسخ النص ثم ترجم الحافظة. داخل Android الأصلي: الفقاعة تظهر فوق كل التطبيقات؛ ضغطة واحدة تسمع صوت الفيديو وتترجمه، وضغطة مطولة/مزدوجة تقرأ نص الشاشة.</p>
            <textarea
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="الصق النص هنا عند منع قراءة الحافظة..."
              className="w-full h-24 resize-none rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <div className="flex gap-2">
              <button type="button" onClick={translateClipboard} disabled={isTranslating} className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-60">
                {isTranslating ? <Loader2 size={14} className="animate-spin" /> : <Clipboard size={14} />}
                ترجمة الحافظة
              </button>
              <button type="button" onClick={() => translateText(inputText)} disabled={isTranslating || !inputText.trim()} className="px-3 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-black disabled:opacity-40">
                ترجم النص
              </button>
            </div>
            {translatedText && <div className="rounded-2xl bg-sky-50 border border-sky-100 p-3 text-sm font-black text-sky-900 leading-relaxed">{translatedText}</div>}
            <div className="text-[10px] text-stone-400 font-bold">{status}</div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        onDoubleClick={translateClipboard}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="h-14 w-14 rounded-2xl bg-sky-600 text-white shadow-2xl border border-white/30 flex items-center justify-center active:scale-95 touch-none"
        title="مترجم الشاشة: اضغط مرتين لترجمة الحافظة"
        aria-label="فتح مترجم الشاشة العائم"
      >
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white" />
        <Languages size={21} />
        <Move size={10} className="absolute bottom-1 left-1 opacity-70" />
      </button>
    </div>
  );
}
