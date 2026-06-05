import { UserProfile } from '../types';
import { Camera, BookOpen, User, Settings, LogOut, Flame, X, Mic, DownloadCloud, Moon, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstall: () => void;
  onOpenEveningQuiz: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  userProfile, 
  onLogout, 
  isOpen, 
  onClose,
  deferredPrompt,
  onInstall,
  onOpenEveningQuiz
}: SidebarProps) {
  const getLevelLabel = (level?: string) => {
    switch (level) {
      case 'beginner': return 'مستوى مبتدئ';
      case 'intermediate': return 'مستوى متوسط';
      case 'advanced': return 'مستوى متقدم';
      default: return 'مستوى مبتدئ';
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Dark helper backdrop when sidebar is open on mobile */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-45 md:hidden transition-opacity duration-300"
        />
      )}

      <aside 
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-stone-200 flex flex-col shadow-2xl md:shadow-none select-none transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`} 
        dir="rtl"
      >
        {/* App Logo */}
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-3 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8a9a5b] rounded-xl flex items-center justify-center text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#5a6a3b]">LingoLens</h1>
                <p className="text-[10px] text-stone-400 font-semibold tracking-wider -mt-1 uppercase">مساعد الكاميرا الذكي</p>
              </div>
            </div>

            {/* Close sidebar button on mobile view */}
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-xl transition-all md:hidden cursor-pointer"
              title="إغلاق القائمة"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="space-y-2">
            <button
              onClick={() => handleTabClick('camera')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-[#f5f5f0] text-[#5a6a3b]'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-850'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${activeTab === 'camera' ? 'bg-[#8a9a5b] scale-100' : 'bg-transparent scale-0'}`}></span>
              <Camera size={20} className={activeTab === 'camera' ? 'text-[#8a9a5b]' : 'text-stone-400'} />
              <span>الاستكشاف المباشر</span>
            </button>

            <button
              onClick={() => handleTabClick('speech')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all cursor-pointer ${
                activeTab === 'speech'
                  ? 'bg-[#f5f5f0] text-[#5a6a3b]'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-850'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${activeTab === 'speech' ? 'bg-[#8a9a5b] scale-100' : 'bg-transparent scale-0'}`}></span>
              <Mic size={20} className={activeTab === 'speech' ? 'text-[#8a9a5b]' : 'text-stone-400'} />
              <span>المترجم ومُعلّم الحوار</span>
            </button>

            <button
              onClick={() => handleTabClick('vocabulary')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all cursor-pointer ${
                activeTab === 'vocabulary'
                  ? 'bg-[#f5f5f0] text-[#5a6a3b]'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-850'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${activeTab === 'vocabulary' ? 'bg-[#8a9a5b] scale-100' : 'bg-transparent scale-0'}`}></span>
              <BookOpen size={20} className={activeTab === 'vocabulary' ? 'text-[#8a9a5b]' : 'text-stone-400'} />
              <span>قاموسي الشخصي</span>
            </button>

            <button
              onClick={() => handleTabClick('profile')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#f5f5f0] text-[#5a6a3b]'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-850'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${activeTab === 'profile' ? 'bg-[#8a9a5b] scale-100' : 'bg-transparent scale-0'}`}></span>
              <User size={20} className={activeTab === 'profile' ? 'text-[#8a9a5b]' : 'text-stone-400'} />
              <span>البيانات الشخصية</span>
            </button>

            <button
              onClick={() => handleTabClick('settings')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#f5f5f0] text-[#5a6a3b]'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-850'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full transition-all ${activeTab === 'settings' ? 'bg-[#8a9a5b] scale-100' : 'bg-transparent scale-0'}`}></span>
              <Settings size={20} className={activeTab === 'settings' ? 'text-[#8a9a5b]' : 'text-stone-400'} />
              <span>الإعدادات والمساعد</span>
            </button>
          </nav>

          {/* Evening Quiz Celestial Trigger */}
          <div className="mt-6 pt-5 border-t border-stone-150">
            <button
              onClick={() => {
                onOpenEveningQuiz();
                onClose();
              }}
              className="w-full p-4 bg-gradient-to-br from-[#1b2513] to-[#0d120a] hover:from-[#25321b] hover:to-[#12190f] border border-[#8a9a5b]/45 rounded-2xl text-stone-100 flex flex-col gap-2.5 items-start justify-between shadow-md group transition-all duration-300 relative overflow-hidden select-none cursor-pointer active:scale-[0.98]"
              id="sidebar_evening_quiz_trigger"
              title="تحدي الذاكرة المسائي الذكي"
            >
              {/* Glowing light effect */}
              <div className="absolute -top-3 -left-3 w-14 h-14 bg-[#8a9a5b]/20 rounded-full blur-xl group-hover:bg-[#8a9a5b]/30 transition-all" />
              
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#8a9a5b]/20 border border-[#8a9a5b]/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-200">
                    <Moon size={16} className="fill-amber-400/20" />
                  </div>
                  <span className="text-xs font-black tracking-tight text-white">كويز المساء لترسيخ الذاكرة</span>
                </div>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </div>
              
              <p className="text-[10px] text-stone-400 font-semibold leading-relaxed text-right">
                هل ذاكرتك مستعدة لمكتشفات اليوم؟ اختبر معلوماتك سريعاً لينام ذهنك راضياً ومثبِّتاً للتعلم! 🌙
              </p>
            </button>
          </div>
        </div>

        {/* Bottom User Area */}
        <div className="mt-auto p-6 border-t border-stone-100 flex flex-col gap-4">
          {userProfile && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8a9a5b] to-[#c2b48c] border-2 border-white shadow-md flex items-center justify-center text-white text-lg font-extrabold font-serif">
                {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-stone-800 text-sm truncate">{userProfile.displayName || 'زائر كريم'}</span>
                <div className="flex items-center gap-1.5 text-xs text-stone-400 font-medium">
                  <span>{getLevelLabel(userProfile.level)}</span>
                  {userProfile.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold bg-amber-50 px-1 rounded-md">
                      <Flame size={12} className="fill-amber-500" />
                      <span>{userProfile.streak}د</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PWA Install Button and Info */}
          {deferredPrompt && (
            <button
              onClick={() => {
                onInstall();
                onClose();
              }}
              className="w-full h-11 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-l from-[#8a9a5b] to-[#a3b17c] hover:from-[#7b8b4c] hover:to-[#93a16d] text-white rounded-xl text-xs font-black transition-all duration-200 cursor-pointer shadow-sm border border-[#8a9a5b]/10 active:scale-95"
              id="pwa_install_btn"
              title="تثبيت التطبيق على جهازك كـ PWA مستقل"
            >
              <DownloadCloud size={14} className="stroke-[2.5] animate-bounce" />
              <span>تثبيت نظارة LinguaCam 📱</span>
            </button>
          )}

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-bold text-stone-500 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>تسجيل خروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
