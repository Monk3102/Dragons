import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  handleFirestoreError,
  OperationType,
} from './config';

export interface ConfrontationNoteItem {
  id: string;
  userId: string;
  dragonId: string;
  dragonName: string;
  text: string;
  status: 'Formidable' | 'Acknowledged' | 'Weakened' | 'Transmuted';
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessageItem {
  id: string;
  userId?: string;
  dragonId?: string;
  role: 'user' | 'model';
  content: string;
  modelUsed?: string;
  createdAt?: string;
}

const GUEST_NOTES_STORAGE_KEY = 'draco_animi_guest_notes';
const GUEST_CHATS_STORAGE_KEY = 'draco_animi_guest_chats';

export const DEFAULT_DEMO_NOTE: ConfrontationNoteItem = {
  id: 'demo-1',
  userId: 'guest',
  dragonId: 'dragon-inertia',
  dragonName: 'The Inertia Leviathan',
  text: 'Began with five minutes of raw outlining. The beast did not attack; it merely retreated three paces into the fog.',
  status: 'Acknowledged',
  createdAt: '2026-10-28T00:00:00.000Z',
};

export function useFirebaseData() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize from localStorage for guest mode continuity
  const [notes, setNotes] = useState<ConfrontationNoteItem[]>(() => {
    try {
      const stored = localStorage.getItem(GUEST_NOTES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [DEFAULT_DEMO_NOTE];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>(() => {
    try {
      const stored = localStorage.getItem(GUEST_CHATS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const isMigratingRef = useRef(false);

  // Auth state listener & resilient guest data migration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Save user profile to Firestore with exact matching user ID
        const userPath = `users/${currentUser.uid}`;
        try {
          await setDoc(
            doc(db, 'users', currentUser.uid),
            {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Lone Traveler',
              photoURL: currentUser.photoURL || '',
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, userPath);
        }

        // Resilient Guest Data Migration (without data loss on failure)
        if (!isMigratingRef.current) {
          isMigratingRef.current = true;

          // 1. Migrate guest notes
          try {
            const guestNotesRaw = localStorage.getItem(GUEST_NOTES_STORAGE_KEY);
            if (guestNotesRaw) {
              const pendingNotes: ConfrontationNoteItem[] = JSON.parse(guestNotesRaw);
              const remainingNotes: ConfrontationNoteItem[] = [];

              for (const gn of pendingNotes) {
                // Strictly skip the starter demo note
                const isDemo = gn.id === 'demo-1' || gn.text.trim() === DEFAULT_DEMO_NOTE.text.trim();
                if (isDemo) continue;

                // Collision-proof random UUID suffix
                const uniqueNoteId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                try {
                  await setDoc(doc(db, 'users', currentUser.uid, 'notes', uniqueNoteId), {
                    ...gn,
                    id: uniqueNoteId,
                    userId: currentUser.uid,
                    updatedAt: new Date().toISOString(),
                  });
                } catch (writeErr) {
                  console.error('Failed to migrate note:', gn.id, writeErr);
                  remainingNotes.push(gn);
                }
              }

              // Update storage with any remaining unmigrated notes to prevent silent loss
              if (remainingNotes.length > 0) {
                localStorage.setItem(GUEST_NOTES_STORAGE_KEY, JSON.stringify(remainingNotes));
              } else {
                localStorage.removeItem(GUEST_NOTES_STORAGE_KEY);
              }
            }
          } catch (e) {
            console.warn('Note migration encountered an issue:', e);
          }

          // 2. Migrate guest chat history
          try {
            const guestChatsRaw = localStorage.getItem(GUEST_CHATS_STORAGE_KEY);
            if (guestChatsRaw) {
              const pendingChats: ChatMessageItem[] = JSON.parse(guestChatsRaw);
              const remainingChats: ChatMessageItem[] = [];

              for (const gc of pendingChats) {
                // Skip interrupted error banners from migration
                if (gc.content.startsWith('[The transmission was interrupted:')) continue;

                const uniqueChatId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                try {
                  await setDoc(doc(db, 'users', currentUser.uid, 'chats', uniqueChatId), {
                    ...gc,
                    id: uniqueChatId,
                    userId: currentUser.uid,
                  });
                } catch (writeErr) {
                  console.error('Failed to migrate chat message:', gc.id, writeErr);
                  remainingChats.push(gc);
                }
              }

              if (remainingChats.length > 0) {
                localStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(remainingChats));
              } else {
                localStorage.removeItem(GUEST_CHATS_STORAGE_KEY);
              }
            }
          } catch (e) {
            console.warn('Chat migration encountered an issue:', e);
          }
        }
      } else {
        // When logged out, restore guest state from storage
        isMigratingRef.current = false;
        try {
          const storedNotes = localStorage.getItem(GUEST_NOTES_STORAGE_KEY);
          if (storedNotes) {
            setNotes(JSON.parse(storedNotes));
          } else {
            setNotes([DEFAULT_DEMO_NOTE]);
          }

          const storedChats = localStorage.getItem(GUEST_CHATS_STORAGE_KEY);
          if (storedChats) {
            setChatMessages(JSON.parse(storedChats));
          } else {
            setChatMessages([]);
          }
        } catch {
          setNotes([DEFAULT_DEMO_NOTE]);
          setChatMessages([]);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for Notes when authenticated
  useEffect(() => {
    if (!user) return;

    const notesPath = `users/${user.uid}/notes`;
    const notesRef = collection(db, 'users', user.uid, 'notes');

    const unsubscribe = onSnapshot(
      notesRef,
      (snapshot) => {
        const loaded: ConfrontationNoteItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            userId: data.userId || user.uid,
            dragonId: data.dragonId || 'dragon-inertia',
            dragonName: data.dragonName || 'Unknown Leviathan',
            text: data.text || '',
            status: data.status || 'Acknowledged',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
          });
        });
        // Sort newest first
        loaded.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setNotes(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, notesPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Real-time Firestore sync for Chat Messages when authenticated
  useEffect(() => {
    if (!user) return;

    const chatsPath = `users/${user.uid}/chats`;
    const chatsRef = collection(db, 'users', user.uid, 'chats');

    const unsubscribe = onSnapshot(
      chatsRef,
      (snapshot) => {
        const loaded: ChatMessageItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            userId: data.userId,
            dragonId: data.dragonId,
            role: data.role,
            content: data.content,
            modelUsed: data.modelUsed,
            createdAt: data.createdAt,
          });
        });
        // Sort chronologically
        loaded.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        setChatMessages(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, chatsPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Sign In with Google popup
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      console.error('Google Sign-In failed:', error);
      const rawMsg = error instanceof Error ? error.message : String(error);
      if (rawMsg.includes('token-service-api') || rawMsg.includes('securetoken.googleapis.com')) {
        setAuthError(
          'Google Cloud Secure Token Service API is initializing or disabled for project deductive-goal-fbcxw.'
        );
      } else if (!rawMsg.includes('popup-closed-by-user')) {
        setAuthError('Sign-in could not be completed. Operating in offline/guest mode.');
      }
    }
  }, []);

  // Sign Out
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign-Out failed:', error);
    }
  }, []);

  // Add Confrontation Note
  const addNote = useCallback(
    async (
      dragonId: string,
      dragonName: string,
      text: string,
      status: ConfrontationNoteItem['status'] = 'Acknowledged'
    ) => {
      const noteId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newNote: ConfrontationNoteItem = {
        id: noteId,
        userId: user ? user.uid : 'guest',
        dragonId,
        dragonName,
        text,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!user) {
        setNotes((prev) => {
          const updated = [newNote, ...prev];
          try {
            localStorage.setItem(GUEST_NOTES_STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
        return;
      }

      const notePath = `users/${user.uid}/notes/${noteId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'notes', noteId), newNote);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, notePath);
      }
    },
    [user]
  );

  // Delete Confrontation Note
  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!user) {
        setNotes((prev) => {
          const updated = prev.filter((n) => n.id !== noteId);
          try {
            localStorage.setItem(GUEST_NOTES_STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
        return;
      }
      const notePath = `users/${user.uid}/notes/${noteId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'notes', noteId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, notePath);
      }
    },
    [user]
  );

  // Save Chat Message to state & Firestore
  const saveChatMessage = useCallback(
    async (msg: { role: 'user' | 'model'; content: string; dragonId?: string; modelUsed?: string }) => {
      const msgId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newMsg: ChatMessageItem = {
        id: msgId,
        userId: user ? user.uid : 'guest',
        dragonId: msg.dragonId || '',
        role: msg.role,
        content: msg.content,
        modelUsed: msg.modelUsed || 'gemini-3.8-flash',
        createdAt: new Date().toISOString(),
      };

      if (!user) {
        setChatMessages((prev) => {
          const updated = [...prev, newMsg];
          try {
            localStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
        return;
      }

      const chatPath = `users/${user.uid}/chats/${msgId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'chats', msgId), newMsg);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, chatPath);
      }
    },
    [user]
  );

  // Genuinely Clear Chat History (Honest cloud deletion with fail safety)
  const clearChat = useCallback(async () => {
    if (user) {
      const chatsPath = `users/${user.uid}/chats`;
      try {
        const chatsRef = collection(db, 'users', user.uid, 'chats');
        const snap = await getDocs(chatsRef);
        const deleteOps = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
        await Promise.all(deleteOps);
        // Only clear local state after cloud operations complete successfully
        setChatMessages([]);
      } catch (error) {
        // Do not clear local state if cloud deletion fails, propagate error honestly
        handleFirestoreError(error, OperationType.DELETE, chatsPath);
      }
    } else {
      try {
        localStorage.removeItem(GUEST_CHATS_STORAGE_KEY);
        setChatMessages([]);
      } catch (e) {
        console.error('Failed to clear local guest chats:', e);
      }
    }
  }, [user]);

  return {
    user,
    authLoading,
    signInWithGoogle,
    signOut,
    notes,
    addNote,
    deleteNote,
    chatMessages,
    saveChatMessage,
    clearChat,
    authError,
    clearAuthError: () => setAuthError(null),
  };
}
