# المعلم الصوتي - LingoLens AI

**تطبيق نظارات الترجمة الذكية (Smart Translation Glasses)**  
مدعوم بالذكاء الاصطناعي Gemini AI + Firebase + Vite

## المميزات

- 🎯 **الاستكشاف الذكي والتعلم** - وجه الكاميرا لأي شيء لتتعلم ترجمته
- 🗣️ **المترجم الصوتي** - ترجمة فورية ذكية مع مدرب نطق
- 📚 **القاموس الذكي** - احفظ الكلمات وراجعها لاحقاً
- 🤖 **المعلم الذكي (AI Copilot)** - محادثة مع معلم لغوي افتراضي
- 🎭 **سيناريوهات المحادثة** - تدرب على مواقف حقيقية (مطار، مطعم، فندق، مقابلة عمل)
- 🎯 **مدرب النطق** - تصحيح مخارج الحروف بالذكاء الاصطناعي
- 🌙 **كويز المساء** - تثبيت المعلومات في الذاكرة
- 🔥 **نظام التعاقب (Streak)** - حافظ على استمرارية التعلم

## التشغيل محلياً

```bash
# 1. تثبيت الاعتماديات
npm install

# 2. إنشاء ملف .env وإضافة مفتاح Gemini API
# انسخ .env.example إلى .env
# وضف مفتاح API الخاص بك من Google AI Studio

# 3. تشغيل التطبيق
npm run dev
```

## النشر على Vercel

```bash
npm run build
# ارفع المجلد dist/ كموقع static على Vercel
```

## التقنيات المستخدمة

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express.js + TypeScript
- **AI:** Google Gemini AI (`gemini-3.1-flash-lite` افتراضياً للترجمة السريعة)
- **Database:** Firebase (Auth + Firestore)
- **Animations:** Motion + Lucide Icons

## متطلبات التشغيل

- Node.js 18+
- مفتاح Gemini API (مجاني من Google AI Studio)
- يمكن تغيير نموذج السرعة من `.env` عبر `GEMINI_MODEL` أو `GEMINI_AUDIO_MODEL`
- Firebase project (اختياري للتخزين السحابي)