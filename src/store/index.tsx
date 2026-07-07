import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  UserSettings,
  ContactProfile,
  ChatMessage,
  ReplySuggestion,
} from '../types';
import * as storage from '../services/storage';

// ============================================================
// State
// ============================================================

interface AppState {
  userSettings: UserSettings | null;
  contacts: ContactProfile[];
  messages: Record<string, ChatMessage[]>;
  suggestions: ReplySuggestion[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AppState = {
  userSettings: null,
  contacts: [],
  messages: {},
  suggestions: [],
  isLoading: false,
  error: null,
};

// ============================================================
// Actions
// ============================================================

type Action =
  | { type: 'SET_USER_SETTINGS'; payload: UserSettings }
  | { type: 'SET_CONTACTS'; payload: ContactProfile[] }
  | { type: 'ADD_CONTACT'; payload: ContactProfile }
  | { type: 'UPDATE_CONTACT'; payload: ContactProfile }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'SET_MESSAGES'; payload: { contactId: string; messages: ChatMessage[] } }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { contactId: string; message: ChatMessage } }
  | { type: 'DELETE_MESSAGE'; payload: { contactId: string; messageId: string } }
  | { type: 'DELETE_MESSAGES'; payload: { contactId: string; messageIds: string[] } }
  | { type: 'SET_SUGGESTIONS'; payload: ReplySuggestion[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER_SETTINGS':
      return { ...state, userSettings: action.payload };
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload };
    case 'ADD_CONTACT':
      return { ...state, contacts: [...state.contacts, action.payload] };
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CONTACT':
      console.log('[reducer DELETE_CONTACT] id=', action.payload);
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.payload),
        messages: { ...state.messages, [action.payload]: [] },
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: { ...state.messages, [action.payload.contactId]: action.payload.messages },
      };
    case 'ADD_MESSAGE': {
      const existing = state.messages[action.payload.contactId] ?? [];
      return {
        ...state,
        messages: { ...state.messages, [action.payload.contactId]: [...existing, action.payload] },
      };
    }
    case 'UPDATE_MESSAGE': {
      const msgs = state.messages[action.payload.contactId] ?? [];
      return {
        ...state,
        messages: { ...state.messages, [action.payload.contactId]: msgs.map((m) =>
          m.id === action.payload.message.id ? action.payload.message : m
        ) },
      };
    }
    case 'DELETE_MESSAGE': {
      const msgs = state.messages[action.payload.contactId] ?? [];
      console.log('[reducer DELETE_MESSAGE] contactId=', action.payload.contactId, 'messageId=', action.payload.messageId, 'before=', msgs.length);
      const next = msgs.filter((m) => m.id !== action.payload.messageId);
      console.log('[reducer DELETE_MESSAGE] after=', next.length);
      return {
        ...state,
        messages: { ...state.messages, [action.payload.contactId]: next },
      };
    }
    case 'DELETE_MESSAGES': {
      const msgs = state.messages[action.payload.contactId] ?? [];
      const idSet = new Set(action.payload.messageIds);
      console.log('[reducer DELETE_MESSAGES] contactId=', action.payload.contactId, 'ids=', action.payload.messageIds.length, 'before=', msgs.length);
      const next = msgs.filter((m) => !(m.contactId === action.payload.contactId && idSet.has(m.id)));
      console.log('[reducer DELETE_MESSAGES] after=', next.length);
      return {
        ...state,
        messages: { ...state.messages, [action.payload.contactId]: next },
      };
    }
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  actions: AppActions;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppActions {
  loadAll: () => Promise<void>;
  saveUserSettings: (settings: UserSettings) => Promise<void>;
  addContact: (contact: ContactProfile) => Promise<void>;
  updateContact: (contact: ContactProfile) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  loadMessages: (contactId: string) => Promise<void>;
  addMessage: (msg: ChatMessage) => Promise<void>;
  updateMessage: (contactId: string, msg: ChatMessage) => Promise<void>;
  deleteMessage: (contactId: string, msgId: string) => Promise<void>;
  deleteMessages: (contactId: string, msgIds: string[]) => Promise<void>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions: AppActions = {
    loadAll: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const settings = await storage.getUserSettings();
        const contacts = await storage.getContacts();
        console.log('[store.loadAll] contacts=', contacts.length);
        if (settings) dispatch({ type: 'SET_USER_SETTINGS', payload: settings });
        dispatch({ type: 'SET_CONTACTS', payload: contacts });
      } catch (e: any) {
        dispatch({ type: 'SET_ERROR', payload: e.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    saveUserSettings: async (settings) => {
      await storage.saveUserSettings(settings);
      dispatch({ type: 'SET_USER_SETTINGS', payload: settings });
    },

    addContact: async (contact) => {
      await storage.addContact(contact);
      dispatch({ type: 'ADD_CONTACT', payload: contact });
    },

    updateContact: async (contact) => {
      await storage.updateContact(contact);
      dispatch({ type: 'UPDATE_CONTACT', payload: contact });
    },

    deleteContact: async (id) => {
      console.log('[store.deleteContact] START id=', id);
      await storage.deleteContact(id);
      dispatch({ type: 'DELETE_CONTACT', payload: id });
      // 立即从存储重载以验证
      const verifyContacts = await storage.getContacts();
      console.log('[store.deleteContact] 重读验证 contacts=', verifyContacts.length, '含该id=', verifyContacts.some(c => c.id === id));
    },

    loadMessages: async (contactId) => {
      const msgs = await storage.getMessages(contactId);
      console.log('[store.loadMessages] contactId=', contactId, 'msgs=', msgs.length);
      dispatch({ type: 'SET_MESSAGES', payload: { contactId, messages: msgs } });
    },

    addMessage: async (msg) => {
      await storage.addMessage(msg);
      dispatch({ type: 'ADD_MESSAGE', payload: msg });
    },

    updateMessage: async (contactId, msg) => {
      await storage.updateMessage(contactId, msg);
      dispatch({ type: 'UPDATE_MESSAGE', payload: { contactId, message: msg } });
    },

    deleteMessage: async (contactId, msgId) => {
      console.log('[store.deleteMessage] contactId=', contactId, 'msgId=', msgId);
      await storage.deleteMessage(contactId, msgId);
      dispatch({ type: 'DELETE_MESSAGE', payload: { contactId, messageId: msgId } });
    },

    deleteMessages: async (contactId, msgIds) => {
      console.log('[store.deleteMessages] contactId=', contactId, 'count=', msgIds.length);
      await storage.deleteMessages(contactId, msgIds);
      dispatch({ type: 'DELETE_MESSAGES', payload: { contactId, messageIds: msgIds } });
    },
  };

  useEffect(() => {
    actions.loadAll();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}