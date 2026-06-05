import React, { useState, useEffect } from 'react';
import { UserProfile, SessionRecord } from '../types';
import { getUserProfile, updateUserLevel, getSessionRecords, updateUserProfile } from '../lib/firebaseService';
import { User, Flame, Award, BookOpen, Clock, LogIn, Save, Loader2, Calendar } from 'lucide-react';

interface ProfileViewProps {
  userId: string;
  userProfile: UserProfile | null;
  onProfileUpdate: () => void;
  savedWordsCount: number;
}

export default function ProfileView({ userId, userProfile, onProfileUpdate, savedWordsCount }: ProfileViewProps) {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(userProfile?.level || 'beginner');
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setLevel(userProfile.level);
    }
  }, [userProfile]);

  // Load user sessions logs
  useEffect(() => {
    async function loadSessions() {
      setLoadingSessions(true);
      try {
        const data = await getSessionRecords(userId);
        setSessions(data);
      } catch (err) {
        console.error("Error loading sessions: ", err);
      } finally {
        setLoadingSessions(false);
      }
    }
    loadSessions();
  }, [userId]);

  // Save changes to Firestore
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSaving(true);
    setSuccessMsg(null);
    try {
      await updateUserProfile(userId, displayName, level);
      setSuccessMsg('تم تحديث البيانات الشخصية والمستوى اللغوي بنجاح!');
      onProfileUpdate();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const calculateTotalMinutes = () => {
    const totalSec = sessions.reduce((acc, current) => acc + current.durationSeconds, 0);
    return Math.ceil(totalSec / 60);
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white rounded-3xl border border-stone-200 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900">الملف الشخصي والبيانات</h2>
          <p className="text-xs text-stone-500 font-medium">عدل بياناتك الشخصية، اختر مستوى الكلمات المناسب لك، وتابع إحصائيات تعلمك اليومية.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[#5a6a3b] font-bold text-xs bg-[#8a9a5b]/10 px-3 py-1.5 rounded-full">
          <Award size={14} />
          <span>المساعد التعليمي الشخصي</span>
        </div>
      </div>

      {/* Grid of details and statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Profile Edit Card */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-lg font-black text-stone-850 flex items-center gap-2">
            <User size={18} className="text-[#8a9a5b]" />
            <span>تعديل البيانات الأساسية</span>
          </h3>

          {successMsg && (
            <div className="p-3.5 bg-green-50 text-emerald-600 rounded-xl text-xs font-bold text-center border border-emerald-200">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">الاسم الكريم المستعار</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="مثال: أحمد علي"
                className="w-full pl-4 pr-4 py-3 bg-stone-55 border border-stone-205 rounded-xl text-stone-800 focus:outline-none focus:border-[#8a9a5b] text-sm text-right font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-2">البريد الإلكتروني المتصل</label>
              <input
                type="text"
                value={userProfile?.email || 'حساب تجريبي (ضيف محلي)'}
                disabled
                className="w-full pl-4 pr-4 py-3 bg-stone-55 border border-stone-200 rounded-xl text-stone-400 text-sm text-right cursor-not-allowed font-medium"
              />
            </div>

            {/* Level Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-2">مستواك الحالي في اللغة الإنكليزية</label>
              <div className="grid grid-cols-3 gap-3">
                {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      level === lvl
                        ? 'bg-[#f5f5f0] text-[#5a6a3b] border-[#8a9a5b] shadow-sm'
                        : 'bg-white hover:bg-stone-50 text-stone-605 border-stone-200'
                    }`}
                  >
                    <span className="text-sm font-bold">
                      {lvl === 'beginner' ? 'مبتدئ' : lvl === 'intermediate' ? 'متوسط' : 'متقدم'}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {lvl === 'beginner' ? 'كلمات مبسطة' : lvl === 'intermediate' ? 'تراكيب عامة' : 'مفردات متقدمة'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#8a9a5b] hover:bg-[#7a8a4b] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer pt-2"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>حفظ التغييرات</span>
            </button>
          </form>
        </div>

        {/* Live Performance & Achievements Card */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-black text-stone-850 flex items-center gap-2">
              <Award size={18} className="text-[#8a9a5b]" />
              <span>حصاد مهاراتك</span>
            </h3>

            {/* Metrics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-105">
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-orange-500 fill-orange-500" />
                  <span className="text-xs font-bold text-stone-700">سلسلة التعلم النشط</span>
                </div>
                <span className="text-lg font-black text-stone-900">{userProfile?.streak || 1} يوم متعاقب</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-105">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-500" />
                  <span className="text-xs font-bold text-stone-700">مجموع الكلمات المكتشفة</span>
                </div>
                <span className="text-lg font-black text-indigo-600">{savedWordsCount} كلمة</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-105">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-emerald-500" />
                  <span className="text-xs font-bold text-stone-700">وقت التدريب الإجمالي</span>
                </div>
                <span className="text-lg font-black text-emerald-600">{calculateTotalMinutes()} دقيقة</span>
              </div>
            </div>
          </div>

          {/* Level Progress Indicator */}
          <div className="bg-[#f5f5f0] p-4 rounded-2xl border border-stone-200/50 mt-4">
            <h4 className="text-xs font-black text-stone-800 mb-2">رتبتك التعليمية الحالية:</h4>
            <div className="flex justify-between text-[10px] text-stone-500 font-bold mb-1">
              <span>برونزي (مبتدئ)</span>
              <span>فضي</span>
              <span>ذهبي (خبير)</span>
            </div>
            <div className="w-full h-2 bg-stone-250 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#8a9a5b] transition-all duration-500"
                style={{
                  width: level === 'beginner' ? '33%' : level === 'intermediate' ? '66%' : '100%'
                }}
              />
            </div>
            <p className="text-[10px] text-stone-500 mt-2 font-medium">التقط كائنات جديدة يومياً لترتقي رتبتك وتزيد المهارات الخاصة بك!</p>
          </div>
        </div>
      </div>

      {/* Session logs list */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <h3 className="text-lg font-black text-stone-850 flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-[#8a9a5b]" />
          <span>سجل الجلسات التدريبية السابقة</span>
        </h3>

        {loadingSessions ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-[#8a9a5b]" size={24} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center p-8 text-xs text-stone-400 font-medium bg-stone-50 rounded-2xl border border-dashed">
            لا توجد جلسات تدريبية سابقة مسجلة. سيتم تسجيل الجلسات تلقائياً بمجرد الممارسة!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-bold pb-2">
                  <th className="py-2.5">تاريخ التدريب</th>
                  <th className="py-2.5">الكلمات المكتشفة في الكاميرا</th>
                  <th className="py-2.5">وقت الجلسة (ثانية)</th>
                  <th className="py-2.5">رموز تفوق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-stone-700">
                {sessions.map((sess) => (
                  <tr key={sess.id}>
                    <td className="py-3">{new Date(sess.date).toLocaleString('ar-EG')}</td>
                    <td className="py-3 text-indigo-600">{sess.identifiedWordsCount} كلمة</td>
                    <td className="py-3 text-stone-605">{sess.durationSeconds} ثانية</td>
                    <td className="py-3 text-amber-500">🏆 تفوق يومي</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
