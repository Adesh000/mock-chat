import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import MockSocket from '../../MockSocket';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  groupId: string;
  text: string;
  status: 'sent' | 'received' | 'read';
  timestamp: string;
  sender: 'me' | 'other';
}

export interface Group {
  id: string;
  name: string;
  avatar: string; // emoji or url
  lastMessage?: Message;
  unreadCount: number;
}

interface TypingState {
  [groupId: string]: boolean;
}

interface ChatState {
  groups: Group[];
  messages: { [groupId: string]: Message[] };
  typing: TypingState;
  connected: boolean;
  activeGroupId: string | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type ChatAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'MARK_READ'; payload: { messageId: string } }
  | { type: 'SET_TYPING'; payload: { groupId: string; isTyping: boolean } }
  | { type: 'SET_ACTIVE_GROUP'; payload: string | null }
  | { type: 'CLEAR_UNREAD'; payload: string };

// ─── Initial Data ────────────────────────────────────────────────────────────

const INITIAL_GROUPS: Group[] = [
  { id: 'g1', name: 'Design Team', avatar: '🎨', unreadCount: 0 },
  { id: 'g2', name: 'Backend Devs', avatar: '⚙️', unreadCount: 0 },
  { id: 'g3', name: 'Product Crew', avatar: '🚀', unreadCount: 0 },
  { id: 'g4', name: 'Random Fun', avatar: '🎲', unreadCount: 0 },
];

const initialState: ChatState = {
  groups: INITIAL_GROUPS,
  messages: {
    g1: [],
    g2: [],
    g3: [],
    g4: [],
  },
  typing: {},
  connected: false,
  activeGroupId: null,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };

    case 'ADD_MESSAGE': {
      const msg = action.payload;
      const groupId = msg.groupId;
      const existingMessages = state.messages[groupId] || [];
      const updatedMessages = [...existingMessages, msg];

      // Update last message and unread count on the group
      const updatedGroups = state.groups.map(g => {
        if (g.id !== groupId) {return g;}
        const isActiveGroup = state.activeGroupId === groupId;
        return {
          ...g,
          lastMessage: msg,
          unreadCount:
            msg.sender === 'other' && !isActiveGroup
              ? g.unreadCount + 1
              : g.unreadCount,
        };
      });

      return {
        ...state,
        messages: { ...state.messages, [groupId]: updatedMessages },
        groups: updatedGroups,
      };
    }

    case 'MARK_READ': {
      const { messageId } = action.payload;
      const newMessages = { ...state.messages };
      for (const gId of Object.keys(newMessages)) {
        newMessages[gId] = newMessages[gId].map(m =>
          m.id === messageId ? { ...m, status: 'read' } : m,
        );
      }
      return { ...state, messages: newMessages };
    }

    case 'SET_TYPING':
      return {
        ...state,
        typing: {
          ...state.typing,
          [action.payload.groupId]: action.payload.isTyping,
        },
      };

    case 'SET_ACTIVE_GROUP':
      return { ...state, activeGroupId: action.payload };

    case 'CLEAR_UNREAD':
      return {
        ...state,
        groups: state.groups.map(g =>
          g.id === action.payload ? { ...g, unreadCount: 0 } : g,
        ),
      };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ChatDispatchValue {
  sendMessage: (groupId: string, text: string) => void;
  setActiveGroup: (groupId: string | null) => void;
  clearUnread: (groupId: string) => void;
}

const ChatStateContext = createContext<ChatState | undefined>(undefined);
const ChatDispatchContext = createContext<ChatDispatchValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const socketRef = useRef<MockSocket | null>(null);

  useEffect(() => {
    const socket = new MockSocket({ typingDuration: 2000 });
    socketRef.current = socket;

    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
    });

    socket.on('message', (msg: any) => {
      const sender = msg.status === 'received' ? 'other' : 'me';
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { ...msg, sender } as Message,
      });
    });

    socket.on('read', (data: any) => {
      dispatch({ type: 'MARK_READ', payload: { messageId: data.messageId } });
    });

    socket.on('typing', (data: any) => {
      dispatch({
        type: 'SET_TYPING',
        payload: { groupId: data.groupId, isTyping: data.isTyping },
      });
    });

    socket.connect(INITIAL_GROUPS);

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = useCallback((groupId: string, text: string) => {
    socketRef.current?.send({
      groupId,
      text,
      sender: 'me',
    });
  }, []);

  const setActiveGroup = useCallback((groupId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_GROUP', payload: groupId });
    if (groupId) {
      dispatch({ type: 'CLEAR_UNREAD', payload: groupId });
    }
  }, []);

  const clearUnread = useCallback((groupId: string) => {
    dispatch({ type: 'CLEAR_UNREAD', payload: groupId });
  }, []);

  const dispatchValue = { sendMessage, setActiveGroup, clearUnread };

  return (
    <ChatDispatchContext.Provider value={dispatchValue}>
      <ChatStateContext.Provider value={state}>
        {children}
      </ChatStateContext.Provider>
    </ChatDispatchContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useChatState() {
  const ctx = useContext(ChatStateContext);
  if (ctx === undefined) {
    throw new Error('useChatState must be used within a ChatProvider');
  }
  return ctx;
}

export function useChatDispatch() {
  const ctx = useContext(ChatDispatchContext);
  if (ctx === undefined) {
    throw new Error('useChatDispatch must be used within a ChatProvider');
  }
  return ctx;
}
