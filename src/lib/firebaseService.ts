import { db, auth } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { UserProfile, SavedWord, SessionRecord, ConversationMessage } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
}

const isSandbox = (uid: string) => !uid || uid === 'sandbox_guest_user' || uid.startsWith('sandbox_');

// Local storage fallback helper methods to guarantee seamless trial sandbox execution
function getLocalProfile(uid: string): UserProfile | null {
  const pStr = localStorage.getItem(`lingolens_p_${uid}`);
  return pStr ? JSON.parse(pStr) : null;
}

function saveLocalProfile(uid: string, profile: UserProfile) {
  localStorage.setItem(`lingolens_p_${uid}`, JSON.stringify(profile));
}

function getLocalWords(uid: string): SavedWord[] {
  const wStr = localStorage.getItem(`lingolens_w_${uid}`);
  return wStr ? JSON.parse(wStr) : [];
}

function saveLocalWords(uid: string, words: SavedWord[]) {
  localStorage.setItem(`lingolens_w_${uid}`, JSON.stringify(words));
}

function getLocalSessions(uid: string): SessionRecord[] {
  const sStr = localStorage.getItem(`lingolens_s_${uid}`);
  return sStr ? JSON.parse(sStr) : [];
}

function saveLocalSessions(uid: string, sessions: SessionRecord[]) {
  localStorage.setItem(`lingolens_s_${uid}`, JSON.stringify(sessions));
}

function getLocalConversations(uid: string): ConversationMessage[] {
  const cStr = localStorage.getItem(`lingolens_c_${uid}`);
  return cStr ? JSON.parse(cStr) : [];
}

function saveLocalConversations(uid: string, conversations: ConversationMessage[]) {
  localStorage.setItem(`lingolens_c_${uid}`, JSON.stringify(conversations));
}

// Test Connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// User Profile CRUD operations
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (isSandbox(userId)) {
    return getLocalProfile(userId);
  }
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const profile = docSnap.data() as UserProfile;
      // sync to local just in case
      saveLocalProfile(userId, profile);
      return profile;
    }
    return getLocalProfile(userId);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return getLocalProfile(userId);
  }
}

