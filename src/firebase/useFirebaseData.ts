import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
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

export function useFirebaseData() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [notes, setNotes] = useState<ConfrontationNoteItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Save user profile to Firestore
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
      } else {
        // Fallback demo note if not signed in
        setNotes([
          {
            id: 'demo-1',
            userId: 'guest',
            dragonId: 'dragon-inertia',
            dragonName: 'The Inertia Leviathan',
            text: 'Began with five minutes of raw outlining. The beast did not attack; it merely retreated three paces into the fog.',
            status: 'Acknowledged',
            createdAt: 'First Encounter',
          },
        ]);
        setChatMessages([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to User Notes when authenticated
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
        setNotes(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, notesPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Listen to User Chat messages when authenticated
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
        if (loaded.length > 0) {
          setChatMessages(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, chatsPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Sign In with Google popup
  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-In failed:', error);
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
      const noteId = `note-${Date.now()}`;
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
        setNotes((prev) => [newNote, ...prev]);
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
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
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
      const msgId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newMsg: ChatMessageItem = {
        id: msgId,
        userId: user ? user.uid : 'guest',
        dragonId: msg.dragonId || '',
        role: msg.role,
        content: msg.content,
        modelUsed: msg.modelUsed || 'gemini-3.8-flash',
        createdAt: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, newMsg]);

      if (user) {
        const chatPath = `users/${user.uid}/chats/${msgId}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'chats', msgId), newMsg);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, chatPath);
        }
      }
    },
    [user]
  );

  // Clear Chat history
  const clearChat = useCallback(async () => {
    setChatMessages([]);
  }, []);

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
  };
}
