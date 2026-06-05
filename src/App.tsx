import { useState, useEffect, useRef } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getUserProfile, 
  createUserProfile, 
  updateStreakAndActivity, 
  getSavedWords, 
  logSessionRecord,
  testConnection
} from './lib/firebaseService';
import { UserProfile, SavedWord, AppSettings } from './types';

// Components
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import CameraView from './components/CameraView';
import VocabularyView from './components/VocabularyView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import SpeechTranslatorView from './components/SpeechTranslatorView';
import AICopilot from './components/AICopilot';
import EveningQuiz from './components/EveningQuiz';

import { Sparkles, Loader2, Award, Flame, Menu, Moon, ArrowLeft } from 'lucide-react';

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('camera');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isEveningQuizOpen, setIsEveningQuizOpen] = useState<boolean>(false);
  
  // Audio Speech Configurations
  const [settings, setSettings] = useState<AppSettings>({
    ttsVoice: 'en-US',
    ttsPitch: 1.0,
    ttsRate: 0.9,
    autoSpeak: true,
    trackingWaitTime: 1200
  });

  // Saved words list
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [sessionCount, setSessionCount] = useState<number>(0);
  
  // Session logs timer
  const sessionStartRef = useRef<number>(Date.now());

  // PWA deferred installation prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  // 1. Authenticated User Listeners
  useEffect(() => {
    testConnection(); // Verify connection on state boot
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        await refreshProfile(currentUser.uid);
      } else {
        setUserId(null);
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch or update details helper
  const refreshProfile = async (uid: string) => {
    try {
      let profile = await getUserProfile(uid);
      if (!profile) {
        profile = await createUserProfile(uid, auth.currentUser?.email || null, auth.currentUser?.displayName || '');
      } else {
        // Increment streak once a day when opening
        await updateStreakAndActivity(uid);
        // fetch refreshed profile
        profile = await getUserProfile(uid);
      }
      setUserProfile(profile);

      // Load saved words list for caching metrics
      const fetchedWords = await getSavedWords(uid);
      setSavedWords(fetchedWords);
    } catch (err) {
      console.error("Error refreshing profile: ", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync up word counters when words are saved/deleted
  const handleWordAction = async () => {
    if (!userId) return;
    const fetchedWords = await getSavedWords(userId);
    setSavedWords(fetchedWords);
    setSessionCount(prev => prev + 1);
  };

  // 3. User Session Logs Tracking
  useEffect(() => {
    sessionStartRef.current = Date.now();

    // Log the current session metrics on tab switches or component unmounts
    return () => {
      if (userId && sessionCount > 0) {
        const durationSec = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        if (durationSec > 5) {
          logSessionRecord(userId, sessionCount, durationSec).catch(err => 
            console.error("Log session record failed on clean up: ", err)
          );
        }
      }
    };
  }, [activeTab, userId, sessionCount]);

  // Handle manual logout
  const handleLogout = async () => {
    // If we have items in active session, store them before user leaves
    if (userId && sessionCount > 0) {
      const durationSec = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      if (durationSec > 5) {
        try {
          await logSessionRecord(userId, sessionCount, durationSec);
        } catch (err) {
          console.error(err);
        }
      }
    }

    try {
      await signOut(auth);
      setUserId(null);
      setUserProfile(null);
      setSessionCount(0);
      setActiveTab('camera');
    } catch (err) {
      console.error(err);
      // Fallback local auth logout
      setUserId(null);
      setUserProfile(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#f5f5f0] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#8a9a5b] mb-4" size={48} />
        <h2 className="text-stone-800 font-extrabold text-lg select-none">جاري تهيئة تطبيق LingoLens...</h2>
        <p className="text-stone-400 text-xs mt-1">الرجاء الانتظار ثوانٍ معدودة</p>
      </div>
    );
  }

  // If user is not authenticated, show premium Arabic AuthScreen!
  if (!userId) {
    return <AuthScreen onAuthSuccess={async (uid) => {
      setLoading(true);
      setUserId(uid);
      await refreshProfile(uid);
    }} />;
  }

  return (
    <div className="flex flex-col md:flex-row-reverse w-full h-screen bg-[#f5f5f0] text-stone-800 font-sans overflow-hidden">
      
      {/* Mobile Sticky Glass Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 select-none">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-stone-600 hover:bg-stone-100 hover:text-[#8a9a5b] active:scale-90 active:ring-4 active:ring-[#8a9a5b]/30 active:bg-[#8a9a5b]/10 active:text-[#8a9a5b] rounded-xl transition-all duration-200 cursor-pointer"
          id="mobile_menu_trigger"
          title="فتح القائمة"
          aria-label="فتح قائمة التنقل الجانبية"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#8a9a5b] rounded-lg flex items-center justify-center text-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <span className="text-base font-black text-[#5a6a3b] tracking-tight">LingoLens</span>
        </div>

        <div>
          {userProfile && userProfile.streak > 0 ? (
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/50 text-amber-600 font-bold text-xs" title="أيام التوالي">
              <Flame size={13} className="fill-amber-500 text-amber-500" />
              <span>{userProfile.streak}د</span>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-xs text-stone-500 shadow-sm border border-stone-200">
              {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </header>

      {/* Sidebar (Right-Hand Side for Authentic RTL Arabic Context) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userProfile={userProfile}
        onLogout={handleLogout} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstall={handleInstallPWA}
        onOpenEveningQuiz={() => setIsEveningQuizOpen(true)}
      />

      {/* Main Content Workspace Layout-Left */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto" dir="rtl">
        
        {/* Animated Applet tab routes routing */}
        {activeTab === 'camera' && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <header className="flex justify-between items-center mb-4 md:mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                  <span>الاستكشاف الذكي والتعلم</span>
                  <Sparkles size={20} className="text-amber-500 fill-amber-500 animate-pulse" />
                </h2>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">ثبّت نظرك على الكائنات لمدة ثوانٍ معدودة ليقوم المعلم بترجمتها ونطقها لك بالإنكليزية!</p>
              </div>
            </header>

            {/* Dynamic Evening Quiz Prompt Invitation Card */}
            <div className="mb-5 bg-[#1b2513] border border-[#8a9a5b]/40 rounded-3xl p-5 text-stone-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden select-none">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#8a9a5b]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3.5 z-10">
                <div className="w-12 h-12 bg-[#8a9a5b]/20 border border-[#8a9a5b]/30 rounded-2xl flex items-center justify-center text-amber-300 shrink-0">
                  <Moon className="w-6 h-6 animate-pulse" />
                </div>
                <div className="text-right">
                  <h4 className="font-black text-xs md:text-sm text-white flex items-center gap-1.5 leading-tight">
                    <span>مساعد التثبيت والترسيخ المسائي 🌙</span>
                    <span className="text-[9px] font-black bg-[#8a9a5b] text-white px-2 py-0.5 rounded-full uppercase scale-90">متاح الآن</span>
                  </h4>
                  <p className="text-[10px] md:text-xs text-stone-400 font-semibold mt-1">
                    حوّل جميع الكائنات والأوبجكتس التي تصفحتها اليوم بالنظارة الذكية إلى كويز سريع وممتع لضمان ثباتها بذهنك!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEveningQuizOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-l from-[#8a9a5b] to-[#a3b17c] hover:from-[#7b8b4c] hover:to-[#93a16d] text-white font-black text-xs rounded-xl transition-all shadow-md shrink-0 active:scale-95 cursor-pointer z-10 flex items-center gap-1.5"
              >
                <span>ابدأ كويز المساء</span>
                <ArrowLeft size={12} className="stroke-[2.5]" />
              </button>
            </div>

            <div className="flex-1">
              <CameraView 
                userId={userId}
                onWordIdentified={handleWordAction}
                ttsVoice={settings.ttsVoice}
                ttsPitch={settings.ttsPitch}
                ttsRate={settings.ttsRate}
                autoSpeak={settings.autoSpeak}
              />
            </div>
          </div>
        )}

        {activeTab === 'speech' && userId && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <header className="flex justify-between items-center mb-4 md:mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                  <span>المترجم ومُعلّم الحوار الصوتي</span>
                  <Sparkles size={20} className="text-[#8a9a5b] fill-[#8a9a5b] animate-pulse" />
                </h2>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">اسمع الذي أمامك، أو تدرَّب على الصياغة الصوتية الطبيعية مع المعلم اللغوي والتحليل الفوري بالذكاء الاصطناعي!</p>
              </div>
            </header>

            <SpeechTranslatorView 
              userId={userId}
              onWordIdentified={handleWordAction}
              ttsVoice={settings.ttsVoice}
              ttsPitch={settings.ttsPitch}
              ttsRate={settings.ttsRate}
              autoSpeak={settings.autoSpeak}
            />
          </div>
        )}

        {activeTab === 'vocabulary' && (
          <VocabularyView 
            userId={userId} 
            ttsVoice={settings.ttsVoice}
            ttsPitch={settings.ttsPitch}
            ttsRate={settings.ttsRate}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView 
            userId={userId} 
            userProfile={userProfile} 
            onProfileUpdate={async () => {
              if (userId) await refreshProfile(userId);
            }} 
            savedWordsCount={savedWords.length}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView 
            settings={settings} 
            onSettingsChange={setSettings} 
          />
        )}

      </main>

      {/* Persistent Bilingual Conversational AI Tutor & Language Co-Pilot */}
      <AICopilot 
        userProfile={userProfile} 
        ttsVoice={settings.ttsVoice} 
        ttsPitch={settings.ttsPitch} 
        ttsRate={settings.ttsRate} 
      />

      {/* Evening memory anchor reinforcement quiz modal */}
      <EveningQuiz 
        savedWords={savedWords}
        isOpen={isEveningQuizOpen}
        onClose={() => setIsEveningQuizOpen(false)}
        ttsVoice={settings.ttsVoice}
        ttsPitch={settings.ttsPitch}
        ttsRate={settings.ttsRate}
      />
    </div>
  );
}