export async function createUserProfile(userId: string, email: string | null, displayName: string): Promise<UserProfile> {
  const path = `users/${userId}`;
  const nowStr = new Date().toISOString();
  const profile: UserProfile = {
    id: userId,
    email: email,
    displayName: displayName || (email ? email.split('@')[0] : 'زارع المهارات (ضيف)'),
    level: 'beginner',
    createdAt: nowStr,
    streak: 1,
    lastActiveDate: nowStr
  };

  saveLocalProfile(userId, profile);

  if (isSandbox(userId)) {
    return profile;
  }

  try {
    await setDoc(doc(db, 'users', userId), profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return profile; // Keep local profile so user is never blocked
  }
}

export async function updateUserProfile(userId: string, displayName: string, level: 'beginner' | 'intermediate' | 'advanced'): Promise<void> {
  const path = `users/${userId}`;
  
  // Always update local cache first
  const localProfile = getLocalProfile(userId) || {
    id: userId,
    email: null,
    displayName,
    level,
    createdAt: new Date().toISOString(),
    streak: 1,
    lastActiveDate: new Date().toISOString()
  };
  localProfile.displayName = displayName;
  localProfile.level = level;
  saveLocalProfile(userId, localProfile);

  if (isSandbox(userId)) {
    return;
  }

  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { displayName, level });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserLevel(userId: string, level: 'beginner' | 'intermediate' | 'advanced'): Promise<void> {
  const path = `users/${userId}`;
  
  // Update local cache
  const localProfile = getLocalProfile(userId);
  if (localProfile) {
    localProfile.level = level;
    saveLocalProfile(userId, localProfile);
  }

  if (isSandbox(userId)) {
    return;
  }

  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { level });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateStreakAndActivity(userId: string): Promise<void> {
  const path = `users/${userId}`;
  
  // Local logic first
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const profile = getLocalProfile(userId);
  
  if (profile) {
    const prevStr = profile.lastActiveDate ? profile.lastActiveDate.split('T')[0] : null;
    if (todayStr !== prevStr) {
      let newStreak = profile.streak || 0;
      if (prevStr) {
        const prevDate = new Date(prevStr);
        const diffTime = Math.abs(now.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1.5) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      profile.streak = newStreak;
    }
    profile.lastActiveDate = now.toISOString();
    saveLocalProfile(userId, profile);
  }

  if (isSandbox(userId)) {
    return;
  }

  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const dbProfile = snap.data() as UserProfile;
    const dbPrevStr = dbProfile.lastActiveDate ? dbProfile.lastActiveDate.split('T')[0] : null;

    if (todayStr === dbPrevStr) {
      await updateDoc(docRef, { lastActiveDate: now.toISOString() });
      return;
    }

    let nextStreak = dbProfile.streak || 0;
    if (dbPrevStr) {
      const prevDate = new Date(dbPrevStr);
      const diffTime = Math.abs(now.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1.5) {
        nextStreak += 1;
      } else {
        nextStreak = 1;
      }
    } else {
      nextStreak = 1;
    }

    await updateDoc(docRef, {
      streak: nextStreak,
      lastActiveDate: now.toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Saved Words (Vocabulary collection in subcollection)
export async function saveWord(userId: string, word: Omit<SavedWord, 'savedAt' | 'learnedCount'>): Promise<void> {
  const path = `users/${userId}/saved_words/${word.id}`;
  const savedData: SavedWord = {
    ...word,
    savedAt: new Date().toISOString(),
    learnedCount: 1
  };

  // Local storage save cache
  const localWords = getLocalWords(userId);
  const existingIndex = localWords.findIndex(w => w.id === word.id);
  if (existingIndex !== -1) {
    localWords[existingIndex] = savedData;
  } else {
    localWords.unshift(savedData);
  }
  saveLocalWords(userId, localWords);

  if (isSandbox(userId)) {
    return;
  }

  try {
    await setDoc(doc(db, 'users', userId, 'saved_words', word.id), savedData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSavedWord(userId: string, wordId: string): Promise<void> {
  const path = `users/${userId}/saved_words/${wordId}`;
  
  // Local storage delete cache
  const localWords = getLocalWords(userId);
  const updatedWords = localWords.filter(w => w.id !== wordId);
  saveLocalWords(userId, updatedWords);

  if (isSandbox(userId)) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'users', userId, 'saved_words', wordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getSavedWords(userId: string): Promise<SavedWord[]> {
  const path = `users/${userId}/saved_words`;
  
  if (isSandbox(userId)) {
    return getLocalWords(userId);
  }

  try {
    const colRef = collection(db, 'users', userId, 'saved_words');
    const q = query(colRef, orderBy('savedAt', 'desc'));
    const snap = await getDocs(q);
    const words: SavedWord[] = [];
    snap.forEach(docSnap => {
      words.push(docSnap.data() as SavedWord);
    });
    // Sync to cache
    saveLocalWords(userId, words);
    return words;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return getLocalWords(userId);
  }
}

// Session Log tracking
export async function logSessionRecord(userId: string, count: number, durationSec: number): Promise<void> {
  const sessId = `session_${Date.now()}`;
  const path = `users/${userId}/sessions/${sessId}`;
  const record: SessionRecord = {
    id: sessId,
    userId,
    date: new Date().toISOString(),
    identifiedWordsCount: count,
    durationSeconds: durationSec
  };

  // Local storage save
  const localSessions = getLocalSessions(userId);
  localSessions.unshift(record);
  saveLocalSessions(userId, localSessions);

  if (isSandbox(userId)) {
    return;
  }

  try {
    await setDoc(doc(db, 'users', userId, 'sessions', sessId), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getSessionRecords(userId: string): Promise<SessionRecord[]> {
  const path = `users/${userId}/sessions`;
  
  if (isSandbox(userId)) {
    return getLocalSessions(userId);
  }

  try {
    const colRef = collection(db, 'users', userId, 'sessions');
    const q = query(colRef, orderBy('date', 'desc'));
    const snap = await getDocs(q);
    const records: SessionRecord[] = [];
    snap.forEach(docSnap => {
      records.push(docSnap.data() as SessionRecord);
    });
    // Sync to cache
    saveLocalSessions(userId, records);
    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return getLocalSessions(userId);
  }
}

// Conversation History Auto-Save operations
export async function saveConversationHistoryMessage(userId: string, msg: Omit<ConversationMessage, 'savedAt'>): Promise<void> {
  const path = `users/${userId}/conversation_history/${msg.id}`;
  const savedData: ConversationMessage = {
    ...msg,
    savedAt: new Date().toISOString()
  };

  const localConvs = getLocalConversations(userId);
  const existingIndex = localConvs.findIndex(c => c.id === msg.id);
  if (existingIndex !== -1) {
    localConvs[existingIndex] = savedData;
  } else {
    localConvs.push(savedData);
  }
  saveLocalConversations(userId, localConvs);

  if (isSandbox(userId)) {
    return;
  }

  try {
    await setDoc(doc(db, 'users', userId, 'conversation_history', msg.id), savedData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getConversationHistoryMessages(userId: string): Promise<ConversationMessage[]> {
  const path = `users/${userId}/conversation_history`;

  if (isSandbox(userId)) {
    return getLocalConversations(userId);
  }

  try {
    const colRef = collection(db, 'users', userId, 'conversation_history');
    const q = query(colRef, orderBy('savedAt', 'asc'));
    const snap = await getDocs(q);
    const msgs: ConversationMessage[] = [];
    snap.forEach(docSnap => {
      msgs.push(docSnap.data() as ConversationMessage);
    });
    saveLocalConversations(userId, msgs);
    return msgs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return getLocalConversations(userId);
  }
}

export async function clearConversationHistory(userId: string): Promise<void> {
  const path = `users/${userId}/conversation_history`;
  
  saveLocalConversations(userId, []);

  if (isSandbox(userId)) {
    return;
  }

  try {
    const colRef = collection(db, 'users', userId, 'conversation_history');
    const snap = await getDocs(colRef);
    const deletions = snap.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(deletions);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

